'use client';

import { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { useAtom } from 'jotai';
import { isGridEnabledAtom, gridSizeAtom, learningModeAtom } from '@/lib/store';
import { AlignLeft, AlignCenter, AlignRight, Bold, Italic, Trash2, SendToBack, BringToFront, Copy, Grid, HelpCircle } from 'lucide-react';
import { v4 as uuidv4 } from 'uuid';

type RightSidebarProps = {
    canvas: fabric.Canvas | null;
    selectedObjects: fabric.Object[];
};

export const RightSidebar = ({ canvas, selectedObjects }: RightSidebarProps) => {
    const [color, setColor] = useState('#000000');
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(1);
    const [opacity, setOpacity] = useState(1);

    // Text specific
    const [fontSize, setFontSize] = useState(20);
    const [fontFamily, setFontFamily] = useState('Inter');
    const [fontWeight, setFontWeight] = useState('400');
    const [textAlign, setTextAlign] = useState('left');

    // Real-time dimensions
    const [dimensions, setDimensions] = useState({ left: 0, top: 0, width: 0, height: 0, cornerRadius: 0 });

    // Grid State
    const [isGridEnabled, setIsGridEnabled] = useAtom(isGridEnabledAtom);
    const [gridSize, setGridSize] = useAtom(gridSizeAtom);
    const [learningMode, setLearningMode] = useAtom(learningModeAtom);

    const activeObject = selectedObjects[0];
    const isText = activeObject?.type === 'i-text' || activeObject?.type === 'text';

    useEffect(() => {
        if (activeObject) {
            setColor(activeObject.get('fill') as string || '#000000');
            setStrokeColor(activeObject.get('stroke') as string || '#000000');
            setStrokeWidth(activeObject.get('strokeWidth') || 0);
            setOpacity(activeObject.get('opacity') || 1);

            if (isText) {
                // @ts-ignore
                setFontSize(activeObject.fontSize || 20);
                // @ts-ignore
                setFontFamily(activeObject.fontFamily || 'Inter');
                // @ts-ignore
                setFontWeight(activeObject.fontWeight?.toString() || '400');
                // @ts-ignore
                setTextAlign(activeObject.textAlign || 'left');
            }
        }
    }, [activeObject, isText]);

    useEffect(() => {
        if (!canvas || !activeObject) return;

        const syncDimensions = () => {
            setDimensions({
                left: Math.round(activeObject.left || 0),
                top: Math.round(activeObject.top || 0),
                width: Math.round(activeObject.getScaledWidth()),
                height: Math.round(activeObject.getScaledHeight()),
                cornerRadius: (activeObject as any).rx || 0,
            });
        };

        syncDimensions();

        canvas.on('object:moving', syncDimensions);
        canvas.on('object:scaling', syncDimensions);
        canvas.on('object:rotating', syncDimensions);
        canvas.on('selection:updated', syncDimensions);

        return () => {
            canvas.off('object:moving', syncDimensions);
            canvas.off('object:scaling', syncDimensions);
            canvas.off('object:rotating', syncDimensions);
            canvas.off('selection:updated', syncDimensions);
        };
    }, [canvas, activeObject]);

    const handleUpdate = (updates: any) => {
        if (!canvas || !activeObject) return;

        activeObject.set(updates);
        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: activeObject });
    };

    const bringToFront = () => {
        if (!canvas || !activeObject) return;
        canvas.bringObjectToFront(activeObject);
        canvas.requestRenderAll();
        canvas.fire('object:modified');
    };

    const sendToBack = () => {
        if (!canvas || !activeObject) return;
        canvas.sendObjectToBack(activeObject);
        canvas.requestRenderAll();
        canvas.fire('object:modified');
    };

    const handleDelete = () => {
        if (!canvas) return;
        const active = canvas.getActiveObjects();
        if (active.length) {
            canvas.discardActiveObject();
            active.forEach((obj) => {
                canvas.remove(obj);
            });
            canvas.fire('object:removed'); // Trigger save
            canvas.requestRenderAll();
        }
    };

    const handleDuplicate = async () => {
        if (!canvas) return;
        const active = canvas.getActiveObjects();
        if (!active.length) return;

        active.forEach((obj) => {
            obj.clone().then((clonedObj) => {
                clonedObj.set({
                    left: (obj.left || 0) + 20,
                    top: (obj.top || 0) + 20,
                    evented: true,
                });

                if ((clonedObj as any).id) {
                    (clonedObj as any).id = uuidv4();
                }

                if (clonedObj.type === 'activeSelection') {
                    // active selection needs special handling
                    const selection = clonedObj as fabric.ActiveSelection;
                    selection.canvas = canvas;
                    selection.forEachObject((o: fabric.Object) => {
                        if ((o as any).id) (o as any).id = uuidv4();
                        canvas.add(o);
                    });
                    selection.setCoords();
                } else {
                    canvas.add(clonedObj);
                }

                canvas.setActiveObject(clonedObj);
                canvas.requestRenderAll();
                canvas.fire('object:modified'); // Trigger save
            });
        });
    };

    if (!activeObject) {
        return (
            <div className="fixed right-0 top-16 bottom-0 w-64 bg-white border-l border-gray-200 p-4 flex flex-col gap-6 shadow-lg z-40 overflow-y-auto">
                <h3 className="font-semibold text-gray-900">Canvas Settings</h3>

                <div className="space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <Grid className="w-4 h-4 text-gray-500" />
                            <span className="text-sm font-medium text-gray-700">Grid</span>
                        </div>
                        <div
                            className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${isGridEnabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                            onClick={() => setIsGridEnabled(!isGridEnabled)}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${isGridEnabled ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>

                    {isGridEnabled && (
                        <div className="flex items-center justify-between pl-6">
                            <span className="text-xs text-gray-500">Snap Size</span>
                            <div className="flex items-center gap-2">
                                <input
                                    type="range"
                                    min="8"
                                    max="100"
                                    step="4"
                                    value={gridSize}
                                    onChange={(e) => setGridSize(parseInt(e.target.value))}
                                    className="w-20"
                                />
                                <span className="text-xs text-gray-600 min-w-[30px] text-right">{gridSize}px</span>
                            </div>
                        </div>
                    )}
                </div>

                <div className="space-y-4 pt-4 border-t border-gray-100">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <HelpCircle className="w-4 h-4 text-orange-500" />
                            <span className="text-sm font-medium text-gray-700">Learning Mode</span>
                        </div>
                        <div
                            className={`w-10 h-5 rounded-full p-1 cursor-pointer transition-colors ${learningMode ? 'bg-orange-500' : 'bg-gray-300'}`}
                            onClick={() => setLearningMode(!learningMode)}
                        >
                            <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${learningMode ? 'translate-x-5' : 'translate-x-0'}`} />
                        </div>
                    </div>
                    {learningMode && (
                        <p className="text-[11px] text-gray-500 leading-relaxed italic">
                            Hover over any tool to see AI explanations and design tips.
                        </p>
                    )}
                </div>

                <div className="text-gray-400 text-xs text-center mt-10 p-4 border-t border-gray-100">
                    Select an object to see more properties
                </div>
            </div>
        );
    }

    return (
        <div className="fixed right-0 top-16 bottom-0 w-64 bg-white border-l border-gray-200 p-4 flex flex-col gap-6 shadow-lg z-40 overflow-y-auto">
            <h3 className="font-semibold text-gray-900">Properties</h3>

            {/* Position & Size */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Layout</label>
                <div className="grid grid-cols-2 gap-x-4 gap-y-3">
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-400 font-bold">X</label>
                        <input
                            type="number"
                            value={dimensions.left}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setDimensions(prev => ({ ...prev, left: val }));
                                handleUpdate({ left: val });
                            }}
                            className="w-full bg-gray-50 border-none rounded p-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-400 font-bold">Y</label>
                        <input
                            type="number"
                            value={dimensions.top}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setDimensions(prev => ({ ...prev, top: val }));
                                handleUpdate({ top: val });
                            }}
                            className="w-full bg-gray-50 border-none rounded p-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-400 font-bold">W</label>
                        <input
                            type="number"
                            value={dimensions.width}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (activeObject) {
                                    setDimensions(prev => ({ ...prev, width: val }));
                                    handleUpdate({ width: val, scaleX: 1 });
                                }
                            }}
                            className="w-full bg-gray-50 border-none rounded p-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-400 font-bold">H</label>
                        <input
                            type="number"
                            value={dimensions.height}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                if (activeObject) {
                                    setDimensions(prev => ({ ...prev, height: val }));
                                    handleUpdate({ height: val, scaleY: 1 });
                                }
                            }}
                            className="w-full bg-gray-50 border-none rounded p-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                </div>

                {activeObject.type === 'rect' && (
                    <div className="space-y-1">
                        <label className="text-[10px] uppercase text-gray-400 font-bold tracking-tight">Corner Radius</label>
                        <input
                            type="number"
                            min="0"
                            value={Math.round(dimensions.cornerRadius)}
                            onChange={(e) => {
                                if (!activeObject) return;
                                let val = parseInt(e.target.value);
                                const maxRadius = Math.min(activeObject.width || 0, activeObject.height || 0) / 2;
                                val = Math.max(0, Math.min(val, maxRadius));

                                setDimensions(prev => ({ ...prev, cornerRadius: val }));
                                handleUpdate({ rx: val, ry: val });
                            }}
                            className="w-full bg-gray-50 border-none rounded p-1.5 text-sm focus:ring-1 focus:ring-blue-500 outline-none"
                        />
                    </div>
                )}
            </div>

            {/* Appearance */}
            <div className="space-y-3">
                <label className="text-sm font-medium text-gray-700">Appearance</label>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Fill</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={color}
                            onChange={(e) => {
                                setColor(e.target.value);
                                handleUpdate({ fill: e.target.value });
                            }}
                            className="w-6 h-6 rounded border cursor-pointer border-gray-300"
                        />
                        <span className="text-xs text-gray-400 uppercase">{color}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Stroke</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={strokeColor}
                            onChange={(e) => {
                                setStrokeColor(e.target.value);
                                handleUpdate({ stroke: e.target.value });
                            }}
                            className="w-6 h-6 rounded border cursor-pointer border-gray-300"
                        />
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Width</span>
                    <input
                        type="number"
                        min="0"
                        value={strokeWidth}
                        onChange={(e) => {
                            const val = parseInt(e.target.value);
                            setStrokeWidth(val);
                            handleUpdate({ strokeWidth: val });
                        }}
                        className="w-16 p-1 text-sm border-b border-gray-300 outline-none"
                    />
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Opacity</span>
                    <input
                        type="range"
                        min="0"
                        max="1"
                        step="0.1"
                        value={opacity}
                        onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setOpacity(val);
                            handleUpdate({ opacity: val });
                        }}
                        className="w-24"
                    />
                </div>
            </div>

            {/* Typography (if text) */}
            {isText && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <label className="text-sm font-medium text-gray-700">Typography</label>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Font</span>
                        <select
                            value={fontFamily}
                            onChange={(e) => {
                                setFontFamily(e.target.value);
                                handleUpdate({ fontFamily: e.target.value });
                            }}
                            className="bg-gray-50 border-none rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-32"
                        >
                            <option value="Inter">Inter</option>
                            <option value="Arial">Arial</option>
                            <option value="Helvetica">Helvetica</option>
                            <option value="Times New Roman">Times New Roman</option>
                            <option value="Georgia">Georgia</option>
                            <option value="Courier New">Courier New</option>
                            <option value="Verdana">Verdana</option>
                            <option value="Trebuchet MS">Trebuchet MS</option>
                            <option value="Palatino">Palatino</option>
                            <option value="Garamond">Garamond</option>
                            <option value="Impact">Impact</option>
                            <option value="Comic Sans MS">Comic Sans MS</option>
                            <option value="Roboto">Roboto</option>
                            <option value="Oswald">Oswald</option>
                            <option value="Montserrat">Montserrat</option>
                            <option value="Playfair Display">Playfair Display</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Weight</span>
                        <select
                            value={fontWeight}
                            onChange={(e) => {
                                setFontWeight(e.target.value);
                                handleUpdate({ fontWeight: e.target.value });
                            }}
                            className="bg-gray-50 border-none rounded p-1 text-xs focus:ring-1 focus:ring-blue-500 outline-none w-32"
                        >
                            <option value="100">Thin (100)</option>
                            <option value="200">Extra Light (200)</option>
                            <option value="300">Light (300)</option>
                            <option value="400">Regular (400)</option>
                            <option value="500">Medium (500)</option>
                            <option value="600">Semi Bold (600)</option>
                            <option value="700">Bold (700)</option>
                            <option value="800">Extra Bold (800)</option>
                            <option value="900">Black (900)</option>
                        </select>
                    </div>

                    <div className="flex items-center justify-between">
                        <span className="text-xs text-gray-500">Size</span>
                        <input
                            type="number"
                            value={fontSize}
                            onChange={(e) => {
                                const val = parseInt(e.target.value);
                                setFontSize(val);
                                handleUpdate({ fontSize: val });
                            }}
                            className="w-16 p-1 text-sm border-b border-gray-300 outline-none"
                        />
                    </div>

                    <div className="flex gap-2">
                        <button
                            onClick={() => {
                                const newWeight = fontWeight === 'bold' || fontWeight === '700' ? '400' : '700';
                                setFontWeight(newWeight);
                                handleUpdate({ fontWeight: newWeight });
                            }}
                            className={`p-1 hover:bg-gray-100 rounded ${fontWeight === 'bold' || fontWeight === '700' ? 'bg-blue-100 text-blue-600' : ''}`}
                        >
                            <Bold className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleUpdate({ fontStyle: activeObject.get('fontStyle') === 'italic' ? 'normal' : 'italic' })}
                            className={`p-1 hover:bg-gray-100 rounded ${activeObject.get('fontStyle') === 'italic' ? 'bg-blue-100 text-blue-600' : ''}`}
                        >
                            <Italic className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleUpdate({ textAlign: 'left' })}
                            className={`p-1 hover:bg-gray-100 rounded ${activeObject.get('textAlign') === 'left' ? 'bg-blue-100 text-blue-600' : ''}`}
                        >
                            <AlignLeft className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleUpdate({ textAlign: 'center' })}
                            className={`p-1 hover:bg-gray-100 rounded ${activeObject.get('textAlign') === 'center' ? 'bg-blue-100 text-blue-600' : ''}`}
                        >
                            <AlignCenter className="w-4 h-4" />
                        </button>
                        <button
                            onClick={() => handleUpdate({ textAlign: 'right' })}
                            className={`p-1 hover:bg-gray-100 rounded ${activeObject.get('textAlign') === 'right' ? 'bg-blue-100 text-blue-600' : ''}`}
                        >
                            <AlignRight className="w-4 h-4" />
                        </button>
                    </div>
                </div>
            )}

            {/* Actions */}
            <div className="pt-4 border-t border-gray-100 flex flex-col gap-2">
                <button onClick={bringToFront} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded">
                    <BringToFront className="w-4 h-4" /> Bring to Front
                </button>
                <button onClick={handleDuplicate} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded">
                    <Copy className="w-4 h-4" /> Duplicate
                </button>
                <button onClick={sendToBack} className="flex items-center gap-2 text-xs text-gray-600 hover:text-gray-900 p-2 hover:bg-gray-50 rounded">
                    <SendToBack className="w-4 h-4" /> Send to Back
                </button>
                <button onClick={handleDelete} className="flex items-center gap-2 text-xs text-red-600 hover:text-red-700 p-2 hover:bg-red-50 rounded mt-2">
                    <Trash2 className="w-4 h-4" /> Delete
                </button>
            </div>
        </div>
    );
};
