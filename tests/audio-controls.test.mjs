import { readFileSync } from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';
import test from 'node:test';

const source = readFileSync(new URL('../main.js', import.meta.url), 'utf8');
function setup() {
    const nodes = [];
    const param = () => ({
        value: 0, events: [],
        setValueAtTime(value, time) { this.value = value; this.events.push(['set', value, time]); },
        linearRampToValueAtTime(value, time) { this.events.push(['linear', value, time]); },
        exponentialRampToValueAtTime(value, time) { this.events.push(['exponential', value, time]); },
        setTargetAtTime(value, time, constant) { this.events.push(['target', value, time, constant]); },
        cancelScheduledValues() {}, cancelAndHoldAtTime(time) { this.events.push(["hold", this.value, time]); }
    });
    const node = kind => {
        const result = { kind, connections: [], gain: param(), frequency: param(), Q: param(), delayTime: param(), threshold: param(), knee: param(), ratio: param(), attack: param(), release: param(),
            connect(other) { this.connections.push(other); }, disconnect() {}, start() {},
            stop(time) { this.stoppedAt = time; } };
        nodes.push(result);
        return result;
    };
    const context = {
        sampleRate: 8000, currentTime: 10, destination: {}, state: 'running',
        createDynamicsCompressor: () => node('compressor'), createGain: () => node('gain'), createBiquadFilter: () => node('filter'),
        createDelay: () => node('delay'), createConvolver: () => node('convolver'),
        createBufferSource: () => node('source'), createOscillator: () => node('oscillator'),
        createBuffer(channels, length) {
            const data = Array.from({ length: channels }, () => new Float32Array(length));
            return { getChannelData: channel => data[channel] };
        }
    };
    const sandbox = vm.createContext({
        window: { AudioContext: function() { return context; } },
        document: { getElementById: () => ({}) }, setTimeout() {},
        THREE: { MathUtils: { clamp: (x, lo, hi) => Math.max(lo, Math.min(hi, x)), lerp: (a, b, t) => a + (b-a)*t } },
        referenceFrequency: 294, referenceLength: 1, lengthToFrequency: () => 440, ITR_DESIGN: { active: 0x00ff00 },
    });
    vm.runInContext('Math.random = () => 0.75;', sandbox);
    vm.runInContext(source.slice(source.indexOf('let audioContext ='), source.indexOf('function extractEdges(')), sandbox);
    vm.runInContext(source.slice(source.indexOf('function setAudioParamSmoothly('), source.indexOf('// Tone controls')), sandbox);
    return { nodes, run: code => vm.runInContext(code, sandbox) };
}


test('Pizz and Arco share waveform, pitch and filter', () => {
 const {nodes,run}=setup();
 run('pluck(440); startArco({userData:{length:1},material:{color:{set(){}}}})');
 const oscillators=nodes.filter(n=>n.kind==='oscillator');
 assert.equal(oscillators.length,2);
 for(const osc of oscillators){
  assert.equal(osc.type,'sawtooth'); assert.equal(osc.frequency.value,440);
  assert.equal(osc.connections[0].frequency.value,3100);
  assert.equal(osc.connections[0].Q.value,1.2);

 }
});
test('shared waveform updates Pizz, Arco, release tails and new notes',()=>{
 const {nodes,run}=setup();
 run('pluck(440); const string={userData:{length:1},material:{color:{set(){}}}}; startArco(string); stopArco(string); setWaveform("sine"); pluck(220)');
 for(const osc of nodes.filter(n=>n.kind==='oscillator')) assert.equal(osc.type,'sine');
 run('setWaveform("invalid")'); assert.equal(run('waveform'),'sine');
 run('setWaveform("sawtooth")');
 for(const osc of nodes.filter(n=>n.kind==='oscillator')) assert.equal(osc.type,'sawtooth');
});
test('Pizz uses a fixed short decay and Arco retains original release',()=>{
 const {nodes,run}=setup();
 run('pluck(440); const string={userData:{length:1},material:{color:{set(){}}}}; startArco(string)');
 const [pizz,arco]=nodes.filter(n=>n.kind==='oscillator');
 const events=pizz.connections[0].connections[0].gain.events;
 assert.equal(events[0][1],0); assert.equal(events[1][1],0.12); assert.equal(events[1][2],10.002);
 assert.equal(events.at(-1)[1],0); assert.equal(events.at(-1)[2],10.6);
 assert.equal(pizz.stoppedAt,10.62); assert.equal(arco.stoppedAt,undefined);
 assert.equal(arco.connections[0].connections[0].gain.events[1][2],10.1);
 run('stopArco(string)');
 assert.ok(Math.abs(arco.stoppedAt-11.32)<1e-9);
 assert.equal(arco.connections[0].connections[0].gain.events.at(-2)[2],10.16);
});
test('completed voices disconnect and are removed from waveform updates',()=>{
 const {nodes,run}=setup(); run('pluck(440)');
 const osc=nodes.find(n=>n.kind==='oscillator'); osc.onended();
 assert.equal(run('activeVoices.size'),0);
});
test('Tone remains shared and Open can bypass it',()=>{
 const {run}=setup(); run('toneEnvelope.cutoff=100; initAudio()');
 assert.equal(run('toneDry.gain.value'),1); assert.equal(run('toneWet.gain.value'),0);
 run('toneEnvelope.cutoff=0; toneEnvelope.resonance=100; updateToneFilter()');
 assert.equal(run('toneFilter.frequency.events.at(-1)[1]'),80);
 assert.equal(run('toneFilter.Q.events.at(-1)[1]'),5.707);
});

test('Saw cutoff starts at the slider midpoint with the filter enabled',()=>{
 const {run}=setup(); run('initAudio()');
 assert.equal(run('toneEnvelope.cutoff'),50);
 assert.ok(Math.abs(run('toneFilter.frequency.value')-80*Math.sqrt(200))<1e-6);
 assert.equal(run('toneWet.gain.value'),1);
});

test('full mix including effects passes through fast compression and headroom',()=>{
 const {nodes,run}=setup(); run('initAudio()');
 const compressor=nodes.find(n=>n.kind==='compressor');
 assert.equal(run('masterGain.connections[0].kind'),'compressor');
 assert.equal(compressor.attack.value,0);
 assert.equal(compressor.ratio.value,20);
 assert.equal(compressor.connections[0].gain.value,0.8);
});

test('Sine bypasses Tone and Saw restores the retained filter settings',()=>{
 const {run}=setup();
 run('toneEnvelope.cutoff=40; toneEnvelope.resonance=80; initAudio(); setWaveform("sine")');
 assert.equal(run('toneDry.gain.events.at(-1)[1]'),1);
 assert.equal(run('toneWet.gain.events.at(-1)[1]'),0);
 run('setWaveform("sawtooth")');
 assert.equal(run('toneEnvelope.cutoff'),40);
 assert.equal(run('toneEnvelope.resonance'),80);
 assert.equal(run('toneWet.gain.events.at(-1)[1]'),1);
});
