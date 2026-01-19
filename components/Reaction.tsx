'use client';

import { Reaction as ReactionType } from '@/types';
import { motion } from 'framer-motion';

type ReactionProps = {
    reaction: ReactionType;
};

export const Reaction = ({ reaction }: ReactionProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 0, scale: 1 }}
            animate={{ opacity: 1, y: -50, scale: 1.5 }}
            exit={{ opacity: 0, y: -80, scale: 0.5 }}
            transition={{ duration: 2, ease: 'easeOut' }}
            style={{
                position: 'absolute',
                left: reaction.position.x,
                top: reaction.position.y,
                pointerEvents: 'none',
                zIndex: 999,
                fontSize: '2rem',
            }}
            className="reaction"
        >
            {reaction.emoji}
        </motion.div>
    );
};
