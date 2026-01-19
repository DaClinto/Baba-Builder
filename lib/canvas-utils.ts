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
        fill: '#3b82f6',
        width: 200,
        height: 150,
        stroke: '#1e40af',
        strokeWidth: 2,
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
        fill: '#10b981',
        radius: 75,
        stroke: '#059669',
        strokeWidth: 2,
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
        fill: '#f59e0b',
        width: 150,
        height: 150,
        stroke: '#d97706',
        strokeWidth: 2,
        ...options,
    }) as CanvasObject;
    triangle.objectId = generateObjectId();
    return triangle;
};

// Create a line
export const createLine = (options: any = {}): CanvasObject => {
    const line = new fabric.Line([50, 50, 250, 50], {
        stroke: '#ef4444',
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
        fill: '#1f2937',
        fontSize: 32,
        fontFamily: 'Inter, sans-serif',
        ...options,
    }) as CanvasObject;
    textObj.objectId = generateObjectId();
    return textObj;
};

// Serialize canvas to JSON
export const serializeCanvas = (canvas: fabric.Canvas) => {
    // In Fabric v6+, toObject returns the object representation
    return canvas.toObject(['objectId']);
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

// Clear canvas
export const clearCanvas = (canvas: fabric.Canvas) => {
    canvas.clear();
    canvas.backgroundColor = '#ffffff';
    canvas.renderAll();
};
