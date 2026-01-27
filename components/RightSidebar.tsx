'use client';

import { useEffect, useState } from 'react';
import * as fabric from 'fabric';
import { useAtom } from 'jotai';
import { isGridEnabledAtom, gridSizeAtom, learningModeAtom, globalLoadingAtom, selectedToolAtom } from '@/lib/store';
import {
    AlignLeft,
    AlignCenter,
    AlignRight,
    Bold,
    Italic,
    Trash2,
    SendToBack,
    BringToFront,
    Copy,
    Grid,
    HelpCircle,
    Lock,
    Unlock,
    AlignStartVertical,
    AlignCenterVertical,
    AlignEndVertical,
    AlignStartHorizontal,
    AlignCenterHorizontal,
    AlignEndHorizontal,
    GalleryHorizontal,
    GalleryVertical,
    Image as ImageIcon,
    Loader2,
    RefreshCcw,
    Sparkles,
    Undo2,
    LayoutTemplate,
    Smartphone,
    Tablet,
    Monitor,
    FileText
} from 'lucide-react';
import { alignObjects, distributeObjects, createFrame, setGap } from '@/lib/canvas-utils';
import { ToolType } from '@/types';
import { v4 as uuidv4 } from 'uuid';
import { removeBackground } from '@imgly/background-removal';
import { TypographyControls } from './TypographyControls';
type RightSidebarProps = {
    canvas: fabric.Canvas | null;
    selectedObjects: fabric.Object[];
    selectedTool: ToolType;
};

const rgbaToHex = (color: string) => {
    if (!color) return '#000000';
    if (color.startsWith('#')) return color;

    // Handle rgb/rgba
    const match = color.match(/^rgba?\((\d+),\s*(\d+),\s*(\d+)(?:,\s*(\d+(?:\.\d+)?))?\)$/);
    if (!match) return '#000000';

    const r = parseInt(match[1]);
    const g = parseInt(match[2]);
    const b = parseInt(match[3]);

    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
};

