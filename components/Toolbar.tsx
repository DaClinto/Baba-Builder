'use client';

import { ToolType, ToolbarMode } from '@/types';
import { useAtom, useAtomValue } from 'jotai';
import { learningModeAtom, selectedToolAtom, currentToolbarModeAtom } from '@/lib/store';
import {
    MousePointer2,
    Square,
    Circle,
    Triangle,
    Minus,
    Type,
    Pencil,
    Image as ImageIcon,
    Crop,
    Hand,
    MessageCircle,
    Smile,
    Type as TextIcon,
    Scissors,
    Users,
    PlusCircle,
    Layout,
    Frame,
    ChevronUp
} from 'lucide-react';
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

type ToolbarProps = {
    onReaction: (emoji: string) => void;
    handleImageUpload: () => void;
};

const MODE_CONFIG: Record<ToolbarMode, { icon: any; label: string; color: string }> = {
    create: { icon: PlusCircle, label: 'Create', color: 'text-blue-500' },
    layout: { icon: Layout, label: 'Workspace', color: 'text-emerald-500' },
    collaborate: { icon: Users, label: 'Connect', color: 'text-violet-500' },
};

const SHAPE_TOOLS = [
    { type: 'rectangle', icon: Square, label: 'Rectangle' },
    { type: 'circle', icon: Circle, label: 'Circle' },
    { type: 'triangle', icon: Triangle, label: 'Triangle' },
    { type: 'line', icon: Minus, label: 'Line' },
];

