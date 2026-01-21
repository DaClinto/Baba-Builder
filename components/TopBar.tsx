'use client';

import { Undo, Redo, Download, Trash2, Eraser, ZoomIn, ZoomOut, Home, Cloud, CloudCheck, ChevronRight, PanelLeft, PanelRight, Save, FileImage, FileText } from 'lucide-react';
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
    onExportSVG,
    onExportPDF,
    onZoomIn,
    onZoomOut,
    zoom,
    canUndo,
    canRedo,
}: TopBarProps) => {
    return (
        <div className="fixed top-0 left-0 right-0 h-16 bg-white/95 backdrop-blur-sm border-b border-gray-200 flex items-center justify-between px-6 z-40">
            {/* Left: Logo & Project Name */}
            <div className="flex items-center gap-4">
                <div className="flex items-center gap-1">
                    <Link
                        href="/"
                        className="p-2 hover:bg-gray-100 rounded-lg transition-colors group"
                        title="Back to Projects"
                    >
                        <Home className="w-5 h-5 text-gray-500 group-hover:text-blue-600" />
                    </Link>

                    <button
                        onClick={onToggleLeftSidebar}
                        className={`p-2 rounded-lg transition-colors ${!leftSidebarVisible ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                        title={leftSidebarVisible ? "Hide Layer Panel" : "Show Layer Panel"}
                    >
                        <PanelLeft className="w-5 h-5" />
                    </button>
                </div>

                <div className="h-6 w-px bg-gray-300" />

                <div className="flex flex-col">
                    <div className="flex items-center gap-1.5 text-xs text-gray-400 font-medium uppercase tracking-wider">
                        <span>Baba Builder</span>
                        <ChevronRight className="w-3 h-3" />
                        <div className="flex items-center gap-1">
                            {isSaving ? (
                                <Cloud className="w-3 h-3 animate-pulse text-blue-500" />
                            ) : (
                                <CloudCheck className="w-3 h-3 text-green-500" />
                            )}
                            <span>{isSaving ? 'Saving...' : 'Saved to Cloud'}</span>
                        </div>
                    </div>
                    <input
                        type="text"
                        value={projectName}
                        onChange={(e) => onRename(e.target.value)}
                        className="bg-transparent border-none focus:ring-0 font-bold text-gray-900 p-0 text-sm hover:bg-gray-50 rounded px-1 -ml-1 transition-colors w-48 truncate"
                        title="Click to rename"
                    />
                </div>

                <div className="h-6 w-px bg-gray-300 ml-2" />
                <ActiveUsers currentUser={currentUser} activeUsers={activeUsers} />
            </div>

            {/* Center: Actions */}
            <div className="flex items-center gap-2">
                <button
                    onClick={onUndo}
                    disabled={!canUndo}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Undo (Ctrl+Z)"
                >
                    <Undo className="w-5 h-5 text-gray-700" />
                </button>

                <button
                    onClick={onRedo}
                    disabled={!canRedo}
                    className="p-2 rounded-lg hover:bg-gray-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                    title="Redo (Ctrl+Y)"
                >
                    <Redo className="w-5 h-5 text-gray-700" />
                </button>

                <div className="h-6 w-px bg-gray-300 mx-2" />

                {onSave && (
                    <button
                        onClick={onSave}
                        disabled={!hasUnsavedChanges || isSaving}
                        className={`px-3 py-2 rounded-lg font-medium transition-colors flex items-center gap-2 text-sm ${
                            hasUnsavedChanges && !isSaving
                                ? 'bg-blue-600 hover:bg-blue-700 text-white shadow-lg shadow-blue-600/20'
                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        }`}
                        title={hasUnsavedChanges ? "Save to cloud (Ctrl+S)" : "No changes to save"}
                    >
                        <Save className="w-4 h-4" />
                        {isSaving ? 'Saving...' : 'Save'}
                    </button>
                )}

                <div className="h-6 w-px bg-gray-300 mx-2" />

                <button
                    onClick={onZoomOut}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Zoom Out"
                >
                    <ZoomOut className="w-5 h-5 text-gray-700" />
                </button>

                <div className="px-3 py-1 bg-gray-100 rounded-lg text-sm font-medium text-gray-700 min-w-[60px] text-center">
                    {Math.round(zoom * 100)}%
                </div>

                <button
                    onClick={onZoomIn}
                    className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
                    title="Zoom In"
                >
                    <ZoomIn className="w-5 h-5 text-gray-700" />
                </button>

                <div className="h-6 w-px bg-gray-300 mx-2" />

                <button
                    onClick={onClear}
                    className="p-2 rounded-lg hover:bg-orange-50 transition-colors group"
                    title="Clear All Canvas Content (Keeps File)"
                >
                    <Eraser className="w-5 h-5 text-orange-600 group-hover:scale-110 transition-transform" />
                </button>

                {onDeleteProject && (
                    <button
                        onClick={onDeleteProject}
                        className="p-2 rounded-lg hover:bg-red-50 transition-colors group"
                        title="Delete Entire Project Permanently"
                    >
                        <Trash2 className="w-5 h-5 text-red-600 font-black group-hover:scale-110 transition-transform" />
                    </button>
                )}

                <button
                    onClick={onExport}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20 text-sm"
                    title="Export as PNG"
                >
                    <Download className="w-4 h-4" />
                    PNG
                </button>

                <button
                    onClick={onExportSVG}
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-blue-600/20 text-sm"
                    title="Export as SVG"
                >
                    <Download className="w-4 h-4" />
                    SVG
                </button>

                <button
                    onClick={onExportPDF}
                    className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 shadow-lg shadow-red-600/20 text-sm"
                    title="Export as PDF"
                >
                    <FileText className="w-4 h-4" />
                    PDF
                </button>
            </div>

            {/* Right: Toggle Right & User Profile */}
            <div className="flex items-center gap-3">
                <button
                    onClick={onToggleRightSidebar}
                    className={`p-2 rounded-lg transition-colors ${!rightSidebarVisible ? 'bg-blue-100 text-blue-600' : 'hover:bg-gray-100 text-gray-500'}`}
                    title={rightSidebarVisible ? "Hide Properties Panel" : "Show Properties Panel"}
                >
                    <PanelRight className="w-5 h-5" />
                </button>

                <div className="h-6 w-px bg-gray-300" />

                <div className="flex flex-col items-end mr-2">
                    <span className="text-[10px] font-bold text-blue-600 uppercase tracking-tighter bg-blue-50 px-1.5 py-0.5 rounded">Editor</span>
                </div>
                <div
                    className="w-8 h-8 rounded-full shadow-md border-2 border-white flex items-center justify-center text-xs font-bold text-white uppercase"
                    style={{ backgroundColor: currentUser.color }}
                >
                    {currentUser.name[0]}
                </div>
            </div>
        </div>
    );
};
