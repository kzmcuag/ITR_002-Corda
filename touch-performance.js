// Pointer capture keeps a gesture coherent when fingers move off the canvas.
export function installTouchPerformance(canvas, actions) {
    const points = new Map();
    let count = 0;
    function update(kind) {
        const next = points.size;
        if (next !== count) actions.reset();
        if (next === 1) actions.pizz([...points.values()][0], kind === 'down' || count !== 1, kind);
        if (next === 2) actions.arco([...points.values()], count !== 2);
        count = next;
    }
    for (const type of ['pointerdown', 'pointermove', 'pointerup', 'pointercancel', 'lostpointercapture']) {
        canvas.addEventListener(type, event => {
            if (event.pointerType !== 'touch') return;
            event.preventDefault();
            event.stopImmediatePropagation();
            if (type === 'pointerdown') {
                points.set(event.pointerId, { x: event.clientX, y: event.clientY });
                canvas.setPointerCapture(event.pointerId);
                actions.start();
                update('down');
            } else if (type === 'pointermove' && points.has(event.pointerId)) {
                points.set(event.pointerId, { x: event.clientX, y: event.clientY });
                update('move');
            } else if (points.delete(event.pointerId)) {
                update('up');
            }
        }, { capture: true, passive: false });
    }
    return () => { points.clear(); count = 0; actions.reset(); };
}
