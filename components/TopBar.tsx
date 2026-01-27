'use client';

import { Undo, Redo, Download, Trash2, Eraser, ZoomIn, ZoomOut, Home, Cloud, CloudCheck, ChevronRight, PanelLeft, PanelRight, Save, FileImage, FileText, ChevronDown, Image as ImageIcon } from 'lucide-react';
import { ActiveUsers } from './ActiveUsers';
import { User } from '@/types';
import Link from 'next/link';

type TopBarProps = {
    currentUser: User;
    activeUsers: User[];
    projectName: string;
    isSaving?: boolean;
    hasUnsavedChanges?: boolean;
    leftSidebarVisible: boolean;
    rightSidebarVisible: boolean;
    onToggleLeftSidebar: () => void;
    onToggleRightSidebar: () => void;
    onRename: (name: string) => void;
    onUndo: () => void;
    onRedo: () => void;
    onSave?: () => void;
    onClear: () => void;
    onDeleteProject?: () => void;
    onExport: () => void;
    onExportJPG: () => void;
    onExportSVG: () => void;
    onExportPDF?: () => void;
    onZoomIn: () => void;
    onZoomOut: () => void;
    zoom: number;
    canUndo: boolean;
    canRedo: boolean;
};

export const TopBar = ({
    currentUser,
    activeUsers,
    projectName,
    isSaving,
    hasUnsavedChanges,
    leftSidebarVisible,
    rightSidebarVisible,
    onToggleLeftSidebar,
    onToggleRightSidebar,
    onRename,
    onUndo,
    onRedo,
    onSave,
    onClear,
    onDeleteProject,
    onExport,
    onExportJPG,
    onExportSVG,
    onExportPDF,
    onZoomIn,
    onZoomOut,
    zoom,
    canUndo,
    canRedo,
}: TopBarProps) => {
    return (
        <div className="fixed top-4 left-4 right-4 z-50 pointer-events-none">
            <div className="max-w-screen-2xl mx-auto glass-panel rounded-2xl flex items-center justify-between px-4 py-2 pointer-events-auto h-14">
                {/* Left: Logo & Project Name */}
                <div className="flex items-center gap-3">
                    <div className="flex items-center gap-1.5">
                        <Link
                            href="/"
                            className="p-1 hover:bg-gray-100 rounded-xl transition-all active:scale-95 group"
                            title="Back to Projects"
                        >
                            <div className="w-8 h-8 rounded-lg overflow-hidden border border-gray-200 shadow-sm transition-transform group-hover:scale-105">
                                <img src="/logo.png" alt="DrawToCreate" className="w-full h-full object-cover" />
                            </div>
                        </Link>

                        <button
                            onClick={onToggleLeftSidebar}
                            className={`p-2 rounded-xl transition-all active:scale-90 ${!leftSidebarVisible ? 'bg-blue-50 text-blue-600 shadow-sm' : 'hover:bg-gray-100 text-gray-500'}`}
                            title={leftSidebarVisible ? "Hide Layer Panel" : "Show Layer Panel"}
                        >
                            <PanelLeft className="w-5 h-5" />
                        </button>
                    </div>

                    <div className="h-4 w-px bg-gray-200 mx-1" />

                    <div className="flex flex-col">
                        <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[10px] font-black text-blue-600 uppercase tracking-widest opacity-80">DrawToCreate</span>
                            <div className="flex items-center gap-1">
                                {isSaving ? (
                                    <Cloud className="w-3 h-3 animate-pulse text-blue-500" />
                                ) : (
                                    <CloudCheck className="w-3 h-3 text-green-500" />
                                )}
                            </div>
                        </div>
                        <input
                            type="text"
                            value={projectName}
                            onChange={(e) => onRename(e.target.value)}
                            className="bg-transparent border-none focus:ring-0 font-bold text-gray-900 p-0 text-[13px] hover:bg-gray-50 rounded px-1 -ml-1 transition-colors w-32 md:w-48 truncate"
                            title="Click to rename"
                        />
                    </div>

                    <div className="h-4 w-px bg-gray-200 mx-1 hidden md:block" />
                    <div className="hidden md:block">
                        <ActiveUsers currentUser={currentUser} activeUsers={activeUsers} />
                    </div>
                </div>

                {/* Center: Actions */}
                <div className="flex items-center bg-gray-100/50 rounded-xl p-1 gap-0.5 border border-gray-200/50">
                    <button
                        onClick={onUndo}
                        disabled={!canUndo}
                        className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-20 transition-all active:scale-90"
                        title="Undo (Ctrl+Z)"
                    >
                        <Undo className="w-4 h-4 text-gray-700" />
                    </button>

                    <button
                        onClick={onRedo}
                        disabled={!canRedo}
                        className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm disabled:opacity-20 transition-all active:scale-90"
                        title="Redo (Ctrl+Y)"
                    >
                        <Redo className="w-4 h-4 text-gray-700" />
                    </button>

                    <div className="w-px h-4 bg-gray-300 mx-1" />

                    <button
                        onClick={onZoomOut}
                        className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all active:scale-90"
                        title="Zoom Out"
                    >
                        <ZoomOut className="w-4 h-4 text-gray-700" />
                    </button>

                    <div className="px-2 py-0.5 text-[11px] font-bold text-gray-600 bg-white/50 rounded-md shadow-inner-sm">
                        {Math.round(zoom * 100)}%
                    </div>

                    <button
                        onClick={onZoomIn}
                        className="p-1.5 rounded-lg hover:bg-white hover:shadow-sm transition-all active:scale-90"
                        title="Zoom In"
                    >
                        <ZoomIn className="w-4 h-4 text-gray-700" />
                    </button>
                </div>

                {/* Right: Groups */}
                <div className="flex items-center gap-2">
                    <div className="flex items-center bg-white shadow-sm border border-gray-200 rounded-xl px-1">
                        <button
                            onClick={onClear}
                            className="p-2 rounded-lg hover:bg-orange-50 text-orange-600 transition-colors group"
                            title="Clear All Canvas Content"
                        >
                            <Eraser className="w-4 h-4 group-hover:scale-110 transition-transform" />
                        </button>

                        {onDeleteProject && (
                            <button
                                onClick={onDeleteProject}
                                className="p-2 rounded-lg hover:bg-red-50 text-red-600 transition-colors group"
                                title="Delete Project"
                            >
                                <Trash2 className="w-4 h-4 font-black group-hover:scale-110 transition-transform" />
                            </button>
                        )}
                    </div>

                    <div className="relative group">
                        <button
                            className="px-4 py-2 bg-[#0f172a] hover:bg-[#1e293b] text-white rounded-xl font-bold transition-all flex items-center gap-2 shadow-lg shadow-gray-900/20 text-xs"
                        >
                            <Download className="w-4 h-4" />
                            Export
                            <ChevronDown className="w-3 h-3 ml-1 opacity-60" />
                        </button>

                        {/* Dropdown Menu */}
                        <div className="absolute top-full right-0 mt-3 w-48 bg-white rounded-2xl shadow-2xl border border-gray-100 py-2 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all transform origin-top translate-y-2 group-hover:translate-y-0 z-50">
                            <button
                                onClick={onExport}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-blue-50 hover:text-blue-600 flex items-center gap-3 transition-colors"
                            >
                                <div className="w-6 h-6 rounded-lg bg-blue-100 flex items-center justify-center">
                                    <FileImage className="w-3.5 h-3.5 text-blue-600" />
                                </div>
                                Export as PNG
                            </button>
                            <button
                                onClick={onExportJPG}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-orange-50 hover:text-orange-600 flex items-center gap-3 transition-colors"
                            >
                                <div className="w-6 h-6 rounded-lg bg-orange-100 flex items-center justify-center">
                                    <ImageIcon className="w-3.5 h-3.5 text-orange-600" />
                                </div>
                                Export as JPG
                            </button>
                            <button
                                onClick={onExportPDF}
                                className="w-full text-left px-4 py-2.5 text-xs font-bold text-gray-700 hover:bg-red-50 hover:text-red-600 flex items-center gap-3 transition-colors outline-none"
                            >
                                <div className="w-6 h-6 rounded-lg bg-red-100 flex items-center justify-center">
                                    <FileText className="w-3.5 h-3.5 text-red-600" />
                                </div>
                                Export as PDF
                            </button>
                        </div>
                    </div>

                    <div className="h-6 w-px bg-gray-200 mx-1" />

                    <button
                        onClick={onToggleRightSidebar}
                        className={`p-2 rounded-xl transition-all active:scale-90 ${!rightSidebarVisible ? 'bg-blue-50 text-blue-600 shadow-sm' : 'hover:bg-gray-100 text-gray-500'}`}
                        title={rightSidebarVisible ? "Hide Properties Panel" : "Show Properties Panel"}
                    >
                        <PanelRight className="w-5 h-5" />
                    </button>
                </div>
            </div>
        </div>
    );
};
