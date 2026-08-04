import React, { useState } from 'react';
import { X, User as UserIcon, Mail, Shield, Check, Camera, LogOut } from 'lucide-react';
import { User } from '../types';

interface ProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  user: User | null;
  onUpdateUser: (updatedUser: User) => void;
  onLogout: () => void;
}

const AVATAR_PRESETS = [
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1570295999919-56ceb5ecca61?w=150&auto=format&fit=crop&q=80',
  'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'
];

export const ProfileModal: React.FC<ProfileModalProps> = ({
  isOpen,
  onClose,
  user,
  onUpdateUser,
  onLogout
}) => {
  if (!isOpen || !user) return null;

  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [avatar, setAvatar] = useState(user.avatar);
  const [bio, setBio] = useState(user.bio || 'Cinema & Stream lover 🍿');
  const [role, setRole] = useState<'user' | 'admin'>(user.role);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onUpdateUser({
      ...user,
      name,
      email,
      avatar,
      bio,
      role
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-md rounded-3xl p-6 shadow-2xl relative">
        
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        <h2 className="text-xl font-bold text-white mb-1">User Profile & Preferences</h2>
        <p className="text-xs text-zinc-400 mb-6">Customize your display name, avatar, and role.</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          
          {/* Avatar Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">Avatar Choice</label>
            <div className="flex items-center gap-2">
              {AVATAR_PRESETS.map((url) => (
                <img
                  key={url}
                  src={url}
                  alt="Avatar option"
                  onClick={() => setAvatar(url)}
                  className={`w-11 h-11 rounded-2xl object-cover cursor-pointer transition-all ${
                    avatar === url ? 'ring-2 ring-indigo-500 scale-105 shadow-lg' : 'opacity-60 hover:opacity-100'
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Display Name</label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Bio</label>
            <input
              type="text"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white"
            />
          </div>

          {/* Admin Role Toggle */}
          <div className="pt-2 border-t border-zinc-800">
            <label className="block text-xs font-semibold text-zinc-300 mb-1">Role Privileges</label>
            <div className="flex items-center justify-between p-3 rounded-xl bg-zinc-950 border border-zinc-800">
              <span className="text-xs text-zinc-300 flex items-center gap-1.5">
                <Shield className="w-4 h-4 text-amber-400" /> Admin Privileges
              </span>
              <button
                type="button"
                onClick={() => setRole(role === 'admin' ? 'user' : 'admin')}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                  role === 'admin' ? 'bg-amber-500 text-black' : 'bg-zinc-800 text-zinc-400'
                }`}
              >
                {role === 'admin' ? 'ADMIN ENABLED' : 'STANDARD USER'}
              </button>
            </div>
          </div>

          <div className="flex items-center gap-2 pt-3">
            <button
              type="button"
              onClick={onLogout}
              className="px-4 py-2.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-4 h-4" /> Sign Out
            </button>

            <button
              type="submit"
              className="flex-1 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold transition-all cursor-pointer shadow-lg shadow-indigo-600/30"
            >
              Save Profile
            </button>
          </div>

        </form>

      </div>
    </div>
  );
};
