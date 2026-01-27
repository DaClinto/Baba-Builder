import { useEffect, useState } from 'react';
import {
    collection,
    doc,
    onSnapshot,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    where,
    serverTimestamp,
    Timestamp,
    orderBy,
    addDoc
} from 'firebase/firestore';
import { db } from './firebase';
import { PresenceData, Cursor, Reaction, Comment, CanvasState, Page } from '@/types';

// Hook to manage user presence
export const usePresence = (roomId: string, userId: string, userName: string, userColor: string) => {
    const [activeUsers, setActiveUsers] = useState<PresenceData[]>([]);

    useEffect(() => {
        if (!roomId || !userId) return;

        const presenceRef = doc(db, 'rooms', roomId, 'presence', userId);

        // Set initial presence
        const setPresence = async () => {
            await setDoc(presenceRef, {
                userId,
                userName,
                userColor,
                cursor: null,
                lastSeen: Date.now(),
            });
        };

        setPresence();

        // Update presence every 5 seconds
        const interval = setInterval(() => {
            updateDoc(presenceRef, {
                lastSeen: Date.now(),
            }).catch(console.error);
        }, 5000);

        // Listen to all active users
        const presenceQuery = query(collection(db, 'rooms', roomId, 'presence'));
        const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
            const users: PresenceData[] = [];
            const now = Date.now();

            snapshot.forEach((doc) => {
                const data = doc.data() as PresenceData;
                // Only include users active in the last 10 seconds
                if (now - data.lastSeen < 10000 && data.userId !== userId) {
                    users.push(data);
                }
            });

            setActiveUsers(users);
        });

        // Cleanup on unmount
        return () => {
            clearInterval(interval);
            deleteDoc(presenceRef).catch(console.error);
            unsubscribe();
        };
    }, [roomId, userId, userName, userColor]);

    // Update cursor position and optional message
    const updateCursor = async (x: number | null, y: number | null, message?: string) => {
        if (!roomId || !userId) return;

        const presenceRef = doc(db, 'rooms', roomId, 'presence', userId);
        const data: any = {
            lastSeen: Date.now(),
        };

        // Always update cursor position
        data.cursor = x !== null && y !== null ? { x, y } : null;

        // If message is provided, update it. If message is explicitly undefined, don't change it.
        // If message is null or empty string, it will clear the message.
        if (message !== undefined) {
            data.message = message || null;
        }

        await updateDoc(presenceRef, data);
    };

    return { activeUsers, updateCursor };
};

// Hook to manage cursors
export const useCursors = (roomId: string, userId: string) => {
    const [cursors, setCursors] = useState<Cursor[]>([]);

    useEffect(() => {
        if (!roomId) return;

        const presenceQuery = query(collection(db, 'rooms', roomId, 'presence'));
        const unsubscribe = onSnapshot(presenceQuery, (snapshot) => {
            const newCursors: Cursor[] = [];

            snapshot.forEach((doc) => {
                const data = doc.data() as PresenceData;
                if (data.userId !== userId && data.cursor) {
                    newCursors.push({
                        userId: data.userId,
                        position: data.cursor,
                        message: data.message,
                    });
                }
            });

            setCursors(newCursors);
        });

        return () => unsubscribe();
    }, [roomId, userId]);

    return cursors;
};

// Hook to manage reactions
export const useReactions = (roomId: string) => {
    const [reactions, setReactions] = useState<Reaction[]>([]);

    useEffect(() => {
        if (!roomId) return;

        const reactionsQuery = query(collection(db, 'rooms', roomId, 'reactions'));
        const unsubscribe = onSnapshot(reactionsQuery, (snapshot) => {
            const newReactions: Reaction[] = [];
            const now = Date.now();

            snapshot.forEach((doc) => {
                const data = doc.data();
                // Only show reactions from the last 6 seconds
                if (now - data.timestamp < 6000) {
                    newReactions.push({
                        id: doc.id,
                        ...data,
                    } as Reaction);
                } else {
                    // Delete old reactions
                    deleteDoc(doc.ref).catch(console.error);
                }
            });

            setReactions(newReactions);
        });

        return () => unsubscribe();
    }, [roomId]);

    const addReaction = async (emoji: string, userId: string, x: number, y: number) => {
        if (!roomId) return;

        const reactionRef = doc(collection(db, 'rooms', roomId, 'reactions'));
        await setDoc(reactionRef, {
            emoji,
            userId,
            position: { x, y },
            timestamp: Date.now(),
        });
    };

    return { reactions, addReaction };
};

// Hook to manage comments
export const useComments = (roomId: string) => {
    const [comments, setComments] = useState<Comment[]>([]);

    useEffect(() => {
        if (!roomId) return;

        const commentsQuery = query(
            collection(db, 'rooms', roomId, 'comments'),
            where('resolved', '==', false)
        );

        const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const newComments: Comment[] = [];

            snapshot.forEach((doc) => {
                newComments.push({
                    id: doc.id,
                    ...doc.data(),
                } as Comment);
            });

            setComments(newComments);
        });

        return () => unsubscribe();
    }, [roomId]);

    const addComment = async (text: string, userId: string, userName: string, x: number, y: number) => {
        if (!roomId) return;

        const commentRef = doc(collection(db, 'rooms', roomId, 'comments'));
        await setDoc(commentRef, {
            text,
            userId,
            userName,
            position: { x, y },
            timestamp: Date.now(),
            resolved: false,
        });
    };

    const resolveComment = async (commentId: string) => {
        if (!roomId) return;

        const commentRef = doc(db, 'rooms', roomId, 'comments', commentId);
        await updateDoc(commentRef, {
            resolved: true,
        });
    };

    return { comments, addComment, resolveComment };
};

