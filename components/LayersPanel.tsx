'use client';

import React, { useMemo, useState } from 'react';
import * as fabric from 'fabric';
import {
    DndContext,
    closestCenter,
    KeyboardSensor,
    PointerSensor,
    useSensor,
    useSensors,
    DragEndEvent,
} from '@dnd-kit/core';
import {
    arrayMove,
    SortableContext,
    sortableKeyboardCoordinates,
    verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import { LayerItem } from './LayerItem';
import { Layers, Search, Filter, Group, Ungroup, Plus, Trash2 } from 'lucide-react';

interface LayersPanelProps {
    canvas: fabric.Canvas | null;
    objects: fabric.Object[];
    selectedObjects: fabric.Object[];
    onSelect: (objects: fabric.Object[]) => void;
    onReorder: (objects: fabric.Object[]) => void;
}

export const LayersPanel = ({
    canvas,
    objects,
    selectedObjects,
    onSelect,
    onReorder
}: LayersPanelProps) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [expandedGroups, setExpandedGroups] = useState<Set<string>>(new Set());

    const sensors = useSensors(
        useSensor(PointerSensor, {
            activationConstraint: {
                distance: 8,
            },
        }),
        useSensor(KeyboardSensor, {
            coordinateGetter: sortableKeyboardCoordinates,
        })
    );

    // Flatten objects for display, considering groups if we want to show nesting
    const layerItems = useMemo(() => {
        const items: { id: string; obj: fabric.Object; depth: number; isGroup?: boolean }[] = [];

        const processObject = (obj: fabric.Object, depth: number) => {
            const id = (obj as any).objectId || Math.random().toString();
            const isGroup = obj.type === 'group';

            items.push({ id, obj, depth, isGroup });

            if (isGroup && expandedGroups.has(id)) {
                const group = obj as fabric.Group;
                group.getObjects().forEach(child => processObject(child, depth + 1));
            }
        };

        // Top-most on canvas is last in objects array, so we reverse for PS/Figma style
        const baseObjects = [...objects].reverse();
        baseObjects.forEach(obj => processObject(obj, 0));

        return items;
    }, [objects, expandedGroups]);

    const filteredItems = useMemo(() => {
        if (!searchQuery) return layerItems;
        return layerItems.filter(item => {
            const name = (item.obj as any).name || (item.obj as any).text || item.obj.type || '';
            return name.toLowerCase().includes(searchQuery.toLowerCase());
        });
    }, [layerItems, searchQuery]);

    const handleSelect = (id: string, multi: boolean, range: boolean) => {
        if (!canvas) return;

        const targetItem = layerItems.find(item => item.id === id);
        if (!targetItem) return;

        let newSelection: fabric.Object[] = [];

        if (range && selectedObjects.length > 0) {
            const lastSelected = selectedObjects[selectedObjects.length - 1];
            const currentIndex = layerItems.findIndex(item => item.id === id);
            const lastIndex = layerItems.findIndex(item => item.obj === lastSelected);

            const start = Math.min(currentIndex, lastIndex);
            const end = Math.max(currentIndex, lastIndex);

            newSelection = layerItems.slice(start, end + 1).map(item => item.obj);
        } else if (multi) {
            const isAlreadySelected = selectedObjects.includes(targetItem.obj);
            if (isAlreadySelected) {
                newSelection = selectedObjects.filter(o => o !== targetItem.obj);
            } else {
                newSelection = [...selectedObjects, targetItem.obj];
            }
        } else {
            newSelection = [targetItem.obj];
        }

        onSelect(newSelection);

        // Sync Fabric canvas selection
        if (newSelection.length === 1) {
            canvas.setActiveObject(newSelection[0]);
        } else if (newSelection.length > 1) {
            const activeSelection = new fabric.ActiveSelection(newSelection, { canvas });
            canvas.setActiveObject(activeSelection);
        } else {
            canvas.discardActiveObject();
        }
        canvas.requestRenderAll();
    };

    const handleToggleVisibility = (id: string) => {
        const item = layerItems.find(i => i.id === id);
        if (item) {
            item.obj.set('visible', !item.obj.visible);
            canvas?.requestRenderAll();
            canvas?.fire('object:modified');
        }
    };

    const handleToggleLock = (id: string) => {
        const item = layerItems.find(i => i.id === id);
        if (item) {
            const isLocked = !(item.obj as any).locked;
            item.obj.set({
                locked: isLocked,
                selectable: !isLocked,
                hasControls: !isLocked,
                lockMovementX: isLocked,
                lockMovementY: isLocked,
                lockRotation: isLocked,
                lockScalingX: isLocked,
                lockScalingY: isLocked
            } as any);

            if (isLocked && canvas?.getActiveObject() === item.obj) {
                canvas.discardActiveObject();
            }

            canvas?.requestRenderAll();
            canvas?.fire('object:modified');
        }
    };

    const handleRename = (id: string, newName: string) => {
        const item = layerItems.find(i => i.id === id);
        if (item) {
            (item.obj as any).name = newName;
            canvas?.requestRenderAll();
            canvas?.fire('object:modified');
        }
    };

    const handleDelete = (id: string) => {
        const item = layerItems.find(i => i.id === id);
        if (item) {
            canvas?.remove(item.obj);
            canvas?.discardActiveObject();
            canvas?.requestRenderAll();
            canvas?.fire('object:removed');
        }
    };

    const handleDragEnd = (event: DragEndEvent) => {
        const { active, over } = event;
        if (!over || active.id === over.id) return;

        const oldIndex = layerItems.findIndex(item => item.id === active.id);
        const newIndex = layerItems.findIndex(item => item.id === over.id);

        if (oldIndex !== -1 && newIndex !== -1) {
            // Reordering logic
            // In our layer list, top is first (index 0), but in Fabric, top is last (index n)
            // Fabric objects are stored in back-to-front order.

            const movingObj = layerItems[oldIndex].obj;
            const targetObj = layerItems[newIndex].obj;

            // This is sophisticated: we need to adjust the actual canvas._objects array
            const currentFabricObjects = canvas?.getObjects() || [];
            const fabricOldIndex = currentFabricObjects.indexOf(movingObj);
            const fabricNewIndex = currentFabricObjects.indexOf(targetObj);

            if (fabricOldIndex !== -1 && fabricNewIndex !== -1) {
                const newFabricObjects = arrayMove(currentFabricObjects, fabricOldIndex, fabricNewIndex);
                onReorder(newFabricObjects);
            }
        }
    };

    const handleGroup = () => {
        if (!canvas || selectedObjects.length < 2) return;

        const group = new fabric.Group(selectedObjects);
        (group as any).objectId = Math.random().toString(36).substr(2, 9);
        (group as any).name = "Group " + (objects.filter(o => o.type === 'group').length + 1);

        selectedObjects.forEach(obj => canvas.remove(obj));
        canvas.add(group);
        canvas.setActiveObject(group);
        canvas.requestRenderAll();
        canvas.fire('object:added');
    };

    const handleUngroup = () => {
        if (!canvas || selectedObjects.length !== 1 || selectedObjects[0].type !== 'group') return;

        const group = selectedObjects[0] as fabric.Group;
        const items = group.getObjects();

        const anyGroup = group as any;
        if (typeof anyGroup.toActiveSelection === 'function') {
            anyGroup.toActiveSelection();
            canvas.requestRenderAll();
            canvas.fire('object:removed');
            return;
        }

        if (typeof anyGroup._restoreObjectsState === 'function') {
            anyGroup._restoreObjectsState();
        }

        canvas.remove(group);
        items.forEach(item => canvas.add(item));

        const activeSelection = new fabric.ActiveSelection(items, { canvas });
        canvas.setActiveObject(activeSelection);
        canvas.requestRenderAll();
        canvas.fire('object:removed');
    };

    return (
        <div className="flex flex-col h-full overflow-hidden bg-white">
            {/* Toolbar */}
            <div className="flex items-center gap-1 p-2 border-b border-gray-100 bg-gray-50/50">
                <div className="relative flex-1">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-gray-400" />
                    <input
                        type="text"
                        placeholder="Search layers..."
                        className="w-full pl-7 pr-2 py-1 text-[11px] bg-white border border-gray-200 rounded-md outline-none focus:border-blue-500 transition-colors"
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                    />
                </div>
                <button
                    onClick={handleGroup}
                    disabled={selectedObjects.length < 2}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Group Selection (Ctrl+G)"
                >
                    <Group className="w-4 h-4" />
                </button>
                <button
                    onClick={handleUngroup}
                    disabled={selectedObjects.length !== 1 || selectedObjects[0].type !== 'group'}
                    className="p-1.5 hover:bg-gray-200 rounded text-gray-500 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                    title="Ungroup (Ctrl+Shift+G)"
                >
                    <Ungroup className="w-4 h-4" />
                </button>
            </div>

            {/* Layer List */}
            <div className="flex-1 overflow-y-auto scrollbar-thin scrollbar-thumb-gray-200">
                {filteredItems.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-40 text-gray-400 gap-2">
                        <Layers className="w-8 h-8 opacity-20" />
                        <span className="text-xs font-medium">No layers found</span>
                    </div>
                ) : (
                    <DndContext
                        sensors={sensors}
                        collisionDetection={closestCenter}
                        onDragEnd={handleDragEnd}
                    >
                        <SortableContext
                            items={filteredItems.map(i => i.id)}
                            strategy={verticalListSortingStrategy}
                        >
                            <div className="py-1">
                                {filteredItems.map((item) => (
                                    <LayerItem
                                        key={item.id}
                                        id={item.id}
                                        obj={item.obj}
                                        depth={item.depth}
                                        isGroup={item.isGroup}
                                        isExpanded={expandedGroups.has(item.id)}
                                        isSelected={selectedObjects.includes(item.obj)}
                                        onSelect={handleSelect}
                                        onToggleVisibility={handleToggleVisibility}
                                        onToggleLock={handleToggleLock}
                                        onRename={handleRename}
                                        onDelete={handleDelete}
                                        onToggleExpand={(id) => {
                                            setExpandedGroups(prev => {
                                                const next = new Set(prev);
                                                if (next.has(id)) next.delete(id);
                                                else next.add(id);
                                                return next;
                                            });
                                        }}
                                    />
                                ))}
                            </div>
                        </SortableContext>
                    </DndContext>
                )}
            </div>

            {/* Footer / Stats */}
            <div className="px-3 py-2 border-t border-gray-100 bg-gray-50/50 flex items-center justify-between">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">
                    {objects.length} Layers
                </span>
                <div className="flex items-center gap-1">
                    <button className="p-1 hover:bg-gray-200 rounded text-gray-400">
                        <Plus className="w-3.5 h-3.5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
