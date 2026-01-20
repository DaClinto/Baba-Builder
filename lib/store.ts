import { atom } from 'jotai';
import { User, Cursor, Reaction, Comment, ToolType, CanvasState } from '@/types';

// Current user
export const currentUserAtom = atom<User | null>(null);

// Active users in the room
export const activeUsersAtom = atom<User[]>([]);

// All cursors from other users
export const cursorsAtom = atom<Cursor[]>([]);

// Live reactions
export const reactionsAtom = atom<Reaction[]>([]);

// Comments on the canvas
export const commentsAtom = atom<Comment[]>([]);

// Current tool selected
export const selectedToolAtom = atom<ToolType>('select');
export const isGridEnabledAtom = atom<boolean>(false);
export const gridSizeAtom = atom<number>(20);
export const learningModeAtom = atom<boolean>(false);

// Canvas state history for undo/redo
export const canvasHistoryAtom = atom<CanvasState[]>([]);
export const historyIndexAtom = atom<number>(-1);

// Selected shapes
export const selectedShapesAtom = atom<string[]>([]);

// Drawing mode
export const isDrawingAtom = atom<boolean>(false);

// Room ID
export const roomIdAtom = atom<string>('default-room');
export const projectNameAtom = atom<string>('Untitled Design');
export const isSavingAtom = atom<boolean>(false);

// Canvas zoom and pan
export const canvasZoomAtom = atom<number>(1);
export const canvasPanAtom = atom<{ x: number; y: number }>({ x: 0, y: 0 });

// Sidebar visibility
export const leftSidebarVisibleAtom = atom<boolean>(true);
export const rightSidebarVisibleAtom = atom<boolean>(true);

// Radius tooltip state
export const radiusTooltipAtom = atom<{ radius: number; x: number; y: number } | null>(null);
