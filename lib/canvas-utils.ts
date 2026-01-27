import * as fabric from 'fabric';
import { CanvasObject, ShapeType } from '@/types';
import { v4 as uuidv4 } from 'uuid';

// Generate unique ID for objects
export const generateObjectId = () => uuidv4();

// Create a rectangle
export const createRectangle = (options: any = {}): CanvasObject => {
    const rect = new fabric.Rect({
        left: 100,
        top: 100,
        fill: '#D9D9D9',
        width: 200,
        height: 150,
        stroke: 'transparent',
        strokeWidth: 0,
        strokeUniform: true,
        ...options,
    }) as CanvasObject;
    rect.objectId = generateObjectId();
    return rect;
};

// Create a circle
export const createCircle = (options: any = {}): CanvasObject => {
    const circle = new fabric.Circle({
        left: 100,
        top: 100,
        fill: '#D9D9D9',
        radius: 75,
        stroke: 'transparent',
        strokeWidth: 0,
        strokeUniform: true,
        ...options,
    }) as CanvasObject;
    circle.objectId = generateObjectId();
    return circle;
};

// Create a triangle
export const createTriangle = (options: any = {}): CanvasObject => {
    const triangle = new fabric.Triangle({
        left: 100,
        top: 100,
        fill: '#D9D9D9',
        width: 150,
        height: 150,
        stroke: 'transparent',
        strokeWidth: 0,
        strokeUniform: true,
        ...options,
    }) as CanvasObject;
    triangle.objectId = generateObjectId();
    return triangle;
};

// Create a line
export const createLine = (options: any = {}): CanvasObject => {
    const coords: [number, number, number, number] = [
        options.x1 !== undefined ? options.x1 : 50,
        options.y1 !== undefined ? options.y1 : 50,
        options.x2 !== undefined ? options.x2 : 250,
        options.y2 !== undefined ? options.y2 : 50,
    ];
    const line = new fabric.Line(coords, {
        stroke: '#000000',
        strokeWidth: 3,
        ...options,
    }) as CanvasObject;
    line.objectId = generateObjectId();
    return line;
};

// Create text
export const createText = (text: string = 'Text', options: any = {}): CanvasObject => {
    const textObj = new fabric.IText(text, {
        left: 100,
        top: 100,
        fill: '#000000',
        fontSize: 32,
        fontFamily: 'Inter, sans-serif',
        ...options,
    }) as CanvasObject;
    textObj.objectId = generateObjectId();
    return textObj;
};

// Create a frame (container)
export const createFrame = (options: any = {}): CanvasObject => {
    const frame = new fabric.Rect({
        left: 100,
        top: 100,
        fill: '#FFFFFF',
        width: 1440,
        height: 1024,
        stroke: '#E5E7EB', // Light gray border
        strokeWidth: 1,
        objectCaching: false,
        name: 'Frame', // Helpful for identifying
        isFrame: true,
        ...options,
    }) as CanvasObject;
    frame.objectId = generateObjectId();

    // Frames should usually be sent to back or have valid z-index, 
    // but for now we just create it.
    return frame;
};

// Serialize canvas to JSON
export const serializeCanvas = (canvas: fabric.Canvas) => {
    // In Fabric v6+, toObject returns the object representation
    return canvas.toObject(['objectId', 'locked', 'shadowOptions', 'rx', 'ry', 'isFrame', 'selectable', 'hasControls', 'evented', 'clipPath', 'cropX', 'cropY']);
};

// Load canvas from JSON
export const loadCanvasFromJSON = async (canvas: fabric.Canvas, json: any) => {
    try {
        if (!json) return;

        // Fabric v6 loadFromJSON returns a Promise
        await canvas.loadFromJSON(json);

        canvas.getObjects().forEach((obj: any) => {
            // Restore custom properties if necessary
            // In v6, properties designated in toObject should be preserved automatically
            if (!obj.objectId && json.objects) {
                // Try to match if needed, but usually v6 handles this
            }
        });

        canvas.renderAll();
        return canvas;
    } catch (error) {
        console.error('Error loading canvas:', error);
    }
};

// Export canvas as image
export const exportCanvasAsImage = (canvas: fabric.Canvas, format: 'png' | 'jpeg' = 'png') => {
    const dataURL = canvas.toDataURL({
        format,
        quality: 1,
        multiplier: 1, // Required in some types
    });
    return dataURL;
};

// Download canvas as image
export const downloadCanvasAsImage = (canvas: fabric.Canvas, filename: string = 'canvas') => {
    const dataURL = exportCanvasAsImage(canvas);
    const link = document.createElement('a');
    link.download = `${filename}.png`;
    link.href = dataURL;
    link.click();
};

