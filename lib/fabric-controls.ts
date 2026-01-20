import * as fabric from 'fabric';

export const setupFabricControls = () => {
    console.log('--- RE-INITIALIZING FIGMA CONTROLS ---');

    // Custom controls for Rectangle Corner Radius
    const cornerRadiusControl = new fabric.Control({
        x: 0.5,
        y: 0.5,
        cursorStyle: 'nwse-resize',
        actionName: 'rounding',

        // Handle position logic (Figma-style: inside the corner)
        positionHandler: (dim: any, finalMatrix: any, fabricObject: any) => {
            const rect = fabricObject as fabric.Rect;
            const rx = (rect.rx || 0);
            const ry = (rect.ry || 0);

            // Handle offset from the edge
            const HANDLE_OFFSET = 8;

            // The handle stays at a fixed offset relative to the corner radius
            // but also clamped within the object dimensions
            const displayX = Math.max(HANDLE_OFFSET, rx);
            const displayY = Math.max(HANDLE_OFFSET, ry);

            const posX = (rect.width! / 2) * (dim.x > 0 ? 1 : -1) - (displayX * (dim.x > 0 ? 1 : -1));
            const posY = (rect.height! / 2) * (dim.y > 0 ? 1 : -1) - (displayY * (dim.y > 0 ? 1 : -1));

            return fabric.util.transformPoint(new fabric.Point(posX, posY), finalMatrix);
        },

        // Dragging logic
        actionHandler: (eventData: any, transform: any, x: number, y: number) => {
            const target = transform.target as fabric.Rect;
            const localP = (target as any).toLocalPoint(new fabric.Point(x, y), 'center', 'center');

            // Distance from the edges
            const distSideX = Math.abs(target.width! / 2) - Math.abs(localP.x);
            const distSideY = Math.abs(target.height! / 2) - Math.abs(localP.y);

            // Calculate new radius based on the displacement from the corner
            // Figma logic: moving towards the center increases radius
            let radius = Math.max(distSideX, distSideY);

            // Clamp radius: cannot exceed min(width, height) / 2
            const maxRadius = Math.min(target.width!, target.height!) / 2;
            radius = Math.max(0, Math.min(radius, maxRadius));

            target.set({ rx: radius, ry: radius });

            // Trigger a custom event for the tooltip in Canvas.tsx
            (target as any).fire('radius:changing', { radius: Math.round(radius) });

            return true;
        },

        render: (ctx, left, top, styleOverride, fabricObject) => {
            // Only show handles if the object is selected
            if (!(fabricObject as any).canvas?.getActiveObjects().includes(fabricObject)) return;

            ctx.save();
            ctx.translate(left, top);

            // Figma-style circular handle
            ctx.beginPath();
            ctx.arc(0, 0, 4, 0, Math.PI * 2); // r=4 as requested
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1;
            ctx.stroke();

            ctx.restore();
        }
    });

    // Check both standard classes
    const classesToUpdate = [fabric.Rect];

    classesToUpdate.forEach(Cls => {
        if (!Cls) return;

        // Ensure controls are NOT shared with the base Object
        if (Cls.prototype.controls === fabric.Object.prototype.controls) {
            Cls.prototype.controls = { ...fabric.Object.prototype.controls };
        }

        const controls = Cls.prototype.controls;

        // Add 4 corner handles
        controls.tr_radius = new fabric.Control({ ...cornerRadiusControl, x: 0.5, y: -0.5 });
        controls.br_radius = new fabric.Control({ ...cornerRadiusControl, x: 0.5, y: 0.5 });
        controls.bl_radius = new fabric.Control({ ...cornerRadiusControl, x: -0.5, y: 0.5 });
        controls.tl_radius = new fabric.Control({ ...cornerRadiusControl, x: -0.5, y: -0.5 });

        // Add a listener to reset radius on double click (simulated via handle)
        // Fabric controls don't easily support double click directly on the handle without more work, 
        // but we can handle it in the canvas.
    });
};
