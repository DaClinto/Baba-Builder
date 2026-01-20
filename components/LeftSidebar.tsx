'use client';

import * as fabric from 'fabric';
import { Layers, FileText, Plus, Trash2 } from 'lucide-react';
import { Page } from '@/types';
import { LayersPanel } from './LayersPanel';

type LeftSidebarProps = {
    canvas: fabric.Canvas | null;
    objects: fabric.Object[];
    selectedObjects: fabric.Object[];
    onSelect: (objs: fabric.Object[]) => void;
    onReorder: (objs: fabric.Object[]) => void;
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
    onSelect,
    onReorder,
    pages,
    activePageId,
    onAddPage,
    onSelectPage,
    onDeletePage
}: LeftSidebarProps) => {

    return (
        <div className="fixed left-0 top-16 bottom-0 w-64 bg-white border-r border-gray-200 flex flex-col shadow-2xl z-40 overflow-hidden">

            {/* Pages Panel */}
            <div className="border-b border-gray-200 flex-none bg-gray-50/30">
                <div className="px-4 py-3 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                        <FileText className="w-4 h-4 text-blue-500" />
                        <h3 className="font-black text-[10px] text-gray-900 uppercase tracking-[0.15em]">Pages</h3>
                    </div>
                    <button
                        onClick={onAddPage}
                        className="p-1 hover:bg-white hover:shadow-sm rounded-lg text-gray-500 hover:text-blue-600 transition-all border border-transparent hover:border-gray-100"
                        title="Add Page"
                    >
                        <Plus className="w-4 h-4" />
                    </button>
                </div>
                <div className="max-h-[140px] overflow-y-auto px-2 pb-2 space-y-0.5 scrollbar-none">
                    {pages.map(page => (
                        <div
                            key={page.id}
                            onClick={() => onSelectPage(page.id)}
                            className={`
                                flex items-center justify-between px-3 py-2 rounded-xl cursor-pointer transition-all text-xs group
                                ${activePageId === page.id
                                    ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/20 font-bold'
                                    : 'hover:bg-gray-100 text-gray-600 hover:text-gray-900'}
                            `}
                        >
                            <div className="flex items-center gap-2 truncate">
                                <FileText className={`w-3.5 h-3.5 ${activePageId === page.id ? 'text-white' : 'text-gray-400'}`} />
                                <span className="truncate">{page.name}</span>
                            </div>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDeletePage(page.id);
                                }}
                                className={`p-1 rounded-lg transition-all ${activePageId === page.id ? 'hover:bg-blue-700 text-white/70 hover:text-white' : 'opacity-0 group-hover:opacity-100 hover:bg-red-50 hover:text-red-500'}`}
                                title="Delete Page"
                            >
                                <Trash2 className="w-3 h-3" />
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Header for Layers */}
            <div className="px-4 py-3 border-b border-gray-100 bg-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <h3 className="font-black text-[10px] text-gray-900 uppercase tracking-[0.15em]">Layers</h3>
            </div>

            {/* Layers Panel Content */}
            <div className="flex-1 overflow-hidden">
                <LayersPanel
                    canvas={canvas}
                    objects={objects}
                    selectedObjects={selectedObjects}
                    onSelect={onSelect}
                    onReorder={onReorder}
                />
            </div>
        </div>
    );
};
