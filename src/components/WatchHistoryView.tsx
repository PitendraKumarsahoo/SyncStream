import React from 'react';
import { History, Play, Calendar, Clock, Film } from 'lucide-react';
import { WatchHistoryItem } from '../types';

interface WatchHistoryViewProps {
  history: WatchHistoryItem[];
  onRejoin: (roomId: string) => void;
}

export const WatchHistoryView: React.FC<WatchHistoryViewProps> = ({ history, onRejoin }) => {
  return (
    <div className="space-y-6 pb-12">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-2xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
          <History className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-xl font-bold text-white tracking-tight">Watch History</h2>
          <p className="text-xs text-zinc-400">Past watch party sessions you participated in.</p>
        </div>
      </div>

      {history.length === 0 ? (
        <div className="bg-zinc-900/40 border border-dashed border-zinc-800 rounded-3xl p-12 text-center">
          <Film className="w-12 h-12 text-zinc-600 mx-auto mb-3" />
          <h3 className="text-base font-bold text-white">No Watch History Yet</h3>
          <p className="text-xs text-zinc-400 max-w-sm mx-auto mt-1">
            Join watch party rooms to automatically record your view logs and statistics.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {history.map((item) => (
            <div
              key={item.id}
              className="bg-zinc-900 border border-zinc-800 hover:border-zinc-700 p-4 rounded-2xl flex items-center justify-between gap-4 transition-all"
            >
              <div className="min-w-0">
                <h4 className="font-bold text-sm text-white truncate">{item.mediaTitle}</h4>
                <p className="text-xs text-indigo-300 font-medium truncate mt-0.5">{item.roomName}</p>
                <div className="flex items-center gap-3 text-[11px] text-zinc-500 mt-2">
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" /> {new Date(item.watchedAt).toLocaleDateString()}
                  </span>
                  <span className="flex items-center gap-1">
                    <Clock className="w-3 h-3" /> {Math.floor(item.durationSeconds / 60)} min watched
                  </span>
                </div>
              </div>

              <button
                onClick={() => onRejoin(item.roomId)}
                className="px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 cursor-pointer shadow-md"
              >
                <Play className="w-3.5 h-3.5 fill-white" />
                Rejoin
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
