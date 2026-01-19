'use client';

import { Comment as CommentType } from '@/types';
import { MessageCircle, Check } from 'lucide-react';
import { formatTimestamp } from '@/lib/utils';

type CommentProps = {
    comment: CommentType;
    onResolve: (commentId: string) => void;
};

export const Comment = ({ comment, onResolve }: CommentProps) => {
    return (
        <div
            style={{
                position: 'absolute',
                left: comment.position.x,
                top: comment.position.y,
                zIndex: 100,
            }}
            className="comment-wrapper"
        >
            {/* Comment pin */}
            <div className="w-8 h-8 bg-amber-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-amber-600 transition-colors shadow-lg">
                <MessageCircle className="w-4 h-4 text-white" />
            </div>

            {/* Comment tooltip */}
            <div className="absolute left-10 top-0 bg-white rounded-lg shadow-xl border border-gray-200 p-3 w-64 z-50">
                <div className="flex items-start justify-between mb-2">
                    <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-900">{comment.userName}</p>
                        <p className="text-xs text-gray-500">{formatTimestamp(comment.timestamp)}</p>
                    </div>
                    <button
                        onClick={() => onResolve(comment.id)}
                        className="ml-2 p-1 hover:bg-gray-100 rounded transition-colors"
                        title="Resolve comment"
                    >
                        <Check className="w-4 h-4 text-gray-600" />
                    </button>
                </div>
                <p className="text-sm text-gray-700">{comment.text}</p>
            </div>
        </div>
    );
};