export const Toolbar = ({ onReaction, handleImageUpload }: ToolbarProps) => {
    const [selectedTool, setSelectedTool] = useAtom(selectedToolAtom);
    const [toolbarMode, setToolbarMode] = useAtom(currentToolbarModeAtom);
    const learningMode = useAtomValue(learningModeAtom);
    const [isShapeMenuOpen, setIsShapeMenuOpen] = useState(false);

    const handleToolClick = (tool: ToolType) => {
        if (tool === 'image') {
            handleImageUpload();
        } else {
            setSelectedTool(tool);
        }
    };

    return (
        <div className="fixed bottom-10 left-1/2 -translate-x-1/2 z-[100] flex flex-col items-center gap-4">

            {/* Contextual / Mode Selector (Intent-Based) */}
            <div className="glass-floating rounded-2xl p-1 flex items-center gap-1 shadow-2xl animate-in fade-in slide-in-from-bottom-2 duration-500">
                {(Object.entries(MODE_CONFIG) as [ToolbarMode, typeof MODE_CONFIG.create][]).map(([mode, config]) => {
                    const isActive = toolbarMode === mode;
                    const Icon = config.icon;
                    return (
                        <button
                            key={mode}
                            onClick={() => setToolbarMode(mode)}
                            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl transition-all duration-300 relative group
                                ${isActive ? 'bg-white/10 text-white shadow-inner uppercase tracking-widest text-[10px] font-black' : 'text-gray-500 hover:text-gray-300'}`}
                        >
                            <Icon className={`w-4 h-4 ${isActive ? config.color : ''}`} />
                            {isActive && <span>{config.label}</span>}
                            {!isActive && (
                                <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap px-2 py-1 bg-gray-900 text-[10px] font-bold rounded-lg border border-white/10">
                                    {config.label} Mode
                                </div>
                            )}
                        </button>
                    );
                })}
            </div>

            {/* Morphing Tool Dock */}
            <div className="glass-floating rounded-[2rem] p-2 flex items-center gap-1 border border-white/5 shadow-2xl overflow-visible">

                {/* Mode: Create */}
                {toolbarMode === 'create' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1">
                        <ToolButton icon={MousePointer2} label="Select" isActive={selectedTool === 'select'} onClick={() => setSelectedTool('select')} accent="blue" />

                        {/* Fanning Shape Tool */}
                        <div className="relative" onMouseEnter={() => setIsShapeMenuOpen(true)} onMouseLeave={() => setIsShapeMenuOpen(false)}>
                            <ToolButton
                                icon={Square}
                                label="Shapes"
                                isActive={['rectangle', 'circle', 'triangle', 'line'].includes(selectedTool)}
                                onClick={() => setSelectedTool('rectangle')}
                                accent="blue"
                                hasSubmenu
                            />
                            <AnimatePresence>
                                {isShapeMenuOpen && (
                                    <motion.div
                                        initial={{ opacity: 0, scale: 0.8, y: 10 }}
                                        animate={{ opacity: 1, scale: 1, y: 0 }}
                                        exit={{ opacity: 0, scale: 0.8, y: 10 }}
                                        className="absolute bottom-full mb-4 left-1/2 -translate-x-1/2 glass-floating rounded-2xl p-1.5 flex gap-1 border border-white/10 shadow-2xl"
                                    >
                                        {SHAPE_TOOLS.map((shape) => (
                                            <ToolButton
                                                key={shape.type}
                                                icon={shape.icon}
                                                label={shape.label}
                                                isActive={selectedTool === shape.type}
                                                onClick={() => setSelectedTool(shape.type as any)}
                                                accent="blue"
                                                small
                                            />
                                        ))}
                                        <div className="absolute top-full left-1/2 -translate-x-1/2 w-3 h-3 bg-[#0f172a] rotate-45 -translate-y-1.5 border-r border-b border-white/10" />
                                    </motion.div>
                                )}
                            </AnimatePresence>
                        </div>

                        <ToolButton icon={Pencil} label="Draw" isActive={selectedTool === 'draw'} onClick={() => setSelectedTool('draw')} accent="blue" />
                        <ToolButton icon={TextIcon} label="Text" isActive={selectedTool === 'text'} onClick={() => setSelectedTool('text')} accent="blue" />
                        <ToolButton icon={ImageIcon} label="Image" isActive={selectedTool === 'image'} onClick={() => handleImageUpload()} accent="blue" />
                        <ToolButton icon={Frame} label="Frame" isActive={selectedTool === 'frame'} onClick={() => setSelectedTool('frame')} accent="blue" />
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <ToolButton icon={Scissors} label="Snipping Tool" isActive={selectedTool === 'capture'} onClick={() => setSelectedTool('capture')} accent="emerald" />
                    </motion.div>
                )}

                {/* Mode: Layout (Workspace) */}
                {toolbarMode === 'layout' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1">
                        <ToolButton icon={MousePointer2} label="Select" isActive={selectedTool === 'select'} onClick={() => setSelectedTool('select')} accent="emerald" />
                        <ToolButton icon={Hand} label="Hand (Pan)" isActive={selectedTool === 'hand'} onClick={() => setSelectedTool('hand')} accent="emerald" />
                        <div className="w-px h-6 bg-white/10 mx-1" />
                        <ToolButton icon={Crop} label="Crop Tool" isActive={selectedTool === 'crop'} onClick={() => setSelectedTool('crop')} accent="emerald" />
                    </motion.div>
                )}

                {/* Mode: Collaborate (Connect) */}
                {toolbarMode === 'collaborate' && (
                    <motion.div initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} className="flex items-center gap-1">
                        <ToolButton icon={Smile} label="Reactions" isActive={selectedTool === 'reaction'} onClick={() => setSelectedTool('reaction')} accent="violet" />
                        <ToolButton icon={MessageCircle} label="Comments" isActive={selectedTool === 'comment'} onClick={() => setSelectedTool('comment')} accent="violet" />
                    </motion.div>
                )}

                {/* Always Visible: Quick Connection */}
                <div className="w-px h-6 bg-white/10 mx-1" />
                <button
                    onClick={() => onReaction('🔥')}
                    className="p-3 rounded-full hover:bg-white/10 text-gray-400 hover:text-violet-400 transition-all hover:rotate-12 active:scale-90"
                    title="Quick Spark"
                >
                    🔥
                </button>
            </div>
        </div>
    );
};

const ToolButton = ({
    icon: Icon,
    label,
    isActive,
    onClick,
    accent,
    hasSubmenu,
    small
}: {
    icon: any;
    label: string;
    isActive: boolean;
    onClick: () => void;
    accent: 'blue' | 'emerald' | 'violet';
    hasSubmenu?: boolean;
    small?: boolean;
}) => {
    const accents = {
        blue: 'hover:text-blue-400 bg-blue-600 shadow-blue-600/40',
        emerald: 'hover:text-emerald-400 bg-emerald-600 shadow-emerald-600/40',
        violet: 'hover:text-violet-400 bg-violet-600 shadow-violet-600/40',
    };

    return (
        <button
            onClick={onClick}
            className={`relative group p-3 rounded-2xl transition-all duration-300 active:scale-90 flex items-center justify-center
                ${isActive ? `${accents[accent]} text-white shadow-lg` : 'hover:bg-white/10 text-gray-400 hover:text-white'}
                ${small ? 'p-2.5 rounded-xl' : ''}
            `}
        >
            <Icon className={`${small ? 'w-4 h-4' : 'w-5 h-5'} ${hasSubmenu ? 'mr-0.5' : ''}`} />
            {hasSubmenu && <ChevronUp className="w-2.5 h-2.5 opacity-50 absolute -top-1 -right-1" />}

            {/* Tooltip */}
            <div className="absolute bottom-full mb-3 left-1/2 -translate-x-1/2 p-2.5 bg-gray-900 border border-white/10 text-white rounded-xl shadow-2xl opacity-0 group-hover:opacity-100 transition-all pointer-events-none z-[110] transform translate-y-2 group-hover:translate-y-0 w-max min-w-[80px]">
                <div className="text-[10px] font-black uppercase tracking-widest text-center">{label}</div>
            </div>
        </button>
    );
};

