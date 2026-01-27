'use client';

import { useState, useEffect } from 'react';
import * as fabric from 'fabric';
import {
    AlignLeft, AlignCenter, AlignRight, AlignJustify,
    Type, List, ListOrdered, MoveHorizontal, MoveVertical
} from 'lucide-react';

interface Props {
    canvas: fabric.Canvas | null;
    activeObject: fabric.Object;
    handleUpdate: (updates: any) => void;
}

export const TypographyControls = ({ canvas, activeObject, handleUpdate }: Props) => {
    const [charSpacing, setCharSpacing] = useState(0);
    const [lineHeight, setLineHeight] = useState(1.16);
    const [textAlign, setTextAlign] = useState('left');

    // Sync state with active object
    useEffect(() => {
        if (!activeObject) return;

        // Fabric types
        const obj = activeObject as any;

        setCharSpacing(obj.charSpacing || 0);
        setLineHeight(obj.lineHeight || 1.16);
        setTextAlign(obj.textAlign || 'left');
    }, [activeObject]);

    const updateValue = (key: string, value: any) => {
        handleUpdate({ [key]: value });
        if (key === 'charSpacing') setCharSpacing(value);
        if (key === 'lineHeight') setLineHeight(value);
        if (key === 'textAlign') setTextAlign(value);
    };

    const toggleList = (type: 'bullet' | 'number') => {
        if (!activeObject || !(activeObject instanceof fabric.IText || activeObject instanceof fabric.Textbox)) return;

        const textObj = activeObject as fabric.IText;
        let text = textObj.text || '';
        const lines = text.split('\n');

        // Check if already a list
        const isBullet = lines.every(l => l.trim().startsWith('• '));
        const isNumber = lines.every(l => /^\d+\.\s/.test(l.trim()));

        let newText = text;

        if (type === 'bullet') {
            if (isBullet) {
                // Remove bullets
                newText = lines.map(l => l.replace(/^•\s/, '')).join('\n');
            } else {
                // Add bullets (stripping numbers if present)
                newText = lines.map(l => '• ' + l.replace(/^\d+\.\s/, '').replace(/^•\s/, '')).join('\n');
            }
        } else if (type === 'number') {
            if (isNumber) {
                // Remove numbers
                newText = lines.map(l => l.replace(/^\d+\.\s/, '')).join('\n');
            } else {
                // Add numbers (stripping bullets if present)
                newText = lines.map((l, i) => `${i + 1}. ` + l.replace(/^•\s/, '').replace(/^\d+\.\s/, '')).join('\n');
            }
        }

        handleUpdate({ text: newText });
        // Restore cursor/selection? Fabric handles this usually.
    };

    const toggleFixedSize = (fixed: boolean) => {
        handleUpdate({
            lockScalingX: fixed,
            lockScalingY: fixed,
            // When fixed size (autosizing off), we might want to switch to Textbox from IText if needed, 
            // but commonly we just lock scaling to prevent accidental resize.
        });
    };

    return (
        <div className="flex flex-col gap-3 py-2">
            {/* Alignment Row */}
            <div className="flex items-center gap-1 bg-gray-50 rounded p-1 justify-between">
                <button
                    onClick={() => updateValue('textAlign', 'left')}
                    className={`p-1.5 rounded hover:bg-gray-200 ${textAlign === 'left' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    title="Align Left"
                >
                    <AlignLeft className="w-4 h-4" />
                </button>
                <button
                    onClick={() => updateValue('textAlign', 'center')}
                    className={`p-1.5 rounded hover:bg-gray-200 ${textAlign === 'center' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    title="Align Center"
                >
                    <AlignCenter className="w-4 h-4" />
                </button>
                <button
                    onClick={() => updateValue('textAlign', 'right')}
                    className={`p-1.5 rounded hover:bg-gray-200 ${textAlign === 'right' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    title="Align Right"
                >
                    <AlignRight className="w-4 h-4" />
                </button>
                <button
                    onClick={() => updateValue('textAlign', 'justify')}
                    className={`p-1.5 rounded hover:bg-gray-200 ${textAlign === 'justify' ? 'bg-white shadow-sm text-blue-600' : 'text-gray-500'}`}
                    title="Justify"
                >
                    <AlignJustify className="w-4 h-4" />
                </button>
            </div>

            {/* Spacing & Line Height */}
            <div className="grid grid-cols-2 gap-2">
                <div className="flex items-center gap-2" title="Letter Spacing">
                    <MoveHorizontal className="w-4 h-4 text-gray-400" />
                    <input
                        type="number"
                        value={charSpacing}
                        onChange={(e) => updateValue('charSpacing', parseInt(e.target.value) || 0)}
                        className="w-full bg-gray-50 rounded px-2 py-1 text-xs border-none focus:ring-1 focus:ring-blue-500"
                        step="10"
                    />
                </div>
                <div className="flex items-center gap-2" title="Line Height">
                    <MoveVertical className="w-4 h-4 text-gray-400" />
                    <input
                        type="number"
                        value={lineHeight}
                        onChange={(e) => updateValue('lineHeight', parseFloat(e.target.value) || 1)}
                        className="w-full bg-gray-50 rounded px-2 py-1 text-xs border-none focus:ring-1 focus:ring-blue-500"
                        step="0.1"
                    />
                </div>
            </div>

            {/* List Items */}
            <div className="flex gap-2 border-t border-gray-100 pt-2">
                <button
                    onClick={() => toggleList('bullet')}
                    className="flex-1 p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs flex items-center justify-center gap-2"
                >
                    <List className="w-4 h-4" /> Bullet
                </button>
                <button
                    onClick={() => toggleList('number')}
                    className="flex-1 p-2 rounded bg-gray-50 hover:bg-gray-100 text-gray-600 text-xs flex items-center justify-center gap-2"
                >
                    <ListOrdered className="w-4 h-4" /> Number
                </button>
            </div>

            {/* Fixed Size Toggle */}
            <div className="flex items-center gap-2 pt-2">
                <input
                    type="checkbox"
                    id="fixedSize-toggle"
                    checked={(activeObject as any).lockScalingX || false}
                    onChange={(e) => toggleFixedSize(e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="fixedSize-toggle" className="text-xs text-gray-600">Fixed Size (Prevent Scaling)</label>
            </div>
        </div>
    );
};
