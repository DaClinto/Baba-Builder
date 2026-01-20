'use client';

import React, { useState, useRef, useEffect } from 'react';
import * as fabric from 'fabric';
import {
    Square, Circle, Triangle, Minus, Type, Image as ImageIcon,
    Layers, Eye, EyeOff, Lock, Unlock, ChevronRight, ChevronDown,
    Folder, FolderOpen, MoreVertical, Edit2, Trash2, Group
} from 'lucide-react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

interface LayerItemProps {
    id: string;
    obj: fabric.Object;
    depth: number;
    isSelected: boolean;
    onSelect: (id: string, multi: boolean, range: boolean) => void;
    onToggleVisibility: (id: string) => void;
    onToggleLock: (id: string) => void;
    onRename: (id: string, newName: string) => void;
    onDelete: (id: string) => void;
    isExpanded?: boolean;
    onToggleExpand?: (id: string) => void;
    isGroup?: boolean;
}

export const LayerItem = ({
    id,
    obj,
    depth,
    isSelected,
    onSelect,
    onToggleVisibility,
    onToggleLock,
    onRename,
    onDelete,
    isExpanded,
    onToggleExpand,
    isGroup
}: LayerItemProps) => {
    const [isEditing, setIsEditing] = useState(false);
    const [tempName, setTempName] = useState((obj as any).name || (obj as any).text || obj.type);
    const inputRef = useRef<HTMLInputElement>(null);

    const {
        attributes,
        listeners,
        setNodeRef,
        transform,
        transition,
        isDragging
    } = useSortable({ id });

    const style = {
        transform: CSS.Transform.toString(transform),
        transition,
        opacity: isDragging ? 0.5 : 1,
        paddingLeft: `${depth * 12 + 8}px`,
    };

    useEffect(() => {
        if (isEditing && inputRef.current) {
            inputRef.current.focus();
            inputRef.current.select();
        }
    }, [isEditing]);

    const handleDoubleClick = () => {
        setIsEditing(true);
    };

    const handleBlur = () => {
        setIsEditing(false);
        onRename(id, tempName);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.key === 'Enter') {
            setIsEditing(false);
            onRename(id, tempName);
        } else if (e.key === 'Escape') {
            setIsEditing(false);
            setTempName((obj as any).name || (obj as any).text || obj.type);
        }
    };

    const getIcon = () => {
        if (isGroup) return isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />;

        const type = obj.type;
        if (type === 'rect') return <Square className="w-3.5 h-3.5" />;
        if (type === 'circle') return <Circle className="w-3.5 h-3.5" />;
        if (type === 'triangle') return <Triangle className="w-3.5 h-3.5" />;
        if (type === 'line') return <Minus className="w-3.5 h-3.5" />;
        if (type === 'i-text' || type === 'text') return <Type className="w-3.5 h-3.5" />;
        if (type === 'image') return <ImageIcon className="w-3.5 h-3.5" />;
        if (type === 'group') return <Group className="w-3.5 h-3.5" />;
        return <Layers className="w-3.5 h-3.5" />;
    };

    const getName = () => {
        if ((obj as any).name) return (obj as any).name;
        if (obj.type === 'i-text' || obj.type === 'text') return (obj as any).text || 'Text';
        return obj.type?.charAt(0).toUpperCase() + obj.type?.slice(1) || 'Object';
    };

    const isLocked = (obj as any).locked;
    const isVisible = obj.visible !== false;

    return (
        <div
            ref={setNodeRef}
            style={style}
            className={`
                group flex items-center gap-2 py-1.5 pr-2 select-none cursor-default border-y border-transparent transition-colors
                ${isSelected ? 'bg-blue-500/10 border-blue-500/20 text-blue-700' : 'hover:bg-gray-50 text-gray-700'}
                ${isDragging ? 'z-50 shadow-lg bg-white border-blue-500' : ''}
            `}
            onClick={(e) => {
                e.stopPropagation();
                onSelect(id, e.ctrlKey || e.metaKey, e.shiftKey);
            }}
            onDoubleClick={handleDoubleClick}
            {...attributes}
            {...listeners}
        >
            <div className="flex items-center gap-2 flex-1 min-w-0">
                {isGroup && (
                    <button
                        onClick={(e) => {
                            e.stopPropagation();
                            onToggleExpand?.(id);
                        }}
                        className="p-0.5 hover:bg-gray-200 rounded text-gray-400"
                    >
                        {isExpanded ? <ChevronDown className="w-3 h-3" /> : <ChevronRight className="w-3 h-3" />}
                    </button>
                )}

                <span className={`${isSelected ? 'text-blue-500' : 'text-gray-400'}`}>
                    {getIcon()}
                </span>

                {isEditing ? (
                    <input
                        ref={inputRef}
                        className="bg-white border border-blue-500 rounded px-1 text-xs py-0.5 w-full outline-none shadow-sm"
                        value={tempName}
                        onChange={(e) => setTempName(e.target.value)}
                        onBlur={handleBlur}
                        onKeyDown={handleKeyDown}
                        onClick={(e) => e.stopPropagation()}
                    />
                ) : (
                    <span className={`text-[11px] font-medium truncate py-0.5 ${isLocked ? 'text-gray-400 italic' : ''}`}>
                        {getName()}
                    </span>
                )}
            </div>

            <div className={`flex items-center gap-0.5 transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleLock(id);
                    }}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${isLocked ? 'text-blue-500' : 'text-gray-400 hover:text-gray-600'}`}
                    title={isLocked ? 'Unlock' : 'Lock'}
                >
                    {isLocked ? <Lock className="w-3 h-3" /> : <Unlock className="w-3 h-3" />}
                </button>
                <button
                    onClick={(e) => {
                        e.stopPropagation();
                        onToggleVisibility(id);
                    }}
                    className={`p-1 rounded hover:bg-gray-200 transition-colors ${!isVisible ? 'text-red-500' : 'text-gray-400 hover:text-gray-600'}`}
                    title={isVisible ? 'Hide' : 'Show'}
                >
                    {isVisible ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                </button>
            </div>
        </div>
    );
};