// Hook to manage pages
export const usePages = (roomId: string) => {
    const [pages, setPages] = useState<Page[]>([]);

    useEffect(() => {
        if (!roomId) return;

        const pagesQuery = query(collection(db, 'rooms', roomId, 'pages'), orderBy('order', 'asc'));

        const unsubscribe = onSnapshot(pagesQuery, (snapshot) => {
            const newPages: Page[] = [];
            snapshot.forEach((doc) => {
                newPages.push({ id: doc.id, ...doc.data() } as Page);
            });

            // If no pages exist, create a default one
            if (newPages.length === 0 && snapshot.metadata.hasPendingWrites === false) {
                // We handle initialization in the component or here?
                // Better to let component handle it via addPage if empty
            }

            setPages(newPages);
        });

        return () => unsubscribe();
    }, [roomId]);

    const addPage = async (name: string) => {
        if (!roomId) return;
        const pagesRef = collection(db, 'rooms', roomId, 'pages');
        await addDoc(pagesRef, {
            name,
            order: Date.now(), // Simple ordering
            createdAt: Date.now()
        });
    };

    const deletePage = async (pageId: string) => {
        if (!roomId) return;
        await deleteDoc(doc(db, 'rooms', roomId, 'pages', pageId));
    };

    return { pages, addPage, deletePage };
};

// Hook to manage canvas state
export const useCanvasState = (roomId: string, pageId: string = 'default') => {
    const [canvasState, setCanvasState] = useState<CanvasState | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (!roomId || !pageId) return;

        // Path: rooms/ROOMID/pages/PAGEID
        const canvasRef = doc(db, 'rooms', roomId, 'pages', pageId);

        const unsubscribe = onSnapshot(canvasRef, (snapshot) => {
            if (snapshot.exists()) {
                const data = snapshot.data();
                // Check if data has 'objects' (it might be just page metadata if we mixed them)
                // Actually, we should store canvas state IN the page doc or a subcollection?
                // Storing inside the page doc is fine for now.
                if (data.objects) {
                    let parsedObjects = data.objects;
                    if (typeof data.objects === 'string') {
                        try {
                            parsedObjects = JSON.parse(data.objects);
                        } catch (e) {
                            console.error('Failed to parse objects', e);
                            parsedObjects = [];
                        }
                    }
                    setCanvasState({ ...data, objects: parsedObjects } as CanvasState);
                } else {
                    setCanvasState(null); // Valid page but empty canvas
                }
            } else {
                setCanvasState(null);
            }
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, [roomId, pageId]);

    const saveCanvasState = async (state: any) => {
        if (!roomId || !pageId) return;

        const canvasRef = doc(db, 'rooms', roomId, 'pages', pageId);

        // Serialize objects to string to avoid Firestore nested array issues
        const serializedObjects = JSON.stringify(state.objects || []);

        await setDoc(canvasRef, {
            version: Date.now(),
            objects: serializedObjects,
            timestamp: Date.now(),
            lastModifiedBy: state.userId || 'unknown',
        }, { merge: true });
    };

    return { canvasState, saveCanvasState, isLoading };
};

// Hook to manage project metadata (like name)
export const useProjectMetadata = (roomId: string) => {
    const [projectData, setProjectData] = useState<{ name: string } | null>(null);

    useEffect(() => {
        if (!roomId) return;

        const projectRef = doc(db, 'projects', roomId);
        const unsubscribe = onSnapshot(projectRef, (snapshot) => {
            if (snapshot.exists()) {
                setProjectData(snapshot.data() as { name: string });
            }
        });

        return () => unsubscribe();
    }, [roomId]);

    const updateProjectName = async (name: string) => {
        if (!roomId) return;
        const projectRef = doc(db, 'projects', roomId);
        await setDoc(projectRef, {
            name,
            lastOpened: Date.now(),
        }, { merge: true });
    };

    const updateProjectThumbnail = async (thumbnail: string) => {
        if (!roomId) return;
        const projectRef = doc(db, 'projects', roomId);
        await setDoc(projectRef, {
            thumbnail,
            lastOpened: Date.now(),
        }, { merge: true });
    };

    return { projectData, updateProjectName, updateProjectThumbnail };
};

// Hook to list all projects
export const useProjectsList = () => {
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const projectsQuery = query(collection(db, 'projects'), orderBy('lastOpened', 'desc'));
        const unsubscribe = onSnapshot(projectsQuery, (snapshot) => {
            const list: any[] = [];
            snapshot.forEach((doc) => {
                list.push({ id: doc.id, ...doc.data() });
            });
            setProjects(list);
            setIsLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return { projects, isLoading };
};
