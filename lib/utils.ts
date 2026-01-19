// Generate random color for users
export const generateUserColor = () => {
    const colors = [
        '#ef4444', // red
        '#f59e0b', // amber
        '#10b981', // emerald
        '#3b82f6', // blue
        '#8b5cf6', // violet
        '#ec4899', // pink
        '#06b6d4', // cyan
        '#f97316', // orange
    ];

    return colors[Math.floor(Math.random() * colors.length)];
};

// Generate random username
export const generateUsername = () => {
    const adjectives = ['Happy', 'Creative', 'Awesome', 'Brilliant', 'Dynamic', 'Epic', 'Fantastic', 'Great'];
    const nouns = ['Designer', 'Artist', 'Creator', 'Maker', 'Builder', 'Developer', 'Innovator', 'Visionary'];

    const adjective = adjectives[Math.floor(Math.random() * adjectives.length)];
    const noun = nouns[Math.floor(Math.random() * nouns.length)];
    const number = Math.floor(Math.random() * 100);

    return `${adjective} ${noun} ${number}`;
};

// Get initials from name
export const getInitials = (name: string) => {
    return name
        .split(' ')
        .map(word => word[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
};

// Format timestamp
export const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diff = now.getTime() - date.getTime();

    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString();
};

// Clamp value between min and max
export const clamp = (value: number, min: number, max: number) => {
    return Math.min(Math.max(value, min), max);
};

// Debounce function
export const debounce = <T extends (...args: any[]) => any>(
    func: T,
    wait: number
): ((...args: Parameters<T>) => void) & { flush: () => void; cancel: () => void } => {
    let timeout: NodeJS.Timeout | null = null;
    let lastArgs: Parameters<T> | null = null;

    const debounced = (...args: Parameters<T>) => {
        lastArgs = args;
        if (timeout) clearTimeout(timeout);
        timeout = setTimeout(() => {
            func(...args);
            timeout = null;
            lastArgs = null;
        }, wait);
    };

    debounced.flush = () => {
        if (timeout && lastArgs) {
            clearTimeout(timeout);
            func(...lastArgs);
            timeout = null;
            lastArgs = null;
        }
    };

    debounced.cancel = () => {
        if (timeout) {
            clearTimeout(timeout);
            timeout = null;
            lastArgs = null;
        }
    };

    return debounced;
};

// Throttle function
export const throttle = <T extends (...args: any[]) => any>(
    func: T,
    limit: number
): ((...args: Parameters<T>) => void) => {
    let inThrottle: boolean = false;

    return (...args: Parameters<T>) => {
        if (!inThrottle) {
            func(...args);
            inThrottle = true;
            setTimeout(() => (inThrottle = false), limit);
        }
    };
};
// Image resizing utility to keep base64 strings small (essential for Firestore)
export const resizeImage = (dataUrl: string, maxWidth = 1000): Promise<string> => {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => {
            const canvas = document.createElement('canvas');
            let width = img.width;
            let height = img.height;

            if (width > maxWidth) {
                height *= maxWidth / width;
                width = maxWidth;
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            if (!ctx) {
                resolve(dataUrl);
                return;
            }
            ctx.drawImage(img, 0, 0, width, height);
            resolve(canvas.toDataURL('image/jpeg', 0.85)); // 0.85 quality JPEG
        };
        img.onerror = () => resolve(dataUrl);
        img.src = dataUrl;
    });
};