export const exportCanvasAsJPG = (canvas: fabric.Canvas, filename: string = 'design') => {
    // JPG doesn't support transparency, so we ensure a white background if transparent
    const originalBg = canvas.backgroundColor;
    if (originalBg === 'transparent' || !originalBg) {
        canvas.backgroundColor = '#ffffff';
    }

    const dataURL = canvas.toDataURL({
        format: 'jpeg',
        quality: 0.9,
        multiplier: 2, // High res
    });

    // Restore background
    canvas.backgroundColor = originalBg;
    canvas.renderAll();

    const link = document.createElement('a');
    link.download = `${filename}.jpg`;
    link.href = dataURL;
    link.click();
};

// Get shape by type
export const createShapeByType = (type: ShapeType, options: any = {}): CanvasObject | null => {
    switch (type) {
        case ShapeType.Rectangle:
            return createRectangle(options);
        case ShapeType.Circle:
            return createCircle(options);
        case ShapeType.Triangle:
            return createTriangle(options);
        case ShapeType.Line:
            return createLine(options);
        case ShapeType.Text:
            return createText('Text', options);
        case ShapeType.Frame:
            return createFrame(options);
        default:
            return null;
    }
};

// Get object by ID
export const getObjectById = (canvas: fabric.Canvas, objectId: string): CanvasObject | undefined => {
    const objects = canvas.getObjects() as CanvasObject[];
    return objects.find(obj => obj.objectId === objectId);
};

// Delete selected objects
export const deleteSelectedObjects = (canvas: fabric.Canvas) => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length) {
        canvas.discardActiveObject();
        activeObjects.forEach((obj) => {
            canvas.remove(obj);
        });
        canvas.renderAll();
    }
};

// Alignment Functions
export const alignObjects = (canvas: fabric.Canvas, type: 'left' | 'center-h' | 'right' | 'top' | 'center-v' | 'bottom') => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length < 2) return;

    // Get the bounding box of the entire selection
    const selection = canvas.getActiveObject();
    if (!selection) return;

    const groupBounds = selection.getBoundingRect();

    activeObjects.forEach((obj) => {
        const objBounds = obj.getBoundingRect();

        switch (type) {
            case 'left':
                obj.set({ left: groupBounds.left + (obj.left! - objBounds.left) });
                break;
            case 'center-h':
                obj.set({ left: groupBounds.left + groupBounds.width / 2 - objBounds.width / 2 + (obj.left! - objBounds.left) });
                break;
            case 'right':
                obj.set({ left: groupBounds.left + groupBounds.width - objBounds.width + (obj.left! - objBounds.left) });
                break;
            case 'top':
                obj.set({ top: groupBounds.top + (obj.top! - objBounds.top) });
                break;
            case 'center-v':
                obj.set({ top: groupBounds.top + groupBounds.height / 2 - objBounds.height / 2 + (obj.top! - objBounds.top) });
                break;
            case 'bottom':
                obj.set({ top: groupBounds.top + groupBounds.height - objBounds.height + (obj.top! - objBounds.top) });
                break;
        }
    });

    canvas.requestRenderAll();
    canvas.fire('object:modified');
};

export const distributeObjects = (canvas: fabric.Canvas, type: 'horizontal' | 'vertical') => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length < 3) return;

    // Sort objects by their position
    if (type === 'horizontal') {
        activeObjects.sort((a, b) => a.left! - b.left!);
        const first = activeObjects[0];
        const last = activeObjects[activeObjects.length - 1];
        const totalSpan = last.left! - first.left!;
        const interval = totalSpan / (activeObjects.length - 1);

        activeObjects.forEach((obj, i) => {
            obj.set({ left: first.left! + i * interval });
        });
    } else {
        activeObjects.sort((a, b) => a.top! - b.top!);
        const first = activeObjects[0];
        const last = activeObjects[activeObjects.length - 1];
        const totalSpan = last.top! - first.top!;
        const interval = totalSpan / (activeObjects.length - 1);

        activeObjects.forEach((obj, i) => {
            obj.set({ top: first.top! + i * interval });
        });
    }

    canvas.requestRenderAll();
    canvas.fire('object:modified');
};

export const setGap = (canvas: fabric.Canvas, type: 'horizontal' | 'vertical', gap: number) => {
    const activeObjects = canvas.getActiveObjects();
    if (activeObjects.length < 2) return;

    if (type === 'horizontal') {
        activeObjects.sort((a, b) => a.left! - b.left!);
        let currentLeft = activeObjects[0].getBoundingRect().left;
        activeObjects.forEach((obj) => {
            const bounds = obj.getBoundingRect();
            const offset = obj.left! - bounds.left;
            obj.set({ left: currentLeft + offset });
            currentLeft += bounds.width + gap;
        });
    } else {
        activeObjects.sort((a, b) => a.top! - b.top!);
        let currentTop = activeObjects[0].getBoundingRect().top;
        activeObjects.forEach((obj) => {
            const bounds = obj.getBoundingRect();
            const offset = obj.top! - bounds.top;
            obj.set({ top: currentTop + offset });
            currentTop += bounds.height + gap;
        });
    }

    canvas.requestRenderAll();
    canvas.fire('object:modified');
};

export const clearCanvas = (canvas: fabric.Canvas) => {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
};
