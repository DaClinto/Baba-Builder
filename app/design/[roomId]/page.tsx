'use client';

import { useEffect, useState } from 'react';
import { useAtom } from 'jotai';
import dynamic from 'next/dynamic';
import { useParams } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { currentUserAtom, roomIdAtom } from '@/lib/store';
import { generateUserColor, generateUsername } from '@/lib/utils';
import { User } from '@/types';

const Canvas = dynamic(() => import('@/components/Canvas').then(mod => mod.Canvas), {
    ssr: false,
    loading: () => <div className="flex items-center justify-center h-screen">Kanvaso...</div>,
});

export default function DesignPage() {
    const [currentUser, setCurrentUser] = useAtom(currentUserAtom);
    const [, setRoomId] = useAtom(roomIdAtom);
    const [isClient, setIsClient] = useState(false);
    const params = useParams();

    useEffect(() => {
        setIsClient(true);

        // Set Room ID from URL
        if (params?.roomId) {
            setRoomId(params.roomId as string);
        }

        // Check if user is already stored in session storage
        const storedUser = sessionStorage.getItem('kanvaso-user');

        if (storedUser) {
            setCurrentUser(JSON.parse(storedUser));
        } else {
            // Create new user
            const newUser: User = {
                id: uuidv4(),
                name: generateUsername(),
                color: generateUserColor(),
            };

            sessionStorage.setItem('kanvaso-user', JSON.stringify(newUser));
            setCurrentUser(newUser);
        }
    }, [setCurrentUser, params, setRoomId]);

    if (!isClient) return null;

    return (
        <main className="min-h-screen">
            <Canvas />
        </main>
    );
}
