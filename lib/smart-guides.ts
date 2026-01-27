import * as fabric from 'fabric';

const snappingDistance = 10;
const guidingLineColor = '#FF4500'; // Figma-like orange
const guidingLineWidth = 1;
const distanceColor = '#FF4500';
const distanceFontSize = 10;

export const initSmartGuides = (canvas: fabric.Canvas) => {
    let ctx = canvas.getContext();
    let aligningLineVertical: number | undefined;
    let aligningLineHorizontal: number | undefined;

    // Measurement lines state
    let distanceGuides: { x1: number, y1: number, x2: number, y2: number, distance: number, type: 'h' | 'v' }[] = [];

    let isShiftPressed = false;

    // We can use the canvas.e.shiftKey instead of global listeners if we have the event context, 
    // but global is safer for checking state during 'object:moving' which might not always expose the full event.
    window.addEventListener('keydown', (e) => {
        if (e.key === 'Shift') isShiftPressed = true;
    });

    window.addEventListener('keyup', (e) => {
        if (e.key === 'Shift') isShiftPressed = false;
    });

    const drawLine = (x1: number, y1: number, x2: number, y2: number, color = guidingLineColor, dash: number[] = []) => {
        ctx.save();
        ctx.lineWidth = guidingLineWidth;
        ctx.strokeStyle = color;
        if (dash.length > 0) ctx.setLineDash(dash);
        ctx.beginPath();
        ctx.moveTo(x1, y1);
        ctx.lineTo(x2, y2);
        ctx.stroke();
        ctx.restore();
    };

    const drawDistance = (x: number, y: number, distance: number) => {
        const text = `${Math.abs(Math.round(distance))}px`;
        ctx.save();
        ctx.font = `bold ${distanceFontSize}px Inter, sans-serif`;
        ctx.fillStyle = distanceColor;

        const metrics = ctx.measureText(text);
        const padding = 4;
        const bgW = metrics.width + padding * 2;
        const bgH = distanceFontSize + padding;

        // Draw small background for text
        ctx.fillStyle = 'rgba(255, 69, 0, 0.1)';
        ctx.fillRect(x - bgW / 2, y - bgH / 2, bgW, bgH);

        ctx.fillStyle = distanceColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(text, x, y);
        ctx.restore();
    };

    const isInRange = (value1: number, value2: number) => {
        return Math.abs(value1 - value2) <= snappingDistance;
    };

    canvas.on('before:render', () => {
        aligningLineVertical = undefined;
        aligningLineHorizontal = undefined;
        distanceGuides = [];
    });

    canvas.on('after:render', () => {
        // Draw alignment lines
        if (aligningLineVertical !== undefined) {
            drawLine(aligningLineVertical, 0, aligningLineVertical, canvas.height!);
        }
        if (aligningLineHorizontal !== undefined) {
            drawLine(0, aligningLineHorizontal, canvas.width!, aligningLineHorizontal);
        }

        // Draw measurement lines
        distanceGuides.forEach(guide => {
            drawLine(guide.x1, guide.y1, guide.x2, guide.y2, distanceColor, [2, 2]);
            const midX = (guide.x1 + guide.x2) / 2;
            const midY = (guide.y1 + guide.y2) / 2;
            drawDistance(midX, midY, guide.distance);
        });
    });

    canvas.on('object:moving', (e) => {
        // PER REQUEST: Guides visible when moving elements with Shift Key
        if (!isShiftPressed) return;

        const activeObject = e.target;
        if (!activeObject) return;

        const objects = canvas.getObjects().filter(obj => obj !== activeObject && obj.selectable && !(obj as any).isFrame);

        const activeBounds = activeObject.getBoundingRect();
        const activeCenter = activeObject.getCenterPoint();

        let vSnap: number | undefined;
        let hSnap: number | undefined;

        for (let i = 0; i < objects.length; i++) {
            const item = objects[i];
            const itemBounds = item.getBoundingRect();
            const itemCenter = item.getCenterPoint();

            // 1. VERTICAL ALIGNMENT (X-axis)
            const vPoints = [
                { a: activeBounds.left, i: itemBounds.left, type: 'left-left' },
                { a: activeBounds.left, i: itemBounds.left + itemBounds.width, type: 'left-right' },
                { a: activeCenter.x, i: itemCenter.x, type: 'center-center' },
                { a: activeBounds.left + activeBounds.width, i: itemBounds.left, type: 'right-left' },
                { a: activeBounds.left + activeBounds.width, i: itemBounds.left + itemBounds.width, type: 'right-right' }
            ];

            for (const pt of vPoints) {
                if (isInRange(pt.a, pt.i)) {
                    vSnap = pt.i;
                    if (pt.type.includes('center')) {
                        activeObject.setPositionByOrigin(new fabric.Point(vSnap, activeCenter.y), 'center', 'center');
                    } else if (pt.type.startsWith('left')) {
                        activeObject.set({ left: vSnap });
                    } else {
                        activeObject.set({ left: vSnap - activeBounds.width });
                    }
                    aligningLineVertical = vSnap;
                    break;
                }
            }

            // 2. HORIZONTAL ALIGNMENT (Y-axis)
            const hPoints = [
                { a: activeBounds.top, i: itemBounds.top, type: 'top-top' },
                { a: activeBounds.top, i: itemBounds.top + itemBounds.height, type: 'top-bottom' },
                { a: activeCenter.y, i: itemCenter.y, type: 'center-center' },
                { a: activeBounds.top + activeBounds.height, i: itemBounds.top, type: 'bottom-top' },
                { a: activeBounds.top + activeBounds.height, i: itemBounds.top + itemBounds.height, type: 'bottom-bottom' }
            ];

            for (const pt of hPoints) {
                if (isInRange(pt.a, pt.i)) {
                    hSnap = pt.i;
                    if (pt.type.includes('center')) {
                        activeObject.setPositionByOrigin(new fabric.Point(activeObject.getCenterPoint().x, hSnap), 'center', 'center');
                    } else if (pt.type.startsWith('top')) {
                        activeObject.set({ top: hSnap });
                    } else {
                        activeObject.set({ top: hSnap - activeBounds.height });
                    }
                    aligningLineHorizontal = hSnap;
                    break;
                }
            }

            // 3. MEASURE DISTANCE if within reasonable proximity (e.g. 200px)
            const prox = 300;
            // X distance
            if (activeBounds.top < itemBounds.top + itemBounds.height && activeBounds.top + activeBounds.height > itemBounds.top) {
                const dist = activeBounds.left - (itemBounds.left + itemBounds.width);
                if (dist > 0 && dist < prox) {
                    distanceGuides.push({
                        x1: itemBounds.left + itemBounds.width,
                        y1: activeCenter.y,
                        x2: activeBounds.left,
                        y2: activeCenter.y,
                        distance: dist, type: 'h'
                    });
                } else if (dist < 0 && Math.abs(itemBounds.left - (activeBounds.left + activeBounds.width)) < prox && itemBounds.left - (activeBounds.left + activeBounds.width) > 0) {
                    const d = itemBounds.left - (activeBounds.left + activeBounds.width);
                    distanceGuides.push({
                        x1: activeBounds.left + activeBounds.width,
                        y1: activeCenter.y,
                        x2: itemBounds.left,
                        y2: activeCenter.y,
                        distance: d, type: 'h'
                    });
                }
            }

            // Y distance
            if (activeBounds.left < itemBounds.left + itemBounds.width && activeBounds.left + activeBounds.width > itemBounds.left) {
                const dist = activeBounds.top - (itemBounds.top + itemBounds.height);
                if (dist > 0 && dist < prox) {
                    distanceGuides.push({
                        x1: activeCenter.x,
                        y1: itemBounds.top + itemBounds.height,
                        x2: activeCenter.x,
                        y2: activeBounds.top,
                        distance: dist, type: 'v'
                    });
                } else if (dist < 0 && Math.abs(itemBounds.top - (activeBounds.top + activeBounds.height)) < prox && itemBounds.top - (activeBounds.top + activeBounds.height) > 0) {
                    const d = itemBounds.top - (activeBounds.top + activeBounds.height);
                    distanceGuides.push({
                        x1: activeCenter.x,
                        y1: activeBounds.top + activeBounds.height,
                        x2: activeCenter.x,
                        y2: itemBounds.top,
                        distance: d, type: 'v'
                    });
                }
            }
        }

        canvas.requestRenderAll();
    });

    canvas.on('mouse:up', () => {
        aligningLineVertical = undefined;
        aligningLineHorizontal = undefined;
        distanceGuides = [];
        canvas.requestRenderAll();
    });
};
