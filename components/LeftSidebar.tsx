'use client';

import * as fabric from 'fabric';
import { Layers, Square, Circle, Triangle, Minus, Type, Image, FileText, Plus, Trash2 } from 'lucide-react';
import { Page } from '@/types';

type LeftSidebarProps = {
    canvas: fabric.Canvas | null;
    objects: fabric.Object[];
    selectedObjects: fabric.Object[];
    pages: Page[];
    activePageId: string;
    onAddPage: () => void;
    onSelectPage: (id: string) => void;
    onDeletePage: (id: string) => void;
};

export const LeftSidebar = ({
    canvas,
    objects,
    selectedObjects,
    pages,
    activePageId,
    onAddPage,
    onSelectPage,
    onDeletePage
}: LeftSidebarProps) => {

    const handleSelect = (obj: fabric.Object) => {
        if (!canvas) return;
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
    };

    const getIcon = (obj: any) => {
        if (obj.type === 'rect') return <Square className="w-4 h-4" />;
        if (obj.type === 'circle') return <Circle className="w-4 h-4" />;
        if (obj.type === 'triangle') return <Triangle className="w-4 h-4" />;
        if (obj.type === 'line') return <Minus className="w-4 h-4" />;
        if (obj.type === 'i-text' || obj.type === 'text') return <Type className="w-4 h-4" />;
        if (obj.type === 'image') return <Image className="w-4 h-4" />;
        return <Layers className="w-4 h-4" />;
    };

    const getLabel = (obj: any) => {
        if (obj.type === 'i-text' || obj.type === 'text') return (obj as any).text || 'Text';
        return obj.type?.charAt(0).toUpperCase() + obj.type?.slice(1) || 'Object';
    };

    // Reverse objects to show top layer first
    const reversedObjects = [...objects].reverse();

    return (
        <div className="fixed left-0 top-16 bottom-0 w-60 bg-white border-r border-gray-200 flex flex-col shadow-lg z-40 overflow-hidden">

            {/* Pages Panel */}
            <div className="border-b border-gray-200 flex-none bg-gray-50/50">
                <div className="p-3 flex items-center justify-between border-b border-gray-100">
                    <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider">Pages</h3>
                    <button
                        onClick={onAddPage}
                        className="p-1 hover:bg-gray-200 rounded text-gray-500 hover:text-gray-900 transition-colors"
                        title="Add Page"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="max-h-[160px] overflow-y-auto p-2 space-y-1">
                    {pages.length === 0 && <div className="text-xs text-gray-400 text-center py-2">No pages</div>}
                    {pages.map(page => (
                        <div
                            key={page.id}
                            onClick={() => onSelectPage(page.id)}
                            className={`
                                flex items-center justify-between p-2 rounded cursor-pointer transition-colors text-sm group
                                ${activePageId === page.id ? 'bg-blue-100/50 text-blue-700 font-medium' : 'hover:bg-gray-100 text-gray-700'}
                            `}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <FileText className={`w-4 h-4 ${activePageId === page.id ? 'text-blue-500' : 'text-gray-400'}`} />
                                <span className="truncate">{page.name}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeletePage(page.id);
                                }}
                                className="opacity-0 group-hover:opacity-100 p-1 hover:bg-red-100 hover:text-red-500 rounded transition-all"
                                title="Delete Page"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Layers Panel */}
            <div className="p-3 flex items-center gap-2 border-b border-gray-100 bg-gray-50/50">
                <h3 className="font-bold text-xs text-gray-400 uppercase tracking-wider flex items-center gap-2">
                    Layers
                </h3>
                <span className="text-xs text-gray-400 bg-gray-200 px-1.5 rounded-full">{objects.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-2 space-y-1">
                {reversedObjects.length === 0 ? (
                    <div className="text-gray-400 text-sm text-center mt-10">No layers</div>
                ) : (
                    reversedObjects.map((obj, index) => {
                        // Check if this object is in selectedObjects
                        const isSelected = selectedObjects.includes(obj);

                        return (
                            <div
                                key={(obj as any).objectId || index}
                                onClick={() => handleSelect(obj)}
                                className={`
                                    flex items-center gap-3 p-2 rounded cursor-pointer transition-colors
                                    ${isSelected ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100 text-gray-700'}
                                `}
                            >
                                <span className="text-gray-500 opacity-70">
                                    {getIcon(obj)}
                                </span>
                                <span className="text-sm truncate w-32 font-medium">
                                    {getLabel(obj)}
                                </span>
                            </div>
                        );
                    })
                )}
            </div>
        </div>
    );
};
