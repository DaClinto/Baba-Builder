'use client';

import { Cursor as CursorType } from '@/types';
import { motion } from 'framer-motion';

type CursorProps = {
    cursor: CursorType;
    userName: string;
    userColor: string;
};

export const Cursor = ({ cursor, userName, userColor }: CursorProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.5 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.5 }}
            transition={{ duration: 0.2 }}
            style={{
                position: 'absolute',
                left: cursor.position.x,
                top: cursor.position.y,
                pointerEvents: 'none',
                zIndex: 1000,
            }}
            className="cursor-wrapper"
        >
            {/* Cursor SVG */}
            <svg
                width="24"
                height="24"
                viewBox="0 0 24 24"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                style={{ transform: 'translate(-2px, -2px)' }}
            >
                <path
                    d="M5.65376 12.3673L8.84677 15.5603L12.3914 8.25592L5.08701 11.8005L5.65376 12.3673Z"
                    fill={userColor}
                />
                <path
                    d="M12.3914 8.25592L8.84677 15.5603L10.5795 17.293L12.3914 8.25592Z"
                    fill={userColor}
                    fillOpacity="0.8"
                />
            </svg>

            {/* User name label */}
            <div
                className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                style={{
                    backgroundColor: userColor,
                    color: '#ffffff',
                    marginTop: 4,
                    marginLeft: 8,
                }}
            >
                {userName}
            </div>

            {/* Cursor chat message */}
            {cursor.message && (
                <div
                    className="px-3 py-2 rounded-lg text-sm shadow-lg max-w-xs"
                    style={{
                        backgroundColor: userColor,
                        color: '#ffffff',
                        marginTop: 8,
                        marginLeft: 8,
                    }}
                >
                    {cursor.message}
                </div>
            )}
        </motion.div>
    );
};
