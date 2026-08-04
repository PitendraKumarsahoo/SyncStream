import React, { useState } from 'react';
import { Play, Tv, History, Shield, Users, Bell, User as UserIcon, Sparkles, Activity, Plus } from 'lucide-react';
import { User, SystemNotification } from '../types';

interface NavbarProps {
  currentTab: 'explore' | 'room' | 'history' | 'admin' | 'profile';
  setTab: (tab: 'explore' | 'room' | 'history' | 'admin' | 'profile') => void;
  user: User | null;
  onOpenAuth: () => void;
  onOpenCreateRoom: () => void;
  onOpenProfile: () => void;
  activeRoomId: string | null;
  notifications: SystemNotification[];
  latency: number;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentTab,
  setTab,
  user,
  onOpenAuth,
  onOpenCreateRoom,
  onOpenProfile,
  activeRoomId,
  notifications,
  latency
}) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const unreadCount = notifications.filter(n => !n.read).length;

  return (
    <header className="sticky top-0 z-40 bg-zinc-950/80 backdrop-blur-md border-b border-zinc-800/80 px-4 lg:px-8 py-3 transition-all">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-4">
        
        {/* Brand Logo */}
        <div className="flex items-center gap-6">
          <button 
            onClick={() => setTab('explore')}
            className="flex items-center gap-2.5 group text-left focus:outline-none"
          >
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-violet-600 via-indigo-500 to-cyan-400 p-0.5 shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
              <div className="w-full h-full bg-zinc-950 rounded-[10px] flex items-center justify-center">
                <Play className="w-5 h-5 text-indigo-400 fill-indigo-400/20 group-hover:scale-110 transition-transform" />
              </div>
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-xl tracking-tight bg-gradient-to-r from-white via-zinc-200 to-indigo-200 bg-clip-text text-transparent">
                  SyncStream
                </span>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 rounded">
                  PRO
                </span>
              </div>
              <p className="text-[11px] text-zinc-400 font-medium">Enterprise Watch Party</p>
            </div>
          </button>

          {/* Navigation Links */}
          <nav className="hidden md:flex items-center gap-1 bg-zinc-900/60 p-1 rounded-xl border border-zinc-800/60">
            <button
              onClick={() => setTab('explore')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'explore'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <Tv className="w-3.5 h-3.5" />
              Explore Rooms
            </button>

            {activeRoomId && (
              <button
                onClick={() => setTab('room')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'room'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <div className="relative">
                  <Play className="w-3.5 h-3.5" />
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                </div>
                Live Party
              </button>
            )}

            <button
              onClick={() => setTab('history')}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                currentTab === 'history'
                  ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                  : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
              }`}
            >
              <History className="w-3.5 h-3.5" />
              Watch History
            </button>

            {user?.role === 'admin' && (
              <button
                onClick={() => setTab('admin')}
                className={`flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                  currentTab === 'admin'
                    ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white shadow-md shadow-indigo-600/20'
                    : 'text-zinc-400 hover:text-white hover:bg-zinc-800/50'
                }`}
              >
                <Shield className="w-3.5 h-3.5 text-amber-400" />
                Admin
              </button>
            )}
          </nav>
        </div>

        {/* Right Actions & Profile */}
        <div className="flex items-center gap-3">
          
          {/* Create Room Button */}
          <button
            onClick={onOpenCreateRoom}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 active:scale-95 transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span className="hidden sm:inline">Create Party</span>
          </button>

          {/* Latency Indicator */}
          <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-[11px] font-medium text-zinc-400">
            <Activity className="w-3.5 h-3.5 text-emerald-400 animate-pulse" />
            <span>{latency}ms</span>
          </div>

          {/* Notifications Dropdown Toggle */}
          <div className="relative">
            <button
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-xl bg-zinc-900 border border-zinc-800/80 hover:border-zinc-700 text-zinc-300 hover:text-white relative transition-all"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-indigo-500 text-white text-[10px] font-extrabold rounded-full flex items-center justify-center animate-bounce">
                  {unreadCount}
                </span>
              )}
            </button>

            {/* Notifications Panel */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-zinc-900 border border-zinc-800 rounded-2xl shadow-2xl p-4 z-50">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800 mb-2">
                  <h4 className="text-xs font-bold text-white uppercase tracking-wider">Notifications</h4>
                  <span className="text-[10px] text-zinc-500">{notifications.length} recent</span>
                </div>
                <div className="space-y-2 max-h-64 overflow-y-auto pr-1">
                  {notifications.length === 0 ? (
                    <p className="text-xs text-zinc-500 py-4 text-center">No new notifications</p>
                  ) : (
                    notifications.map(n => (
                      <div key={n.id} className="p-2.5 rounded-xl bg-zinc-950/60 border border-zinc-800/50 text-xs">
                        <div className="font-semibold text-zinc-200">{n.title}</div>
                        <div className="text-zinc-400 text-[11px] mt-0.5">{n.message}</div>
                        <div className="text-[9px] text-zinc-500 mt-1">
                          {new Date(n.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>

          {/* User Profile / Login */}
          {user ? (
            <button
              onClick={onOpenProfile}
              className="flex items-center gap-2.5 p-1.5 pl-2.5 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 transition-all text-left"
            >
              <div className="hidden sm:block">
                <p className="text-xs font-bold text-white leading-none">{user.name}</p>
                <p className="text-[10px] text-emerald-400 font-medium leading-tight capitalize">{user.status}</p>
              </div>
              <img
                src={user.avatar}
                alt={user.name}
                className="w-8 h-8 rounded-lg object-cover ring-2 ring-indigo-500/30"
              />
            </button>
          ) : (
            <button
              onClick={onOpenAuth}
              className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-xs font-bold text-white transition-all"
            >
              <UserIcon className="w-4 h-4 text-indigo-400" />
              <span>Sign In</span>
            </button>
          )}

        </div>
      </div>
    </header>
  );
};
