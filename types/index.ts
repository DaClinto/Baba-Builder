import * as fabric from 'fabric';

export type User = {
    id: string;
    name: string;
    color: string;
    avatar?: string;
};

export type CursorPosition = {
    x: number;
    y: number;
};

export type Cursor = {
    userId: string;
    position: CursorPosition;
    message?: string;
};

export type Reaction = {
    id: string;
    emoji: string;
    userId: string;
    position: CursorPosition;
    timestamp: number;
};

export type Comment = {
    id: string;
    userId: string;
    userName: string;
    text: string;
    position: CursorPosition;
    timestamp: number;
    resolved: boolean;
};

export interface ShadowOptions {
    enabled: boolean;
    color: string;
    blur: number;
    offsetX: number;
    offsetY: number;
    opacity: number;
}

export type CanvasObject = fabric.Object & {
    objectId?: string;
    locked?: boolean;
    shadowOptions?: ShadowOptions;
};

export interface CanvasState {
    version: number;
    objects: any[];
    timestamp: number;
    lastModifiedBy?: string;
}

export interface Page {
    id: string;
    name: string;
    order: number;
};

export type PresenceData = {
    userId: string;
    userName: string;
    userColor: string;
    cursor: CursorPosition | null;
    message?: string;
    lastSeen: number;
};

export enum ShapeType {
    Rectangle = 'rectangle',
    Circle = 'circle',
    Triangle = 'triangle',
    Line = 'line',
    Text = 'text',
    Image = 'image',
    Path = 'path',
    Frame = 'frame',
}

export type ToolType =
    | 'select'
    | 'rectangle'
    | 'circle'
    | 'triangle'
    | 'line'
    | 'text'
    | 'draw'
    | 'image'
    | 'crop'
    | 'hand'
    | 'comment'
    | 'reaction'
    | 'frame'
    | 'capture';

export type ToolbarMode = 'create' | 'layout' | 'collaborate';
