'use client';

import { useEffect, useRef, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import * as fabric from 'fabric';
import { useAtom } from 'jotai';
import { AnimatePresence } from 'framer-motion';
import {
    selectedToolAtom,
    currentUserAtom,
    roomIdAtom,
    canvasHistoryAtom,
    historyIndexAtom,
    isGridEnabledAtom,
    gridSizeAtom,
    learningModeAtom,
    projectNameAtom,
    isSavingAtom,
    leftSidebarVisibleAtom,
    rightSidebarVisibleAtom,
    radiusTooltipAtom,
    globalLoadingAtom,
} from '@/lib/store';
import {
    usePresence,
    useCursors,
    useReactions,
    useComments,
    useCanvasState,
    usePages,
    useProjectMetadata,
} from '@/lib/firebase-hooks';
import { db } from '@/lib/firebase';
import { doc, deleteDoc } from 'firebase/firestore';
import {
    createShapeByType,
    serializeCanvas,
    loadCanvasFromJSON,
    downloadCanvasAsImage,
    clearCanvas as clearCanvasUtil,
    deleteSelectedObjects,
    alignObjects,
    distributeObjects,
} from '@/lib/canvas-utils';
import { setupFabricControls } from '@/lib/fabric-controls';
import { v4 as uuidv4 } from 'uuid';
import { ShapeType, User, ToolType } from '@/types';
import { throttle, debounce, resizeImage } from '@/lib/utils';
import { Cursor } from './Cursor';
import { Reaction } from './Reaction';
import { Comment } from './Comment';
import { Toolbar } from './Toolbar';
import { TopBar } from './TopBar';
import { LeftSidebar } from './LeftSidebar';
import { RightSidebar } from './RightSidebar';

import { HelpCircle } from 'lucide-react';

setupFabricControls();

export const Canvas = () => {
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const fabricCanvasRef = useRef<fabric.Canvas | null>(null);
    const [isCanvasReady, setIsCanvasReady] = useState(false);
    const [zoom, setZoom] = useState(1);

    // Track which page is currently loaded
    const loadedPageRef = useRef<string | null>(null);

    // Global state
    const [selectedTool, setSelectedTool] = useAtom(selectedToolAtom);
    const [currentUser] = useAtom(currentUserAtom);
    const [roomId] = useAtom(roomIdAtom);
    const [canvasHistory, setCanvasHistory] = useAtom(canvasHistoryAtom);
    const [historyIndex, setHistoryIndex] = useAtom(historyIndexAtom);
    const [isGridEnabled] = useAtom(isGridEnabledAtom);
    const [gridSize] = useAtom(gridSizeAtom);
    const [learningMode] = useAtom(learningModeAtom);
    const [projectName, setProjectName] = useAtom(projectNameAtom);
    const [isSaving, setIsSaving] = useAtom(isSavingAtom);
    const [leftSidebarVisible, setLeftSidebarVisible] = useAtom(leftSidebarVisibleAtom);
    const [rightSidebarVisible, setRightSidebarVisible] = useAtom(rightSidebarVisibleAtom);
    const [radiusTooltip, setRadiusTooltip] = useAtom(radiusTooltipAtom);
    const [globalLoading, setGlobalLoading] = useAtom(globalLoadingAtom);

    const [isPanning, setIsPanning] = useState(false);
    const [hoveredObjectInfo, setHoveredObjectInfo] = useState<{ x: number, y: number, text: string } | null>(null);
    const isSpaceDown = useRef(false);

    // Firebase hooks
    const { activeUsers, updateCursor } = usePresence(
        roomId,
        currentUser?.id || '',
        currentUser?.name || '',
        currentUser?.color || ''
    );
    const cursors = useCursors(roomId, currentUser?.id || '');
    const { reactions, addReaction } = useReactions(roomId);
    const { comments, addComment, resolveComment } = useComments(roomId);

    // Pages State
    const { pages, addPage, deletePage } = usePages(roomId);
    const [activePageId, setActivePageId] = useState<string>('default');

    // Project Metadata State
    const { projectData, updateProjectName, updateProjectThumbnail } = useProjectMetadata(roomId);

    // Sync project name from metadata
    useEffect(() => {
        if (projectData?.name) {
            setProjectName(projectData.name);
        }
    }, [projectData, setProjectName]);

    const handleRename = useCallback((newName: string) => {
        setProjectName(newName);
        updateProjectName(newName);
    }, [updateProjectName, setProjectName]);

    // Auto-select first page if current activePageId is invalid
    useEffect(() => {
        if (pages.length > 0 && !pages.find(p => p.id === activePageId)) {
            setActivePageId(pages[0].id);
        }
    }, [pages, activePageId]);

    // Reset loaded page ref when active page changes
    // Reset loaded page ref and clear canvas immediately when active page changes
    useEffect(() => {
        loadedPageRef.current = null;
        // Immediate clear to prevent visual bleed of previous page state
        if (fabricCanvasRef.current) {
            fabricCanvasRef.current.clear();
            fabricCanvasRef.current.backgroundColor = '#ffffff';
            // Reset viewport/zoom? Optional, but keeping zoom is usually preferred in rooms.
            // fabricCanvasRef.current.setViewportTransform([1, 0, 0, 1, 0, 0]);
            // fabricCanvasRef.current.setZoom(1);
            fabricCanvasRef.current.renderAll();
            // Clear local objects state so sidebar is empty
            setCanvasObjects([]);
        }
    }, [activePageId]);

    const handleDeletePage = async (pageId: string) => {
        if (pages.length <= 1) {
            alert("Cannot delete the last page");
            return;
        }

        // If deleting active page, switch first
        if (activePageId === pageId) {
            const other = pages.find(p => p.id !== pageId);
            if (other) setActivePageId(other.id);
        }

        await deletePage(pageId);
    };

    const { canvasState, saveCanvasState, isLoading } = useCanvasState(roomId, activePageId);

    // Cursor Chat State
    const [isCursorChatOpen, setIsCursorChatOpen] = useState(false);
    const [cursorChatValue, setCursorChatValue] = useState('');
    const router = useRouter();
    const lastMousePos = useRef({ x: 0, y: 0 });
    const cursorMessageTimeout = useRef<NodeJS.Timeout | null>(null);
    const isRemoteUpdate = useRef(false); // Flag to prevent infinite save loops

    // Panel State
    const [selectedObjects, setSelectedObjects] = useState<fabric.Object[]>([]);
    const [canvasObjects, setCanvasObjects] = useState<fabric.Object[]>([]);

    const cropStateRef = useRef<{
        isCropping: boolean;
        target: fabric.Object | null;
        start: fabric.Point | null;
        overlay: fabric.Rect | null;
    }>({ isCropping: false, target: null, start: null, overlay: null });

    // Initialize canvas
    useEffect(() => {
        if (!canvasRef.current || fabricCanvasRef.current) return;

        const canvas = new fabric.Canvas(canvasRef.current, {
            width: window.innerWidth,
            height: window.innerHeight - 64, // Subtract top bar height
            backgroundColor: '#ffffff',
            selection: true,
            enableRetinaScaling: true, // IMPORTANT: Enables HiDPI/Retina scaling
        });

        fabricCanvasRef.current = canvas;
        setIsCanvasReady(true);

        const isPanningRef = { current: false };

        // Handle wheel zoom
        const handleWheel = (opt: any) => {
            const e = opt.e;
            if (!e.ctrlKey && !e.metaKey && !e.altKey) return;
            e.preventDefault();
            e.stopPropagation();

            const delta = e.deltaY;
            let currentZoom = canvas.getZoom();
            currentZoom *= 0.999 ** delta;
            if (currentZoom > 5) currentZoom = 5;
            if (currentZoom < 0.1) currentZoom = 0.1;

            canvas.zoomToPoint(new fabric.Point(e.offsetX, e.offsetY), currentZoom);
            setZoom(currentZoom);
        };

        // Handle Panning
        const handleMouseDown = (opt: any) => {
            const e = opt.e;

            // Right-click to unlock
            if (e.button === 2) {
                const target = canvas.findTarget(e) as unknown as fabric.Object;
                if (target && (target as any).locked) {
                    if (confirm('Unlock this element?')) {
                        (target as any).locked = false;
                        target.set({
                            selectable: true,
                            hasControls: true,
                            lockMovementX: false,
                            lockMovementY: false,
                            lockRotation: false,
                            lockScalingX: false,
                            lockScalingY: false
                        });
                        canvas.setActiveObject(target);
                        canvas.requestRenderAll();
                        saveCanvas();
                    }
                    return;
                }
            }

            // Middle button (1) OR Space + Left Click (0)
            if (e.button === 1 || (isSpaceDown.current && e.button === 0)) {
                isPanningRef.current = true;
                setIsPanning(true);
                canvas.selection = false;
                canvas.defaultCursor = 'grabbing';
                opt.e.preventDefault();
            }
        };

        const handleMouseMove = (opt: any) => {
            if (isPanningRef.current) {
                const e = opt.e;
                const vpt = canvas.viewportTransform;
                if (vpt) {
                    vpt[4] += e.movementX;
                    vpt[5] += e.movementY;
                    canvas.requestRenderAll();
                }
            }
        };

        const handleMouseUp = () => {
            isPanningRef.current = false;
            setIsPanning(false);
            canvas.selection = true;
            canvas.defaultCursor = isSpaceDown.current ? 'grab' : 'default';
        };

        // Space key handling
        const handleKeyDownRoot = (e: KeyboardEvent) => {
            if (e.code === 'Space' && (e.target as HTMLElement).tagName !== 'INPUT' && (e.target as HTMLElement).tagName !== 'TEXTAREA') {
                isSpaceDown.current = true;
                if (!isPanningRef.current) canvas.defaultCursor = 'grab';
                e.preventDefault();
            }
        };

        const handleKeyUpRoot = (e: KeyboardEvent) => {
            if (e.code === 'Space') {
                isSpaceDown.current = false;
                if (!isPanningRef.current) canvas.defaultCursor = 'default';
            }
        };

        canvas.on('mouse:wheel', handleWheel);
        canvas.on('mouse:down', handleMouseDown);
        canvas.on('mouse:move', handleMouseMove);
        canvas.on('mouse:up', () => {
            handleMouseUp();
            setRadiusTooltip(null);
        });

        // Object hover tooltips for Learning Mode
        const handleMouseOver = (opt: any) => {
            if (!learningMode || !opt.target) return;
            const target = opt.target;
            const pointer = canvas.getScenePoint(opt.e);

            let explanation = "Design Element: ";
            if (target.type === 'rect') explanation += "A basic rectangular shape. Use this for backgrounds, buttons, or card structures.";
            else if (target.type === 'circle') explanation += "A round element. Great for avatars, profile pics, or circular icons.";
            else if (target.type === 'triangle') explanation += "A three-sided shape. Useful for arrows, play buttons, or geometric accents.";
            else if (target.type === 'i-text' || target.type === 'text') explanation += "Editable text layer. Double-click to type and edit content.";
            else if (target.type === 'line') explanation += "A straight line divider. Use to separate content sections.";
            else if (target.type === 'image') explanation += "Imported graphics layer. You can scale it without losing resolution if it's high quality.";
            else explanation += "A design object on your canvas.";

            // Convert canvas point to viewport point for overlay
            const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];
            const screenX = pointer.x * vpt[0] + vpt[4];
            const screenY = (pointer.y * vpt[3] + vpt[5]) - 40;

            setHoveredObjectInfo({ x: screenX, y: screenY, text: explanation });
        };

        const handleMouseOut = () => {
            setHoveredObjectInfo(null);
        };

        canvas.on('mouse:over', handleMouseOver);
        canvas.on('mouse:out', handleMouseOut);

        window.addEventListener('keydown', handleKeyDownRoot);
        window.addEventListener('keyup', handleKeyUpRoot);

        return () => {
            window.removeEventListener('keydown', handleKeyDownRoot);
            window.removeEventListener('keyup', handleKeyUpRoot);
            canvas.off('mouse:wheel', handleWheel);
            canvas.off('mouse:down', handleMouseDown);
            canvas.off('mouse:move', handleMouseMove);
            canvas.off('mouse:up', handleMouseUp);
            canvas.dispose();
            fabricCanvasRef.current = null;
            setIsCanvasReady(false);
        };
    }, []);

    // Resize canvas when sidebars are toggled
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !isCanvasReady) return;

        const handleResize = () => {
            const width = window.innerWidth - (leftSidebarVisible ? 240 : 0) - (rightSidebarVisible ? 256 : 0);
            canvas.setDimensions({
                width: width,
                height: window.innerHeight - 64,
            });
            canvas.renderAll();
        };

        // Delay slightly to ensure DOM has updated for the transition
        const timeoutId = setTimeout(handleResize, 50);

        window.addEventListener('resize', handleResize);
        return () => {
            window.removeEventListener('resize', handleResize);
            clearTimeout(timeoutId);
        };
    }, [leftSidebarVisible, rightSidebarVisible, isCanvasReady]);

    // Load canvas state from Firebase
    useEffect(() => {
        if (!isCanvasReady || !fabricCanvasRef.current || isLoading) return;

        if (!canvasState) {
            // New/Empty page - Clear canvas
            console.log("Empty canvas state, clearing canvas");
            fabricCanvasRef.current.clear();
            fabricCanvasRef.current.backgroundColor = '#ffffff';
            fabricCanvasRef.current.renderAll();
            setCanvasObjects([]);
            loadedPageRef.current = activePageId;
            return;
        }

        // Prevent loop if we just saved it or if WE are the last modifier
        // BUT only if we have already loaded this page (to allow reloading when switching back)
        if (canvasState.lastModifiedBy === currentUser?.id && loadedPageRef.current === activePageId) {
            return;
        }

        console.log("Loading canvas state from Firebase");
        // ... rest of load logic

        isRemoteUpdate.current = true;
        loadCanvasFromJSON(fabricCanvasRef.current, canvasState).finally(() => {
            // Small delay to ensure all events are processed before re-enabling save
            setTimeout(() => {
                isRemoteUpdate.current = false;
                loadedPageRef.current = activePageId;
                // Update objects state for sidebar
                setCanvasObjects(fabricCanvasRef.current?.getObjects() || []);
            }, 100);
        });
    }, [canvasState, currentUser?.id, isCanvasReady, isLoading, activePageId]);

    // Save canvas state to Firebase (debounced)
    const saveCanvas = useCallback(
        debounce(async () => {
            if (!fabricCanvasRef.current) return;
            setIsSaving(true);

            const state = serializeCanvas(fabricCanvasRef.current);
            await saveCanvasState({ ...state, userId: currentUser?.id });

            // Add to history
            const newState = { ...state, version: Date.now(), timestamp: Date.now() };
            setCanvasHistory((prev) => [...prev.slice(0, historyIndex + 1), newState]);
            setHistoryIndex((prev) => prev + 1);
            setIsSaving(false);

            // Export thumbnail
            const thumbnail = fabricCanvasRef.current.toDataURL({
                format: 'jpeg',
                multiplier: 0.1, // Small thumbnail
                quality: 0.1,
            });
            updateProjectThumbnail(thumbnail);
        }, 500),
        [saveCanvasState, historyIndex, setIsSaving, currentUser?.id, updateProjectThumbnail]
    );

    // Handle mouse move for cursor tracking
    const handleMouseMove = useCallback(
        throttle((e: MouseEvent) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect) return;

            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            lastMousePos.current = { x, y };

            updateCursor(x, y);
        }, 150), // Increased throttle to 150ms to prevent write exhaustion
        [updateCursor]
    );

    useEffect(() => {
        // We attach this to window to track even outside canvas slightly, or strictly canvas
        // For specific canvas tracking, fabric events are better, but this works for general UI
        window.addEventListener('mousemove', handleMouseMove);
        return () => window.removeEventListener('mousemove', handleMouseMove);
    }, [handleMouseMove]);

    // Handle mouse leave
    useEffect(() => {
        const handleMouseLeave = () => updateCursor(null, null);
        window.addEventListener('mouseleave', handleMouseLeave);
        return () => window.removeEventListener('mouseleave', handleMouseLeave);
    }, [updateCursor]);

    // Handle canvas interactions
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !isCanvasReady) return;

        // Handle object modifications
        const handleObjectModified = () => {
            if (isRemoteUpdate.current) return;
            saveCanvas();
            setCanvasObjects(canvas.getObjects());
        };

        const handleSelection = () => {
            setSelectedObjects(canvas.getActiveObjects());
        };

        const handleSelectionCleared = () => {
            setSelectedObjects([]);
        };

        canvas.on('object:modified', handleObjectModified);
        canvas.on('object:added', handleObjectModified);
        canvas.on('object:removed', handleObjectModified);

        // Selection events
        canvas.on('selection:created', handleSelection);
        canvas.on('selection:updated', handleSelection);
        canvas.on('selection:cleared', handleSelectionCleared);

        // Path created (drawing)
        canvas.on('path:created', handleObjectModified);

        // Initial objects
        setCanvasObjects(canvas.getObjects());

        return () => {
            canvas.off('object:modified', handleObjectModified);
            canvas.off('object:added', handleObjectModified);
            canvas.off('object:removed', handleObjectModified);
            canvas.off('selection:created', handleSelection);
            canvas.off('selection:updated', handleSelection);
            canvas.off('selection:cleared', handleSelectionCleared);
            canvas.off('path:created', handleObjectModified);
        };
    }, [isCanvasReady, saveCanvas]);

    // Grid Visuals and Snapping
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        if (isGridEnabled) {
            // Create grid pattern
            const patternCanvas = document.createElement('canvas');
            patternCanvas.width = gridSize;
            patternCanvas.height = gridSize;
            const ctx = patternCanvas.getContext('2d');
            if (ctx) {
                ctx.strokeStyle = '#e5e7eb'; // Light gray
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(0, 0);
                ctx.lineTo(gridSize, 0);
                ctx.moveTo(0, 0);
                ctx.lineTo(0, gridSize);
                ctx.stroke();
            }
            const pattern = new fabric.Pattern({
                source: patternCanvas,
                repeat: 'repeat',
            });
            canvas.backgroundColor = pattern;
        } else {
            canvas.backgroundColor = '#ffffff';
        }
        canvas.requestRenderAll();
    }, [isGridEnabled, gridSize, isCanvasReady]);

    // Snapping Logic
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        const handleMoving = (options: any) => {
            if (!isGridEnabled) return;
            const target = options.target;
            if (!target) return;

            const snap = (val: number) => {
                const closest = Math.round(val / gridSize) * gridSize;
                if (Math.abs(val - closest) < 10) { // 10px threshold
                    return closest;
                }
                return val;
            };

            target.set({
                left: snap(target.left || 0),
                top: snap(target.top || 0),
            });
        };

        const handleScaling = (options: any) => {
            const target = options.target;
            if (target && target.type === 'rect') {
                const width = target.width * target.scaleX;
                const height = target.height * target.scaleY;

                // Figma-style: clamp radius on resize
                const maxRadius = Math.min(width, height) / 2;
                const currentRadius = target.rx || 0;
                const newRadius = Math.min(currentRadius, maxRadius);

                target.set({
                    width: width,
                    height: height,
                    scaleX: 1,
                    scaleY: 1,
                    rx: newRadius,
                    ry: newRadius,
                });
            }
        };

        const handleRadiusChanging = (e: any) => {
            setRadiusTooltip({
                radius: e.radius,
                x: lastMousePos.current.x,
                y: lastMousePos.current.y - 30
            });
        };

        (canvas as any).on('object:moving', handleMoving);
        (canvas as any).on('object:scaling', handleScaling);
        (canvas as any).on('radius:changing', handleRadiusChanging);

        return () => {
            (canvas as any).off('object:moving', handleMoving);
            (canvas as any).off('object:scaling', handleScaling);
            (canvas as any).off('radius:changing', handleRadiusChanging);
        };
    }, [isGridEnabled, gridSize, isCanvasReady, setRadiusTooltip]);

    // Unified Image Upload Handler
    const handleImageUpload = useCallback((file?: File) => {
        const processFile = async (selectedFile: File) => {
            setGlobalLoading({ loading: true, message: 'Processing your image... Hang tight!' });

            const reader = new FileReader();
            reader.onload = async (f) => {
                const data = f.target?.result as string;
                if (!fabricCanvasRef.current) return;

                try {
                    // Compress image to avoid Firestore 1MB limit
                    const resizedData = await resizeImage(data, 1200);
                    const img = await fabric.FabricImage.fromURL(resizedData);

                    const canvas = fabricCanvasRef.current;
                    const vpt = canvas.viewportTransform || [1, 0, 0, 1, 0, 0];

                    // Default to center of viewport
                    const centerX = (canvas.width / 2 - vpt[4]) / vpt[0];
                    const centerY = (canvas.height / 2 - vpt[5]) / vpt[3];

                    img.set({
                        left: centerX,
                        top: centerY,
                        originX: 'center',
                        originY: 'center'
                    });

                    // Scale to reasonable size
                    if (img.width! > 400) {
                        img.scaleToWidth(400);
                    }

                    (img as any).objectId = uuidv4();
                    canvas.add(img);
                    canvas.setActiveObject(img);
                    canvas.requestRenderAll();
                    saveCanvas();
                    setGlobalLoading(null);
                } catch (err) {
                    console.error('Error loading image:', err);
                    alert('Failed to load image. It may be too large or corrupted.');
                    setGlobalLoading(null);
                }
            };
            reader.readAsDataURL(selectedFile);
        };

        if (file) {
            processFile(file);
        } else {
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = 'image/*';
            input.onchange = (e) => {
                const selectedFile = (e.target as HTMLInputElement).files?.[0];
                if (selectedFile) processFile(selectedFile);
            };
            input.click();
        }
    }, [saveCanvas, setGlobalLoading]);

    // Handle Paste Events
    useEffect(() => {
        const handlePaste = (e: ClipboardEvent) => {
            const items = e.clipboardData?.items;
            if (!items) return;

            for (let i = 0; i < items.length; i++) {
                if (items[i].type.indexOf('image') !== -1) {
                    const file = items[i].getAsFile();
                    if (file) handleImageUpload(file);
                }
            }
        };

        window.addEventListener('paste', handlePaste);
        return () => window.removeEventListener('paste', handlePaste);
    }, [handleImageUpload]);

    // Handle canvas click for adding shapes
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !isCanvasReady) return;

        const handleCanvasClick = (e: any) => {
            if (selectedTool === 'select' || selectedTool === 'hand' || selectedTool === 'draw' || selectedTool === 'reaction' || selectedTool === 'image' || selectedTool === 'crop') return;

            // In Fabric.js v6, the event contains the scenePoint directly
            const pointer = e.scenePoint || (canvas as any).getScenePoint(e.e);

            // Fallback
            if (!pointer) return;

            if (selectedTool === 'comment') {
                // Prevent default only if necessary
                const text = prompt('Enter your comment:');
                if (text && currentUser) {
                    addComment(text, currentUser.id, currentUser.name, pointer.x, pointer.y);
                }
                setSelectedTool('select');
                return;
            }

            // Add shape based on selected tool
            let shape;
            switch (selectedTool) {
                case 'rectangle':
                    shape = createShapeByType(ShapeType.Rectangle, { left: pointer.x, top: pointer.y });
                    break;
                case 'circle':
                    shape = createShapeByType(ShapeType.Circle, { left: pointer.x, top: pointer.y });
                    break;
                case 'triangle':
                    shape = createShapeByType(ShapeType.Triangle, { left: pointer.x, top: pointer.y });
                    break;
                case 'line':
                    shape = createShapeByType(ShapeType.Line, {
                        x1: pointer.x,
                        y1: pointer.y,
                        x2: pointer.x + 100,
                        y2: pointer.y,
                    });
                    break;
                case 'text':
                    shape = createShapeByType(ShapeType.Text, { left: pointer.x, top: pointer.y });
                    break;
                case 'frame':
                    shape = createShapeByType(ShapeType.Rectangle, {
                        left: pointer.x,
                        top: pointer.y,
                        width: 400,
                        height: 300,
                        fill: '#ffffff',
                        stroke: '#e5e7eb',
                        strokeWidth: 1,
                        selectable: true,
                        hasControls: true,
                    });
                    if (shape) {
                        (shape as any).isFrame = true;
                        (shape as any).name = 'Frame ' + (canvas.getObjects().filter(o => (o as any).isFrame).length + 1);
                    }
                    break;
            }

            if (shape) {
                canvas.add(shape);
                canvas.setActiveObject(shape);
                canvas.renderAll();
                saveCanvas();
                setSelectedTool('select');
            }
        };

        canvas.on('mouse:down', handleCanvasClick);

        return () => {
            canvas.off('mouse:down', handleCanvasClick);
        };
    }, [selectedTool, isCanvasReady, currentUser, addComment, saveCanvas, handleImageUpload, setSelectedTool]);

    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas || !isCanvasReady) return;

        const cropState = cropStateRef.current;

        if (selectedTool !== 'crop') {
            if (cropState.overlay) {
                canvas.remove(cropState.overlay);
                cropState.overlay = null;
                canvas.requestRenderAll();
            }
            cropState.isCropping = false;
            cropState.target = null;
            cropState.start = null;
            canvas.selection = true;
            canvas.defaultCursor = isSpaceDown.current ? 'grab' : 'default';
            canvas.hoverCursor = 'move';
            return;
        }

        canvas.isDrawingMode = false;
        canvas.selection = false;
        canvas.defaultCursor = 'crosshair';
        canvas.hoverCursor = 'crosshair';

        const getPointer = (opt: any) => {
            const anyCanvas = canvas as any;
            return opt.scenePoint || anyCanvas.getScenePoint?.(opt.e) || opt.absolutePointer || opt.pointer || anyCanvas.getPointer?.(opt.e);
        };

        const handleCropMouseDown = (opt: any) => {
            const active = canvas.getActiveObject() as fabric.Object | null;
            const target =
                (active && active.type === 'image' ? active : null) ||
                (opt.target as fabric.Object) ||
                (canvas.findTarget(opt.e) as unknown as fabric.Object) ||
                active;

            if (!target || target.type !== 'image') {
                return;
            }

            opt.e?.preventDefault?.();
            opt.e?.stopPropagation?.();

            const pointer = getPointer(opt);
            if (!pointer) return;

            canvas.setActiveObject(target);
            cropState.isCropping = true;
            cropState.target = target;
            cropState.start = new fabric.Point(pointer.x, pointer.y);

            if (cropState.overlay) {
                canvas.remove(cropState.overlay);
            }

            const overlay = new fabric.Rect({
                left: pointer.x,
                top: pointer.y,
                width: 0,
                height: 0,
                fill: 'rgba(59, 130, 246, 0.08)',
                stroke: '#3b82f6',
                strokeWidth: 1,
                strokeDashArray: [4, 4],
                selectable: false,
                evented: false,
                objectCaching: false,
            });
            (overlay as any).excludeFromExport = true;
            cropState.overlay = overlay;
            canvas.add(overlay);
            (overlay as any).bringToFront?.();
            (canvas as any).bringObjectToFront?.(overlay);
            (canvas as any).moveObjectTo?.(overlay, (canvas.getObjects()?.length || 1) - 1);
            canvas.requestRenderAll();
        };

        const handleCropMouseMove = (opt: any) => {
            if (!cropState.isCropping || !cropState.start || !cropState.overlay) return;
            const pointer = getPointer(opt);
            if (!pointer) return;

            const x1 = cropState.start.x;
            const y1 = cropState.start.y;
            const x2 = pointer.x;
            const y2 = pointer.y;
            const left = Math.min(x1, x2);
            const top = Math.min(y1, y2);
            const width = Math.abs(x2 - x1);
            const height = Math.abs(y2 - y1);

            cropState.overlay.set({ left, top, width, height });
            cropState.overlay.setCoords();
            canvas.requestRenderAll();
        };

        const handleCropMouseUp = () => {
            if (!cropState.isCropping || !cropState.target || !cropState.overlay) return;

            const overlay = cropState.overlay;
            const target = cropState.target as any;

            const ow = overlay.width || 0;
            const oh = overlay.height || 0;
            if (ow < 5 || oh < 5) {
                canvas.remove(overlay);
                cropState.overlay = null;
                cropState.isCropping = false;
                cropState.target = null;
                cropState.start = null;
                canvas.requestRenderAll();
                return;
            }

            const tl = new fabric.Point(overlay.left || 0, overlay.top || 0);
            const br = new fabric.Point((overlay.left || 0) + ow, (overlay.top || 0) + oh);

            const anyTarget = cropState.target as any;
            const p1 = typeof anyTarget.toLocalPoint === 'function'
                ? anyTarget.toLocalPoint(tl, 'center', 'center')
                : (() => {
                    const m = anyTarget.calcTransformMatrix();
                    const inv = fabric.util.invertTransform(m);
                    return fabric.util.transformPoint(tl, inv);
                })();

            const p2 = typeof anyTarget.toLocalPoint === 'function'
                ? anyTarget.toLocalPoint(br, 'center', 'center')
                : (() => {
                    const m = anyTarget.calcTransformMatrix();
                    const inv = fabric.util.invertTransform(m);
                    return fabric.util.transformPoint(br, inv);
                })();

            const w = target.width || 0;
            const h = target.height || 0;

            const localMinX = Math.min(p1.x, p2.x);
            const localMaxX = Math.max(p1.x, p2.x);
            const localMinY = Math.min(p1.y, p2.y);
            const localMaxY = Math.max(p1.y, p2.y);

            // Clamp crop to the image bounds in object local coords.
            const halfW = w / 2;
            const halfH = h / 2;
            const x1 = Math.max(-halfW, Math.min(halfW, localMinX));
            const x2 = Math.max(-halfW, Math.min(halfW, localMaxX));
            const y1 = Math.max(-halfH, Math.min(halfH, localMinY));
            const y2 = Math.max(-halfH, Math.min(halfH, localMaxY));

            const clipW = Math.max(1, x2 - x1);
            const clipH = Math.max(1, y2 - y1);
            const clipCx = (x1 + x2) / 2;
            const clipCy = (y1 + y2) / 2;

            const clipRect = new fabric.Rect({
                width: clipW,
                height: clipH,
                left: clipCx,
                top: clipCy,
                originX: 'center',
                originY: 'center',
                selectable: false,
                evented: false,
                objectCaching: false,
            });
            (clipRect as any).absolutePositioned = false;

            target.set({
                clipPath: clipRect,
            });
            target.dirty = true;
            target.setCoords();

            canvas.remove(overlay);
            cropState.overlay = null;
            cropState.isCropping = false;
            cropState.target = null;
            cropState.start = null;

            canvas.setActiveObject(target);
            canvas.requestRenderAll();
            canvas.fire('object:modified');
            saveCanvas();
            setSelectedTool('select');
        };

        canvas.on('mouse:down', handleCropMouseDown);
        canvas.on('mouse:move', handleCropMouseMove);
        canvas.on('mouse:up', handleCropMouseUp);

        return () => {
            canvas.off('mouse:down', handleCropMouseDown);
            canvas.off('mouse:move', handleCropMouseMove);
            canvas.off('mouse:up', handleCropMouseUp);
        };
    }, [selectedTool, isCanvasReady, saveCanvas, setSelectedTool]);

    useEffect(() => {
        if (selectedTool !== 'crop') return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key !== 'Escape') return;

            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            const cropState = cropStateRef.current;
            if (cropState.overlay) {
                canvas.remove(cropState.overlay);
            }
            cropState.overlay = null;
            cropState.isCropping = false;
            cropState.target = null;
            cropState.start = null;
            canvas.requestRenderAll();
            setSelectedTool('select');
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedTool, setSelectedTool]);

    // Handle free drawing
    useEffect(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        if (selectedTool === 'draw') {
            canvas.isDrawingMode = true;
            if (!canvas.freeDrawingBrush) {
                canvas.freeDrawingBrush = new fabric.PencilBrush(canvas);
            }
            canvas.freeDrawingBrush.width = 5;
            canvas.freeDrawingBrush.color = currentUser?.color || '#000000';
        } else {
            canvas.isDrawingMode = false;
        }
    }, [selectedTool, currentUser]);

    // Handle keyboard shortcuts
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            const canvas = fabricCanvasRef.current;
            if (!canvas) return;

            // Delete key
            if (e.key === 'Delete' || e.key === 'Backspace') {
                const active = canvas.getActiveObjects();
                if (active.length > 0 && !canvas.isDrawingMode) {
                    const activeObj = canvas.getActiveObject();
                    if (activeObj && (activeObj as any).isEditing) return; // Don't delete if editing text

                    deleteSelectedObjects(canvas);
                    saveCanvas();
                }
            }

            // Cursor Chat (Slash key)
            if (e.key === '/' && !isCursorChatOpen) {
                // Check if typing in input
                const target = e.target as HTMLElement;
                if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) return;

                // Check if fabric text is editing
                const activeObj = canvas.getActiveObject();
                if (activeObj && (activeObj as any).isEditing) return;

                e.preventDefault();
                setIsCursorChatOpen(true);
                return;
            }

            // Ctrl/Cmd + Z (Undo)
            if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey) {
                e.preventDefault();
                handleUndo();
            }

            // Ctrl/Cmd + Y or Ctrl/Cmd + Shift + Z (Redo)
            if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.shiftKey && e.key === 'z'))) {
                e.preventDefault();
                handleRedo();
            }

            // Ctrl/Cmd + L (Lock)
            if ((e.ctrlKey || e.metaKey) && e.key === 'l' && !e.shiftKey) {
                e.preventDefault();
                const activeObjects = canvas.getActiveObjects();
                activeObjects.forEach(obj => {
                    (obj as any).locked = true;
                    obj.set({
                        selectable: false,
                        hasControls: false,
                        lockMovementX: true,
                        lockMovementY: true,
                        lockRotation: true,
                        lockScalingX: true,
                        lockScalingY: true
                    });
                });
                canvas.discardActiveObject();
                canvas.requestRenderAll();
                saveCanvas();
            }

            // Ctrl/Cmd + Shift + L (Unlock All)
            if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'l') {
                e.preventDefault();
                canvas.getObjects().forEach(obj => {
                    if ((obj as any).locked) {
                        (obj as any).locked = false;
                        obj.set({
                            selectable: true,
                            hasControls: true,
                            lockMovementX: false,
                            lockMovementY: false,
                            lockRotation: false,
                            lockScalingX: false,
                            lockScalingY: false
                        });
                    }
                });
                canvas.requestRenderAll();
                saveCanvas();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [saveCanvas, historyIndex, canvasHistory]);

    // Undo
    const handleUndo = useCallback(() => {
        if (historyIndex <= 0 || !fabricCanvasRef.current) return;

        const previousState = canvasHistory[historyIndex - 1];
        loadCanvasFromJSON(fabricCanvasRef.current, previousState);
        setHistoryIndex((prev) => prev - 1);
    }, [historyIndex, canvasHistory]);

    // Redo
    const handleRedo = useCallback(() => {
        if (historyIndex >= canvasHistory.length - 1 || !fabricCanvasRef.current) return;

        const nextState = canvasHistory[historyIndex + 1];
        loadCanvasFromJSON(fabricCanvasRef.current, nextState);
        setHistoryIndex((prev) => prev + 1);
    }, [historyIndex, canvasHistory]);

    // Clear canvas
    const handleClear = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        if (confirm('Are you sure you want to clear the canvas?')) {
            clearCanvasUtil(fabricCanvasRef.current);
            saveCanvas();
        }
    }, [saveCanvas]);

    // Delete entire project
    const handleDeleteProject = useCallback(async () => {
        if (!roomId || !currentUser) return;

        const confirmed = confirm('Permanently delete this design? This will remove it from Your Legacy Folder forever.');
        if (confirmed) {
            try {
                setGlobalLoading({ loading: true, message: 'Erasing design from cloud...' });

                await deleteDoc(doc(db, 'projects', roomId));

                setGlobalLoading({ loading: true, message: 'Erased successfully! Returning to dashboard...' });

                setTimeout(() => {
                    router.push('/');
                    setGlobalLoading(null);
                }, 1000);
            } catch (err) {
                console.error('Delete Error:', err);
                alert('Could not delete the project. It may have already been removed.');
                setGlobalLoading(null);
            }
        }
    }, [roomId, currentUser, router, setGlobalLoading]);

    // Export canvas
    const handleExport = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        downloadCanvasAsImage(fabricCanvasRef.current, 'figma-clone-canvas');
    }, []);

    const handleExportSVG = useCallback(() => {
        if (!fabricCanvasRef.current) return;
        const svg = fabricCanvasRef.current.toSVG();
        const blob = new Blob([svg], { type: 'image/svg+xml' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = 'design.svg';
        link.click();
        URL.revokeObjectURL(url);
    }, []);

    // Zoom
    const handleZoomIn = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        let newZoom = canvas.getZoom() * 1.1; // Percent-based zoom is smoother
        if (newZoom > 5) newZoom = 5;

        canvas.zoomToPoint(new fabric.Point(canvas.width! / 2, canvas.height! / 2), newZoom);
        setZoom(newZoom);
    }, []);

    const handleZoomOut = useCallback(() => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        let newZoom = canvas.getZoom() / 1.1;
        if (newZoom < 0.1) newZoom = 0.1;

        canvas.zoomToPoint(new fabric.Point(canvas.width! / 2, canvas.height! / 2), newZoom);
        setZoom(newZoom);
    }, []);

    // Add reaction
    const handleReaction = useCallback(
        (emoji: string) => {
            const rect = canvasRef.current?.getBoundingClientRect();
            if (!rect || !currentUser) return;

            // Add reaction at random position near center
            const x = window.innerWidth / 2 + (Math.random() - 0.5) * 200;
            const y = window.innerHeight / 2 + (Math.random() - 0.5) * 200;

            addReaction(emoji, currentUser.id, x, y);
        },
        [currentUser, addReaction]
    );

    if (!currentUser) {
        return <div className="flex items-center justify-center h-screen">Loading...</div>;
    }

    // Map active users to User type
    const mappedActiveUsers: User[] = activeUsers.map((user) => ({
        id: user.userId,
        name: user.userName,
        color: user.userColor,
    }));

    const handleLayerSelect = useCallback((objs: fabric.Object[]) => {
        setSelectedObjects(objs);
    }, []);

    const handleLayerReorder = useCallback((objs: fabric.Object[]) => {
        const canvas = fabricCanvasRef.current;
        if (!canvas) return;

        // Fabric stores objects back-to-front (higher index = visually on top).
        // Apply the desired object order onto the canvas.
        objs.forEach((obj, index) => {
            const anyCanvas = canvas as any;
            if (typeof anyCanvas.moveObjectTo === 'function') {
                anyCanvas.moveObjectTo(obj, index);
                return;
            }

            if (typeof anyCanvas.insertAt === 'function') {
                try {
                    canvas.remove(obj);
                } catch {
                    // ignore
                }
                anyCanvas.insertAt(obj, index, false);
            }
        });

        canvas.requestRenderAll();
        setCanvasObjects(canvas.getObjects());
        canvas.fire('object:modified');
    }, []);

    const handlePageSwitch = (newPageId: string) => {
        // Force save current state before switching
        if (saveCanvas && (saveCanvas as any).flush) {
            (saveCanvas as any).flush();
        }
        setActivePageId(newPageId);
    };

    return (
        <div className="flex h-screen bg-gray-50 overflow-hidden relative">
            {/* Top Bar */}
            <TopBar
                currentUser={currentUser}
                activeUsers={mappedActiveUsers}
                projectName={projectName}
                isSaving={isSaving}
                leftSidebarVisible={leftSidebarVisible}
                rightSidebarVisible={rightSidebarVisible}
                onToggleLeftSidebar={() => setLeftSidebarVisible(!leftSidebarVisible)}
                onToggleRightSidebar={() => setRightSidebarVisible(!rightSidebarVisible)}
                onRename={handleRename}
                onUndo={handleUndo}
                onRedo={handleRedo}
                onClear={handleClear}
                onDeleteProject={handleDeleteProject}
                onExport={handleExport}
                onExportSVG={handleExportSVG}
                onZoomIn={handleZoomIn}
                onZoomOut={handleZoomOut}
                zoom={zoom}
                canUndo={historyIndex > 0}
                canRedo={historyIndex < canvasHistory.length - 1}
            />

            {/* Left Sidebar */}
            {leftSidebarVisible && (
                <LeftSidebar
                    canvas={fabricCanvasRef.current}
                    objects={canvasObjects}
                    selectedObjects={selectedObjects}
                    onSelect={handleLayerSelect}
                    onReorder={handleLayerReorder}
                    pages={pages}
                    activePageId={activePageId}
                    onAddPage={() => addPage(`Page ${pages.length + 1}`)}
                    onSelectPage={handlePageSwitch}
                    onDeletePage={handleDeletePage}
                />
            )}

            {/* Toolbar - Pushed right due to sidebar */}
            <Toolbar
                selectedTool={selectedTool}
                onToolChange={(tool) => {
                    if (tool === 'image') {
                        handleImageUpload();
                    } else {
                        setSelectedTool(tool);
                    }
                }}
                onReaction={handleReaction}
                className={`transition-all duration-300 ${leftSidebarVisible ? "left-[256px]" : "left-6"}`}
            />

            {/* Right Sidebar */}
            {rightSidebarVisible && (
                <RightSidebar
                    canvas={fabricCanvasRef.current}
                    selectedObjects={selectedObjects}
                />
            )}

            {/* Canvas Container */}
            <div
                className={`pt-16 relative flex-1 transition-all duration-300 ${leftSidebarVisible ? 'ml-[240px]' : 'ml-0'} ${rightSidebarVisible ? 'mr-[256px]' : 'mr-0'} overflow-hidden h-full`}
                onDragOver={(e) => {
                    e.preventDefault();
                    e.dataTransfer.dropEffect = 'copy';
                }}
                onDrop={(e) => {
                    e.preventDefault();
                    const file = e.dataTransfer.files[0];
                    if (file && file.type.startsWith('image/')) {
                        handleImageUpload(file);
                    }
                }}
            >
                <canvas ref={canvasRef} className="block" />

                {/* Learning Mode Overlay for Objects */}
                {learningMode && hoveredObjectInfo && (
                    <div
                        className="absolute pointer-events-none bg-orange-600 text-white text-[10px] px-2 py-1.5 rounded shadow-lg z-[100] max-w-[200px] animate-in fade-in zoom-in duration-200"
                        style={{ left: hoveredObjectInfo.x, top: hoveredObjectInfo.y }}
                    >
                        {hoveredObjectInfo.text}
                    </div>
                )}
                {/* Radius Tooltip */}
                {radiusTooltip && (
                    <div
                        className="absolute pointer-events-none bg-blue-600 text-white text-[11px] font-bold px-2 py-1 rounded shadow-lg z-[100] -translate-x-1/2 flex items-center gap-1"
                        style={{ left: radiusTooltip.x, top: radiusTooltip.y }}
                    >
                        Radius: {radiusTooltip.radius}px
                    </div>
                )}
            </div>

            {/* Cursors */}
            <AnimatePresence>
                {cursors.map((cursor) => {
                    const user = activeUsers.find((u) => u.userId === cursor.userId);
                    return (
                        <Cursor
                            key={cursor.userId}
                            cursor={cursor}
                            userName={user?.userName || 'Unknown'}
                            userColor={user?.userColor || '#000000'}
                        />
                    );
                })}
            </AnimatePresence>

            {/* Reactions */}
            <AnimatePresence>
                {reactions.map((reaction) => (
                    <Reaction key={reaction.id} reaction={reaction} />
                ))}
            </AnimatePresence>

            {/* Cursor Chat Input */}
            {isCursorChatOpen && (
                <div
                    className="absolute z-50 transform -translate-y-full pb-2"
                    style={{
                        left: lastMousePos.current.x,
                        top: lastMousePos.current.y,
                    }}
                >
                    <input
                        autoFocus
                        className="px-3 py-2 bg-blue-600 text-white rounded-lg shadow-lg outline-none placeholder-blue-200 min-w-[200px]"
                        style={{ backgroundColor: currentUser.color }}
                        placeholder="Say something..."
                        value={cursorChatValue}
                        onChange={(e) => setCursorChatValue(e.target.value)}
                        onKeyDown={(e) => {
                            if (e.key === 'Enter') {
                                e.preventDefault();
                                setIsCursorChatOpen(false);
                                setCursorChatValue('');
                                if (cursorChatValue.trim()) {
                                    updateCursor(lastMousePos.current.x, lastMousePos.current.y, cursorChatValue);
                                    // Clear after 5 seconds
                                    if (cursorMessageTimeout.current) clearTimeout(cursorMessageTimeout.current);
                                    cursorMessageTimeout.current = setTimeout(() => {
                                        updateCursor(lastMousePos.current.x, lastMousePos.current.y, '');
                                    }, 5000);
                                }
                            } else if (e.key === 'Escape') {
                                setIsCursorChatOpen(false);
                                setCursorChatValue('');
                            }
                            e.stopPropagation();
                        }}
                        onBlur={() => setIsCursorChatOpen(false)}
                    />
                </div>
            )}

            {/* Comments */}
            {comments.map((comment) => (
                <Comment key={comment.id} comment={comment} onResolve={resolveComment} />
            ))}

            {/* Global Loading Overlay / Pop up Alert */}
            {globalLoading && (
                <div className="absolute inset-0 bg-gray-900/40 backdrop-blur-md z-[1000] flex items-center justify-center animate-in fade-in duration-300">
                    <div className="bg-white rounded-3xl p-8 shadow-2xl flex flex-col items-center gap-6 max-w-sm text-center transform scale-100 animate-in zoom-in-95 duration-200">
                        <div className="relative">
                            <div className="w-16 h-16 rounded-full border-4 border-blue-100 border-t-blue-600 animate-spin"></div>
                            <div className="absolute inset-0 flex items-center justify-center">
                                <div className="w-8 h-8 bg-blue-50 rounded-full flex items-center justify-center">
                                    <div className="w-2 h-2 bg-blue-600 rounded-full animate-pulse"></div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-lg font-black text-gray-900 leading-tight">
                                {globalLoading.message.split('...')[0]}...
                            </h3>
                            <p className="text-sm text-gray-500 font-medium leading-relaxed">
                                {globalLoading.message.split('...')[1] || "This might take a few seconds while we finish the heavy lifting."}
                            </p>
                        </div>
                        <div className="w-full h-1 bg-gray-100 rounded-full overflow-hidden">
                            <div className="h-full bg-blue-600 animate-loading-bar"></div>
                        </div>
                    </div>
                </div>
            )}

            {/* Loading Overlay (Initial) */}
            {isLoading && (
                <div className="absolute inset-0 bg-white/80 z-50 flex items-center justify-center pointer-events-auto backdrop-blur-sm">
                    <div className="flex flex-col items-center gap-3">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                        <span className="text-gray-600 font-medium">Loading Page...</span>
                    </div>
                </div>
            )}
        </div>
    );
};