export const RightSidebar = ({ canvas, selectedObjects, selectedTool }: RightSidebarProps) => {
    const [color, setColor] = useState('#000000');
    const [strokeColor, setStrokeColor] = useState('#000000');
    const [strokeWidth, setStrokeWidth] = useState(1);
    const [opacity, setOpacity] = useState(1);

    // Text specific
    const [fontSize, setFontSize] = useState(20);
    const [fontFamily, setFontFamily] = useState('Inter');
    const [fontWeight, setFontWeight] = useState('400');
    const [textAlign, setTextAlign] = useState('left');

    // Shadow state
    const [shadow, setShadow] = useState({
        enabled: false,
        offsetX: 5,
        offsetY: 5,
        blur: 10,
        color: '#000000',
        opacity: 0.5,
    });

    // Real-time dimensions
    const [dimensions, setDimensions] = useState({ left: 0, top: 0, width: 0, height: 0, cornerRadius: 0 });

    // Image removal state
    const [removingBackground, setRemovingBackground] = useState(false);
    const [removeBgError, setRemoveBgError] = useState<string | null>(null);
    const [showOriginal, setShowOriginal] = useState(false);

    // Grid State
    const [isGridEnabled, setIsGridEnabled] = useAtom(isGridEnabledAtom);
    const [gridSize, setGridSize] = useAtom(gridSizeAtom);
    const [learningMode, setLearningMode] = useAtom(learningModeAtom);
    const [globalLoading, setGlobalLoading] = useAtom(globalLoadingAtom);
    const [, setSelectedTool] = useAtom(selectedToolAtom);

    const activeObject = selectedObjects[0];
    const isText = activeObject?.type === 'i-text' || activeObject?.type === 'text';
    const isImage = activeObject?.type === 'image';

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

            // Sync shadow
            const activeShadow = activeObject.shadow as any;
            if (activeShadow) {
                setShadow({
                    enabled: true,
                    offsetX: activeShadow.offsetX || 0,
                    offsetY: activeShadow.offsetY || 0,
                    blur: activeShadow.blur || 0,
                    color: activeShadow.color || '#000000',
                    opacity: activeShadow.opacity || 1,
                });
            } else {
                setShadow(prev => ({ ...prev, enabled: false }));
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

        // If updating shadow
        if (updates.shadow) {
            if (updates.shadow.enabled) {
                const s = updates.shadow;
                // Convert hex to rgba to include opacity
                const hex = s.color || '#000000';
                const opacity = s.opacity ?? 1;

                // Simple hex to rgba conversion
                let r = 0, g = 0, b = 0;
                if (hex.length === 7) {
                    r = parseInt(hex.substring(1, 3), 16);
                    g = parseInt(hex.substring(3, 5), 16);
                    b = parseInt(hex.substring(5, 7), 16);
                }
                const rgba = `rgba(${r}, ${g}, ${b}, ${opacity})`;

                activeObject.set({
                    shadow: new fabric.Shadow({
                        color: rgba,
                        blur: s.blur || 0,
                        offsetX: s.offsetX || 0,
                        offsetY: s.offsetY || 0,
                        //@ts-ignore
                        affectStroke: true,
                    })
                });
            } else {
                activeObject.set({ shadow: null });
            }
        } else {
            activeObject.set(updates);
        }

        canvas.requestRenderAll();
        canvas.fire('object:modified', { target: activeObject });
    };

    const handleRemoveBackground = async () => {
        if (!isImage || !activeObject || removingBackground) return;

        // Add a "Warning" as requested by user
        const confirmed = confirm("This process uses AI and might take a minute on the first run as we download the required models (approx 50MB). Continue?");
        if (!confirmed) return;

        setRemovingBackground(true);
        setRemoveBgError(null);
        setGlobalLoading({ loading: true, message: 'AI Background Removal... Downloading models & processing locally.' });

        try {
            // Get image source
            const imgElement = (activeObject as any)._element;
            if (!imgElement) throw new Error('Image element not found');

            // Save original src for before/after toggle if not already saved
            if (!(activeObject as any).originalSrc) {
                (activeObject as any).originalSrc = (activeObject as any).getSrc();
            }

            const currentSrc = (activeObject as any).getSrc();

            // Remove background
            console.log('Starting AI background removal for:', currentSrc.substring(0, 100) + '...');
            const blob = await (removeBackground as any)(currentSrc, {
                progress: (key: string, current: number, total: number) => {
                    const pct = Math.round((current / total) * 100);
                    console.log(`AI Progress [${key}]: ${pct}%`);
                    setGlobalLoading({
                        loading: true,
                        message: `AI Background Removal... ${key.replace('_', ' ')} (${pct}%)`
                    });
                }
            });

            console.log('AI processing complete, blob size:', blob.size);
            if (blob.size < 100) throw new Error('Processed image is too small (likely failed)');

            // Convert blob to DataURL
            const reader = new FileReader();
            reader.onloadend = async () => {
                const base64data = reader.result as string;
                console.log('Processed image data received, updating canvas...');

                try {
                    // Update object - In Fabric v7 setSrc returns a Promise
                    await (activeObject as any).setSrc(base64data);

                    (activeObject as any).removedBgSrc = base64data;
                    canvas?.requestRenderAll();
                    canvas?.fire('object:modified');

                    setRemovingBackground(false);
                    setShowOriginal(false);
                    setGlobalLoading(null);
                    console.log('Background removed successfully.');
                } catch (err) {
                    console.error('Error updating fabric image source:', err);
                    setRemoveBgError('Failed to update image on canvas.');
                    setRemovingBackground(false);
                    setGlobalLoading(null);
                }
            };
            reader.readAsDataURL(blob);

        } catch (error) {
            console.error('Failed to remove background:', error);
            setRemoveBgError('Failed to process image. Try another one.');
            setRemovingBackground(false);
            setGlobalLoading(null);
        }
    };

    const toggleOriginal = () => {
        if (!isImage || !activeObject) return;
        const obj = activeObject as any;
        const targetSrc = showOriginal ? obj.removedBgSrc : obj.originalSrc;

        if (targetSrc) {
            (obj as any).setSrc(targetSrc).then(() => {
                setShowOriginal(!showOriginal);
                canvas?.requestRenderAll();
            });
        }
    };

    const handleLock = () => {
        if (!canvas || !activeObject) return;
        const isLocked = !(activeObject as any).locked;

        activeObject.set({
            locked: isLocked,
            selectable: !isLocked,
            hasControls: !isLocked,
            lockMovementX: isLocked,
            lockMovementY: isLocked,
            lockRotation: isLocked,
            lockScalingX: isLocked,
            lockScalingY: isLocked
        } as any);

        canvas.discardActiveObject();
        canvas.requestRenderAll();
        canvas.fire('object:modified');
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
            if (active.length > 5 && !confirm(`Delete ${active.length} items?`)) return;

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
        const activeObject = canvas.getActiveObject();
        if (!activeObject) return;

        activeObject.clone().then((clonedObj: any) => {
            canvas.discardActiveObject();
            clonedObj.set({
                left: clonedObj.left + 20,
                top: clonedObj.top + 20,
                evented: true,
            });

            if (clonedObj.type === 'activeSelection') {
                // Active selection needs to be added to canvas object by object
                clonedObj.canvas = canvas;
                clonedObj.forEachObject((obj: any) => {
                    if (obj.id) obj.id = uuidv4();
                    canvas.add(obj);
                });
                clonedObj.setCoords();
            } else {
                if (clonedObj.id) clonedObj.id = uuidv4();
                canvas.add(clonedObj);
            }

            canvas.setActiveObject(clonedObj);
            canvas.requestRenderAll();
            canvas.fire('object:modified');
        });
    };

    if (!activeObject) {
        if (selectedTool === 'frame') {
            return (
                <div className="fixed right-4 top-24 bottom-4 w-64 glass-panel rounded-3xl p-5 flex flex-col gap-6 shadow-2xl z-40 overflow-y-auto animate-in slide-in-from-right-4 duration-500">
                    <div className="flex items-center gap-2 mb-2">
                        <LayoutTemplate className="w-4 h-4 text-blue-500" />
                        <h3 className="font-semibold text-gray-900">Frame Presets</h3>
                    </div>

                    <div className="space-y-6">
                        {/* Phone */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
                                <Smartphone className="w-3 h-3" />
                                Phone
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => {
                                        if (!canvas) return;
                                        const frame = createFrame({
                                            width: 393,
                                            height: 852,
                                            left: canvas.getVpCenter().x - 393 / 2,
                                            top: canvas.getVpCenter().y - 852 / 2
                                        });
                                        canvas.add(frame);
                                        canvas.setActiveObject(frame);
                                        setSelectedTool('select');
                                        canvas.requestRenderAll();
                                    }}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex justify-between group"
                                >
                                    <span>iPhone 14/15 Pro</span>
                                    <span className="text-gray-400 text-xs group-hover:text-gray-500">393x852</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!canvas) return;
                                        const frame = createFrame({
                                            width: 430,
                                            height: 932,
                                            left: canvas.getVpCenter().x - 430 / 2,
                                            top: canvas.getVpCenter().y - 932 / 2
                                        });
                                        canvas.add(frame);
                                        canvas.setActiveObject(frame);
                                        setSelectedTool('select');
                                        canvas.requestRenderAll();
                                    }}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex justify-between group"
                                >
                                    <span>iPhone 14/15 Pro Max</span>
                                    <span className="text-gray-400 text-xs group-hover:text-gray-500">430x932</span>
                                </button>
                            </div>
                        </div>

                        {/* Tablet */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
                                <Tablet className="w-3 h-3" />
                                Tablet
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => {
                                        if (!canvas) return;
                                        const frame = createFrame({
                                            width: 834,
                                            height: 1194,
                                            left: canvas.getVpCenter().x - 834 / 2,
                                            top: canvas.getVpCenter().y - 1194 / 2
                                        });
                                        canvas.add(frame);
                                        canvas.setActiveObject(frame);
                                        setSelectedTool('select');
                                        canvas.requestRenderAll();
                                    }}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex justify-between group"
                                >
                                    <span>iPad Pro 11"</span>
                                    <span className="text-gray-400 text-xs group-hover:text-gray-500">834x1194</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!canvas) return;
                                        const frame = createFrame({
                                            width: 1024,
                                            height: 1366,
                                            left: canvas.getVpCenter().x - 1024 / 2,
                                            top: canvas.getVpCenter().y - 1366 / 2
                                        });
                                        canvas.add(frame);
                                        canvas.setActiveObject(frame);
                                        setSelectedTool('select');
                                        canvas.requestRenderAll();
                                    }}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex justify-between group"
                                >
                                    <span>iPad Pro 12.9"</span>
                                    <span className="text-gray-400 text-xs group-hover:text-gray-500">1024x1366</span>
                                </button>
                            </div>
                        </div>

                        {/* Desktop */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
                                <Monitor className="w-3 h-3" />
                                Desktop
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => {
                                        if (!canvas) return;
                                        const frame = createFrame({
                                            width: 1440,
                                            height: 1024,
                                            left: canvas.getVpCenter().x - 1440 / 2,
                                            top: canvas.getVpCenter().y - 1024 / 2
                                        });
                                        canvas.add(frame);
                                        canvas.setActiveObject(frame);
                                        setSelectedTool('select');
                                        canvas.requestRenderAll();
                                    }}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex justify-between group"
                                >
                                    <span>MacBook Pro 14"</span>
                                    <span className="text-gray-400 text-xs group-hover:text-gray-500">1440x1024</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!canvas) return;
                                        const frame = createFrame({
                                            width: 1920,
                                            height: 1080,
                                            left: canvas.getVpCenter().x - 1920 / 2,
                                            top: canvas.getVpCenter().y - 1080 / 2
                                        });
                                        canvas.add(frame);
                                        canvas.setActiveObject(frame);
                                        setSelectedTool('select');
                                        canvas.requestRenderAll();
                                    }}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex justify-between group"
                                >
                                    <span>Desktop (1080p)</span>
                                    <span className="text-gray-400 text-xs group-hover:text-gray-500">1920x1080</span>
                                </button>
                            </div>
                        </div>

                        {/* Paper */}
                        <div className="space-y-2">
                            <div className="flex items-center gap-2 text-gray-500 text-xs font-medium uppercase tracking-wider">
                                <FileText className="w-3 h-3" />
                                Paper
                            </div>
                            <div className="grid grid-cols-1 gap-2">
                                <button
                                    onClick={() => {
                                        if (!canvas) return;
                                        const frame = createFrame({
                                            width: 595,
                                            height: 842,
                                            left: canvas.getVpCenter().x - 595 / 2,
                                            top: canvas.getVpCenter().y - 842 / 2
                                        });
                                        canvas.add(frame);
                                        canvas.setActiveObject(frame);
                                        setSelectedTool('select');
                                        canvas.requestRenderAll();
                                    }}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex justify-between group"
                                >
                                    <span>A4</span>
                                    <span className="text-gray-400 text-xs group-hover:text-gray-500">595x842</span>
                                </button>
                                <button
                                    onClick={() => {
                                        if (!canvas) return;
                                        const frame = createFrame({
                                            width: 612,
                                            height: 792,
                                            left: canvas.getVpCenter().x - 612 / 2,
                                            top: canvas.getVpCenter().y - 792 / 2
                                        });
                                        canvas.add(frame);
                                        canvas.setActiveObject(frame);
                                        setSelectedTool('select');
                                        canvas.requestRenderAll();
                                    }}
                                    className="text-left px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors text-sm text-gray-700 flex justify-between group"
                                >
                                    <span>Letter</span>
                                    <span className="text-gray-400 text-xs group-hover:text-gray-500">612x792</span>
                                </button>
                            </div>
                        </div>

                    </div>
                </div>
            );
        }
        return (
            <div className="fixed right-4 top-24 bottom-4 w-64 glass-panel rounded-3xl p-5 flex flex-col gap-6 shadow-2xl z-40 overflow-y-auto animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center gap-2 mb-2">
                    <Grid className="w-4 h-4 text-blue-500" />
                    <h3 className="font-black text-[10px] text-gray-900 uppercase tracking-[0.15em]">Canvas Settings</h3>
                </div>

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
        <div className="fixed right-4 top-24 bottom-4 w-64 glass-panel rounded-3xl p-5 flex flex-col gap-6 shadow-2xl z-40 overflow-y-auto animate-in slide-in-from-right-4 duration-500">
            {/* Alignment Tools (Visible when multiple or single) */}
            <div className="space-y-3 pb-4 border-b border-gray-100">
                <label className="text-sm font-medium text-gray-700">Alignment</label>
                <div className="flex items-center justify-between gap-1">
                    <button onClick={() => canvas && alignObjects(canvas, 'left')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Align Left">
                        <AlignStartHorizontal className="w-4 h-4" />
                    </button>
                    <button onClick={() => canvas && alignObjects(canvas, 'center-h')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Align Horizontal Center">
                        <AlignCenterHorizontal className="w-4 h-4" />
                    </button>
                    <button onClick={() => canvas && alignObjects(canvas, 'right')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Align Right">
                        <AlignEndHorizontal className="w-4 h-4" />
                    </button>
                    <div className="w-[1px] h-4 bg-gray-200 mx-1" />
                    <button onClick={() => canvas && alignObjects(canvas, 'top')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Align Top">
                        <AlignStartVertical className="w-4 h-4" />
                    </button>
                    <button onClick={() => canvas && alignObjects(canvas, 'center-v')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Align Vertical Center">
                        <AlignCenterVertical className="w-4 h-4" />
                    </button>
                    <button onClick={() => canvas && alignObjects(canvas, 'bottom')} className="p-1.5 hover:bg-gray-100 rounded text-gray-600" title="Align Bottom">
                        <AlignEndVertical className="w-4 h-4" />
                    </button>
                </div>
                <div className="flex items-center gap-2">
                    <button onClick={() => canvas && distributeObjects(canvas, 'horizontal')} className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 rounded border border-gray-100">
                        <GalleryHorizontal className="w-3 h-3" /> Distribute H
                    </button>
                    <button onClick={() => canvas && distributeObjects(canvas, 'vertical')} className="flex-1 flex items-center justify-center gap-2 py-1.5 text-[10px] font-bold uppercase tracking-wider text-gray-500 hover:bg-gray-50 rounded border border-gray-100">
                        <GalleryVertical className="w-3 h-3" /> Distribute V
                    </button>
                </div>
                {selectedObjects.length >= 2 && (
                    <div className="space-y-3 pt-4 border-t border-gray-100">
                        <div className="flex items-center justify-between">
                            <label className="text-[10px] uppercase text-gray-400 font-black tracking-widest">Spacing / Gap (Enter to apply)</label>
                        </div>
                        <div className="flex gap-3">
                            <div className="flex-1 space-y-1">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Horizontal</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full bg-gray-50 border-none rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt((e.target as HTMLInputElement).value);
                                            if (!isNaN(val) && canvas) setGap(canvas, 'horizontal', val);
                                        }
                                    }}
                                />
                            </div>
                            <div className="flex-1 space-y-1">
                                <span className="text-[9px] text-gray-400 font-bold uppercase tracking-tighter">Vertical</span>
                                <input
                                    type="number"
                                    placeholder="0"
                                    className="w-full bg-gray-50 border-none rounded p-1.5 text-xs focus:ring-1 focus:ring-blue-500 outline-none"
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            const val = parseInt((e.target as HTMLInputElement).value);
                                            if (!isNaN(val) && canvas) setGap(canvas, 'vertical', val);
                                        }
                                    }}
                                />
                            </div>
                        </div>
                    </div>
                )}
            </div>

            <div className="flex items-center justify-between">
                <h3 className="font-semibold text-gray-900">Properties</h3>
                <button
                    onClick={handleLock}
                    className={`p-2 rounded-lg transition-colors ${(activeObject as any).locked ? 'bg-red-50 text-red-600' : 'hover:bg-gray-100 text-gray-400'}`}
                    title={(activeObject as any).locked ? "Unlock Element" : "Lock Element"}
                >
                    {(activeObject as any).locked ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                </button>
            </div>

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

                {(activeObject.type === 'rect' || activeObject.type === 'image') && (
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

                                if (activeObject.type === 'image') {
                                    if (val === 0) {
                                        handleUpdate({ rx: 0, ry: 0, clipPath: null });
                                    } else {
                                        const clipPath = new fabric.Rect({
                                            width: activeObject.width,
                                            height: activeObject.height,
                                            rx: val,
                                            ry: val,
                                            originX: 'center',
                                            originY: 'center',
                                        });
                                        handleUpdate({ rx: val, ry: val, clipPath });
                                    }
                                } else {
                                    handleUpdate({ rx: val, ry: val });
                                }
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
                            value={rgbaToHex(color)}
                            onChange={(e) => {
                                setColor(e.target.value);
                                handleUpdate({ fill: e.target.value });
                            }}
                            className="w-6 h-6 rounded border cursor-pointer border-gray-300"
                        />
                        <span className="text-xs text-gray-400 uppercase">{rgbaToHex(color)}</span>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">Stroke</span>
                    <div className="flex items-center gap-2">
                        <input
                            type="color"
                            value={rgbaToHex(strokeColor)}
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
                            const val = parseInt(e.target.value) || 0;
                            setStrokeWidth(val);
                            handleUpdate({
                                strokeWidth: val,
                                stroke: val > 0 ? strokeColor : 'transparent'
                            });
                        }}
                        className="w-16 p-1 bg-gray-50 rounded text-xs outline-none text-center"
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

            {/* Shadow Controls */}
            <div className="space-y-3 pt-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-gray-700">Effects</label>
                    <div
                        className={`w-8 h-4 rounded-full p-0.5 cursor-pointer transition-colors ${shadow.enabled ? 'bg-blue-600' : 'bg-gray-300'}`}
                        onClick={() => {
                            const newState = !shadow.enabled;
                            setShadow(prev => ({ ...prev, enabled: newState }));
                            handleUpdate({ shadow: { ...shadow, enabled: newState } });
                        }}
                    >
                        <div className={`w-3 h-3 bg-white rounded-full shadow-sm transform transition-transform ${shadow.enabled ? 'translate-x-4' : 'translate-x-0'}`} />
                    </div>
                </div>

                {shadow.enabled && (
                    <div className="space-y-3 pl-1">
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase text-gray-400 font-bold">Offset X</label>
                                <input
                                    type="number"
                                    value={shadow.offsetX}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setShadow(prev => ({ ...prev, offsetX: val }));
                                        handleUpdate({ shadow: { ...shadow, offsetX: val, enabled: true } });
                                    }}
                                    className="w-full bg-gray-50 border-none rounded p-1 text-xs outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase text-gray-400 font-bold">Offset Y</label>
                                <input
                                    type="number"
                                    value={shadow.offsetY}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setShadow(prev => ({ ...prev, offsetY: val }));
                                        handleUpdate({ shadow: { ...shadow, offsetY: val, enabled: true } });
                                    }}
                                    className="w-full bg-gray-50 border-none rounded p-1 text-xs outline-none"
                                />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase text-gray-400 font-bold">Blur</label>
                                <input
                                    type="number"
                                    min="0"
                                    value={shadow.blur}
                                    onChange={(e) => {
                                        const val = parseInt(e.target.value);
                                        setShadow(prev => ({ ...prev, blur: val }));
                                        handleUpdate({ shadow: { ...shadow, blur: val, enabled: true } });
                                    }}
                                    className="w-full bg-gray-50 border-none rounded p-1 text-xs outline-none"
                                />
                            </div>
                            <div className="space-y-1">
                                <label className="text-[9px] uppercase text-gray-400 font-bold">Color</label>
                                <input
                                    type="color"
                                    value={rgbaToHex(shadow.color)}
                                    onChange={(e) => {
                                        setShadow(prev => ({ ...prev, color: e.target.value }));
                                        handleUpdate({ shadow: { ...shadow, color: e.target.value, enabled: true } });
                                    }}
                                    className="w-full h-6 rounded border cursor-pointer border-gray-200"
                                />
                            </div>
                        </div>
                        <div className="space-y-1">
                            <div className="flex justify-between">
                                <label className="text-[9px] uppercase text-gray-400 font-bold">Opacity</label>
                                <span className="text-[9px] font-bold text-gray-500">{Math.round(shadow.opacity * 100)}%</span>
                            </div>
                            <input
                                type="range"
                                min="0"
                                max="1"
                                step="0.05"
                                value={shadow.opacity}
                                onChange={(e) => {
                                    const val = parseFloat(e.target.value);
                                    setShadow(prev => ({ ...prev, opacity: val }));
                                    handleUpdate({ shadow: { ...shadow, opacity: val, enabled: true } });
                                }}
                                className="w-full"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Image Magic (if image) */}
            {isImage && (
                <div className="space-y-3 pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <ImageIcon className="w-3.5 h-3.5 text-gray-500" />
                        <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Image Magic</label>
                    </div>

                    <div className="space-y-4">
                        <button
                            onClick={handleRemoveBackground}
                            disabled={removingBackground}
                            className={`w-full py-3 px-4 rounded-xl font-bold text-xs flex items-center justify-center gap-2 transition-all shadow-sm
                                ${removingBackground
                                    ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700 active:scale-[0.98] shadow-blue-500/20'
                                }
                            `}
                        >
                            {removingBackground ? (
                                <>
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                    Removing background...
                                </>
                            ) : (
                                <>
                                    <Sparkles className="w-3.5 h-3.5" />
                                    Remove Background
                                </>
                            )}
                        </button>

                        {removeBgError && (
                            <p className="text-[10px] text-red-500 font-medium bg-red-50 p-2 rounded-lg border border-red-100 animate-in fade-in slide-in-from-top-1">
                                {removeBgError}
                            </p>
                        )}

                        {(activeObject as any).originalSrc && (activeObject as any).removedBgSrc && (
                            <div className="flex items-center justify-between p-2.5 bg-gray-50 rounded-xl border border-gray-100 mt-2">
                                <span className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">
                                    {showOriginal ? 'Original' : 'AI Enhanced'}
                                </span>
                                <button
                                    onClick={toggleOriginal}
                                    className="px-3 py-1.5 bg-white border border-gray-200 rounded-lg text-[10px] font-black hover:bg-gray-50 transition-colors flex items-center gap-1.5 shadow-sm"
                                >
                                    <RefreshCcw className="w-3 h-3 text-blue-600" />
                                    {showOriginal ? 'Show AI' : 'Show Original'}
                                </button>
                            </div>
                        )}
                    </div>

                    <p className="text-[9px] text-gray-400 text-center mt-2 leading-relaxed">
                        Powered by on-device AI. <br /> Processing stays on your computer.
                    </p>
                </div>
            )}

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
                    </div>

                    <TypographyControls
                        canvas={canvas}
                        activeObject={activeObject}
                        handleUpdate={handleUpdate}
                    />
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
