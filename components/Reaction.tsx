'use client';

import { Reaction as ReactionType } from '@/types';
import { motion } from 'framer-motion';

type ReactionProps = {
    reaction: ReactionType;
};

export const Reaction = ({ reaction }: ReactionProps) => {
    return (
        <motion.div
            initial={{ opacity: 0, y: 0, scale: 0.5 }}
            animate={{
                opacity: [0, 1, 1, 0.5, 0],
                y: [0, -40, -60, -80, -100],
                scale: [0.5, 1.5, 1.5, 1.2, 0.8]
            }}
            transition={{
                duration: 6,
                times: [0, 0.1, 0.8, 0.9, 1],
                ease: "easeOut"
            }}
            style={{
                position: 'absolute',
                left: reaction.position.x,
                top: reaction.position.y,
                pointerEvents: 'none',
                zIndex: 999,
                fontSize: '2.5rem',
            }}
            className="reaction"
        >
            {reaction.emoji}
        </motion.div>
    );
};
