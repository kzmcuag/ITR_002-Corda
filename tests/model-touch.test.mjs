import test from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
import {collectPlayableEdges, filterEdgeRange} from '../model-edges.js';
import {installTouchPerformance} from '../touch-performance.js';

test('range defaults to 5–100 and is scale independent',()=>{
 const segments=Array.from({length:100},(_,i)=>({length:i+1}));
 assert.equal(filterEdgeRange(segments).length,95);
 assert.equal(filterEdgeRange(segments,0,100).length,100);
 assert.equal(filterEdgeRange(segments,25,75).length,50);
 assert.equal(filterEdgeRange(segments.map(e=>({length:e.length*1000})),25,75).length,50);
 assert.equal(filterEdgeRange([{length:1},{length:1}],0,95).length,2);
 assert.deepEqual(filterEdgeRange([],0,95),[]);
});
test('bundled GLB loads and retains playable architecture',async()=>{
    const bytes=readFileSync(new URL('../public/models/test_plasticNumber.glb',import.meta.url));
    const gltf=await new GLTFLoader().parseAsync(bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),'');
    const result=collectPlayableEdges(gltf.scene);
    assert.ok(result.segments.length>0);
    assert.ok(result.segments.every(edge=>edge.length>=result.minimum));
    console.log('Default model:',result.segments.length,'playable;',result.ignored,'ignored; threshold',result.minimum);
});
test('one/two/three fingers, cancellation and mouse isolation',()=>{
    const handlers={}, calls=[];
    const canvas={addEventListener(type,handler){handlers[type]=handler;},setPointerCapture(){}};
    const reset=installTouchPerformance(canvas,{
        start(){calls.push('start');},reset(){calls.push('reset');},
        pizz(point,first,kind){calls.push(['pizz',first,kind]);},
        arco(points,first){calls.push(['arco',points.length,first]);}
    });
    const fire=(type,id,pointerType='touch')=>handlers[type]({pointerId:id,pointerType,clientX:id*10,clientY:20,preventDefault(){},stopImmediatePropagation(){}});
    fire('pointerdown',1); assert.deepEqual(calls.at(-1),['pizz',true,'down']);
    fire('pointerdown',2); assert.deepEqual(calls.at(-1),['arco',2,true]);
    fire('pointermove',2); assert.deepEqual(calls.at(-1),['arco',2,false]);
    fire('pointerdown',3); assert.equal(calls.at(-1),'reset');
    fire('pointerup',3); assert.deepEqual(calls.at(-1),['arco',2,true]);
    fire('pointercancel',2); assert.deepEqual(calls.at(-1),['pizz',true,'up']);
    fire('lostpointercapture',1); assert.equal(calls.at(-1),'reset');
    const before=calls.length; fire('pointerdown',4,'mouse'); assert.equal(calls.length,before);
    reset(); assert.equal(calls.at(-1),'reset');
});

test('View passes navigation events through and Play resumes without stale contacts',()=>{
    const handlers={}; let enabled=true, sounded=0, blocked=0;
    const reset=installTouchPerformance({addEventListener(t,h){handlers[t]=h;},setPointerCapture(){}},{
        enabled:()=>enabled, start(){sounded++;}, reset(){}, pizz(){sounded++;}, arco(){sounded++;}
    });
    const event={pointerType:'touch',pointerId:1,clientX:10,clientY:20,preventDefault(){blocked++;},stopImmediatePropagation(){blocked++;}};
    handlers.pointerdown(event); assert.ok(sounded>0);
    reset(); enabled=false;
    const before=sounded, previousBlocked=blocked;
    for(const handler of Object.values(handlers)) handler(event);
    assert.equal(sounded,before); assert.equal(blocked,previousBlocked);
    enabled=true;
    handlers.pointermove(event); assert.equal(sounded,before);
    handlers.pointerdown(event); assert.ok(sounded>before);
});
