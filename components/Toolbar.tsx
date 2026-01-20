'use client';

import { ToolType } from '@/types';
import { useAtomValue } from 'jotai';
import { learningModeAtom } from '@/lib/store';
import {
    MousePointer2,
    Square,
    Circle,
    Triangle,
    Minus,
    Type,
    Pencil,
    Image,
    Crop,
    Hand,
    MessageCircle,
    Smile,
    Frame,
} from 'lucide-react';

type ToolbarProps = {
    selectedTool: ToolType;
    onToolChange: (tool: ToolType) => void;
    onReaction: (emoji: string) => void;
    className?: string;
};

const tools: { type: ToolType; icon: any; label: string; aiNote: string }[] = [
    { type: 'select', icon: MousePointer2, label: 'Select', aiNote: 'Default tool. Use this to move, resize, and rotate elements on the canvas.' },
    { type: 'rectangle', icon: Square, label: 'Rectangle', aiNote: 'Creates a square or rectangle. Tip: Hold Shift to keep it perfectly square.' },
    { type: 'circle', icon: Circle, label: 'Circle', aiNote: 'Creates a circle. Ideal for avatars, buttons, and round UI elements.' },
    { type: 'triangle', icon: Triangle, label: 'Triangle', aiNote: 'Creates a triangle. Useful for icons, arrows, and geometric patterns.' },
    { type: 'line', icon: Minus, label: 'Line', aiNote: 'Draws a single straight line. Perfect for dividers and connecting elements.' },
    { type: 'text', icon: Type, label: 'Text', aiNote: 'Adds a text box. You can change fonts and sizes in the Properties panel.' },
    { type: 'draw', icon: Pencil, label: 'Draw', aiNote: 'Freehand pencil tool. Great for sketching ideas or adding organic shapes.' },
    { type: 'frame', icon: Frame, label: 'Frame', aiNote: 'A container for elements. Keep your design organized and enable local coordinate systems.' },
    { type: 'image', icon: Image, label: 'Image', aiNote: 'Upload an image from your computer to the canvas.' },
    { type: 'crop', icon: Crop, label: 'Crop', aiNote: 'Crop an image on the canvas. Select an image first, then drag to define the crop area.' },
    { type: 'hand', icon: Hand, label: 'Pan', aiNote: 'Moves the camera view without changing objects. Shortcut: Hold Middle Mouse.' },
    { type: 'comment', icon: MessageCircle, label: 'Comment', aiNote: 'Leave feedback for collaborators at a specific location.' },
];

const reactions = ['👍', '❤️', '😂', '🎉', '🔥', '👏'];

export const Toolbar = ({ selectedTool, onToolChange, onReaction, className = '' }: ToolbarProps) => {
    const learningMode = useAtomValue(learningModeAtom);
    return (
        <div className={`fixed top-1/2 -translate-y-1/2 bg-white/95 backdrop-blur-sm rounded-2xl shadow-2xl p-2 flex flex-col gap-1 border border-gray-200 z-50 ${className}`}>
            {/* Tools */}
            {tools.map((tool) => {
                const Icon = tool.icon;
                const isActive = selectedTool === tool.type;

                return (
                    <button
                        key={tool.type}
                        onClick={() => onToolChange(tool.type)}
                        className={`
              p-3 rounded-xl transition-all duration-200 relative group
              ${isActive
                                ? 'bg-blue-500 text-white shadow-lg scale-105'
                                : 'hover:bg-gray-100 text-gray-700'
                            }
            `}
                        title={tool.label}
                    >
                        <Icon className="w-5 h-5" />

                        {/* Tooltip */}
                        <div className={`absolute left-full ml-3 p-2 bg-gray-900 text-white rounded-lg shadow-xl opacity-0 group-hover:opacity-100 transition-opacity whitespace-normal pointer-events-none z-[100] ${learningMode ? 'w-48' : 'w-auto'}`}>
                            <div className="text-xs font-bold border-b border-gray-700 pb-1 mb-1">{tool.label}</div>
                            {learningMode && (
                                <div className="text-[10px] text-gray-300 leading-tight">
                                    <span className="text-blue-400 font-bold uppercase tracking-tighter">AI Logic:</span> {tool.aiNote}
                                </div>
                            )}
                        </div>
                    </button>
                );
            })}

            {/* Divider */}
            <div className="h-px bg-gray-200 my-1" />

            {/* Reactions */}
            <div className="relative">
                <button
                    onClick={() => onToolChange(selectedTool === 'reaction' ? 'select' : 'reaction' as any)}
                    className={`p-3 rounded-xl transition-colors ${selectedTool === ('reaction' as any) ? 'bg-blue-500 text-white' : 'hover:bg-gray-100 text-gray-700'}`}
                    title="Reactions"
                >
                    <Smile className="w-5 h-5" />
                </button>

                {/* Reactions popup - show if selectedTool is reaction */}
                {selectedTool === ('reaction' as any) && (
                    <div className="absolute left-full ml-2 bg-white rounded-xl shadow-xl p-2 border border-gray-200 flex gap-1 z-[60] animate-in fade-in slide-in-from-left-2 duration-200">
                        {reactions.map((emoji) => (
                            <button
                                key={emoji}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onReaction(emoji);
                                }}
                                className="w-10 h-10 rounded-lg hover:bg-gray-100 transition-colors text-xl flex items-center justify-center animate-bounce-short"
                            >
                                {emoji}
                            </button>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
};
