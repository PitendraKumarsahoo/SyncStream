import React, { useState, useEffect } from 'react';
import { X, Lock, Eye, EyeOff, KeyRound, AlertCircle, Play, Sparkles, HelpCircle } from 'lucide-react';
import { Room } from '../types';

interface JoinPasswordModalProps {
  isOpen: boolean;
  onClose: () => void;
  room: Room | null;
  onJoin: (roomId: string, password: string) => void;
  error?: string | null;
  isSubmitting?: boolean;
  onClearError?: () => void;
}

export const JoinPasswordModal: React.FC<JoinPasswordModalProps> = ({
  isOpen,
  onClose,
  room,
  onJoin,
  error,
  isSubmitting = false,
  onClearError
}) => {
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setPassword('');
      setShowPassword(false);
    }
  }, [isOpen]);

  if (!isOpen || !room) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!password.trim()) return;
    onJoin(room.id, password.trim());
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 mb-5">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
            <Lock className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-white tracking-tight">Protected Watch Party</h3>
            <p className="text-xs text-zinc-400">Enter password to join this private room</p>
          </div>
        </div>

        {/* Room Preview Card */}
        <div className="p-3.5 rounded-2xl bg-zinc-950 border border-zinc-800/80 mb-5 flex items-center gap-3">
          <img
            src={room.media.posterUrl || "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80"}
            alt={room.name}
            className="w-16 h-12 rounded-xl object-cover shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h4 className="text-xs font-bold text-white truncate">{room.name}</h4>
            <p className="text-[11px] text-indigo-300 truncate flex items-center gap-1 mt-0.5">
              <Sparkles className="w-3 h-3 shrink-0" /> {room.media.title}
            </p>
            <p className="text-[10px] text-zinc-500 mt-1">
              Host: <strong className="text-zinc-400">{room.hostName}</strong>
            </p>
          </div>
        </div>

        {/* Error message banner */}
        {error && (
          <div className="p-3 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs mb-4 flex items-start gap-2.5">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400 mt-0.5" />
            <div className="flex-1">
              {error === 'invalid_password' || error.includes('password') ? (
                <>
                  <strong className="font-semibold text-rose-200 block">Invalid Password</strong>
                  <span>The password you entered is incorrect. Please double-check with the host and try again.</span>
                  {room.passwordHint && (
                    <div className="mt-2.5 pt-2 border-t border-rose-500/20 text-amber-300 flex items-center gap-1.5 font-medium">
                      <HelpCircle className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                      <span>Password Hint: <span className="italic text-amber-200 font-normal">{room.passwordHint}</span></span>
                    </div>
                  )}
                </>
              ) : error === 'room_not_found' ? (
                <>
                  <strong className="font-semibold text-rose-200 block">Room Not Found</strong>
                  <span>This watch party is no longer available or was ended by the host.</span>
                </>
              ) : error === 'room_full' ? (
                <>
                  <strong className="font-semibold text-rose-200 block">Room Full</strong>
                  <span>This watch party has reached its maximum participant capacity.</span>
                </>
              ) : (
                <>
                  <strong className="font-semibold text-rose-200 block">Connection Error</strong>
                  <span>{error}</span>
                </>
              )}
            </div>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5 flex items-center gap-1.5">
              <KeyRound className="w-3.5 h-3.5 text-amber-400" />
              Room Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                required
                autoFocus
                value={password}
                onChange={(e) => {
                  setPassword(e.target.value);
                  if (onClearError) onClearError();
                }}
                placeholder="Enter room password..."
                className="w-full pl-4 pr-10 py-2.5 bg-zinc-950 border border-zinc-800 focus:border-amber-500 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-2.5 text-zinc-400 hover:text-white transition-colors cursor-pointer"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 text-xs font-bold cursor-pointer transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !password.trim()}
              className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 disabled:opacity-50 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/20 cursor-pointer flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Verifying...' : 'Join Party'}</span>
              <Play className="w-3.5 h-3.5 fill-current" />
            </button>
          </div>
        </form>

      </div>
    </div>
  );
};
