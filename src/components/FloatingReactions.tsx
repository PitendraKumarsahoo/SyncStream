import React, { useEffect, useState } from 'react';
import { FloatingReaction } from '../types';

interface FloatingReactionsProps {
  reactions: FloatingReaction[];
}

export const FloatingReactions: React.FC<FloatingReactionsProps> = ({ reactions }) => {
  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden z-30">
      {reactions.map((react) => (
        <div
          key={react.id}
          className="absolute bottom-12 flex flex-col items-center animate-float-up opacity-0"
          style={{
            left: `${react.xPercent || Math.floor(20 + Math.random() * 60)}%`,
            animation: 'floatUp 3s ease-out forwards'
          }}
        >
          <span className="text-3xl filter drop-shadow-lg">{react.emoji}</span>
          <span className="text-[10px] font-extrabold text-white bg-black/60 px-2 py-0.5 rounded-full border border-white/20 mt-1 shadow-md">
            {react.senderName}
          </span>
        </div>
      ))}

      <style>{`
        @keyframes floatUp {
          0% {
            transform: translateY(0) scale(0.6);
            opacity: 0;
          }
          15% {
            opacity: 1;
            transform: translateY(-20px) scale(1.2);
          }
          80% {
            opacity: 0.9;
          }
          100% {
            transform: translateY(-220px) scale(0.8);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
};
