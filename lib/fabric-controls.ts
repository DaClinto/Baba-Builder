import * as fabric from 'fabric';

export const setupFabricControls = () => {
    console.log('--- RE-INITIALIZING FIGMA CONTROLS ---');

    // Custom controls for Rectangle Corner Radius
    const cornerRadiusControl = new fabric.Control({
        x: 0.5,
        y: 0.5,
        cursorStyle: 'pointer',
        actionName: 'rounding',

        positionHandler: (dim: any, finalMatrix: any, fabricObject: any) => {
            const rect = fabricObject as fabric.Rect;
            const rx = (rect.rx || 0);
            const ry = (rect.ry || 0);

            // Offset a bit so they are visible even at 0 radius
            const displayX = rx + 12;
            const displayY = ry + 12;

            const posX = (rect.width! / 2) * (dim.x > 0 ? 1 : -1) - (displayX * (dim.x > 0 ? 1 : -1));
            const posY = (rect.height! / 2) * (dim.y > 0 ? 1 : -1) - (displayY * (dim.y > 0 ? 1 : -1));

            return fabric.util.transformPoint(new fabric.Point(posX, posY), finalMatrix);
        },

        actionHandler: (eventData: any, transform: any, x: number, y: number) => {
            const target = transform.target as fabric.Rect;
            const localP = (target as any).toLocalPoint(new fabric.Point(x, y), 'center', 'center');

            const distSideX = Math.abs(target.width! / 2) - Math.abs(localP.x);
            const distSideY = Math.abs(target.height! / 2) - Math.abs(localP.y);

            let radius = Math.max(distSideX, distSideY) - 12;
            const maxRadius = Math.min(target.width!, target.height!) / 2;
            radius = Math.max(0, Math.min(radius, maxRadius));

            target.set({ rx: radius, ry: radius });
            return true;
        },

        render: (ctx, left, top, styleOverride, fabricObject) => {
            ctx.save();
            ctx.translate(left, top);

            // Figma-style circle handle
            ctx.beginPath();
            ctx.arc(0, 0, 5, 0, Math.PI * 2);
            ctx.fillStyle = '#ffffff';
            ctx.fill();
            ctx.strokeStyle = '#3b82f6';
            ctx.lineWidth = 1.5;
            ctx.stroke();

            // Inner circle
            ctx.beginPath();
            ctx.arc(0, 0, 2, 0, Math.PI * 2);
            ctx.fillStyle = '#3b82f6';
            ctx.fill();

            ctx.restore();
        }
    });

    // Check both standard classes
    const classesToUpdate = [fabric.Rect];

    classesToUpdate.forEach(Cls => {
        if (!Cls) return;

        // Ensure controls are NOT shared with the base Object
        // This is the most common reason for prototypes not working as expected
        if (Cls.prototype.controls === fabric.Object.prototype.controls) {
            Cls.prototype.controls = { ...fabric.Object.prototype.controls };
        }

        const controls = Cls.prototype.controls;
        controls.tr_radius = new fabric.Control({ ...cornerRadiusControl, x: 0.5, y: -0.5 });
        controls.br_radius = new fabric.Control({ ...cornerRadiusControl, x: 0.5, y: 0.5 });
        controls.bl_radius = new fabric.Control({ ...cornerRadiusControl, x: -0.5, y: 0.5 });
        controls.tl_radius = new fabric.Control({ ...cornerRadiusControl, x: -0.5, y: -0.5 });

        console.log(`Controls added to ${Cls.name || 'Class'}`);
    });
};
