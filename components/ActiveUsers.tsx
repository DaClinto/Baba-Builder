'use client';

import { User } from '@/types';
import { getInitials } from '@/lib/utils';

type ActiveUsersProps = {
    currentUser: User;
    activeUsers: User[];
};

export const ActiveUsers = ({ currentUser, activeUsers }: ActiveUsersProps) => {
    const allUsers = [currentUser, ...activeUsers];

    return (
        <div className="flex items-center gap-2 bg-white/90 backdrop-blur-sm px-3 py-2 rounded-lg shadow-md">
            <span className="text-sm font-medium text-gray-700 mr-1">
                Active: {allUsers.length}
            </span>
            <div className="flex -space-x-2">
                {allUsers.slice(0, 5).map((user) => (
                    <div
                        key={user.id}
                        className="w-8 h-8 rounded-full border-2 border-white flex items-center justify-center text-white text-xs font-semibold"
                        style={{ backgroundColor: user.color }}
                        title={user.name}
                    >
                        {getInitials(user.name)}
                    </div>
                ))}
                {allUsers.length > 5 && (
                    <div className="w-8 h-8 rounded-full border-2 border-white bg-gray-600 flex items-center justify-center text-white text-xs font-semibold">
                        +{allUsers.length - 5}
                    </div>
                )}
            </div>
        </div>
    );
};
