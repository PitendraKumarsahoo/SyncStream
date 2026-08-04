import React, { useState, useEffect } from 'react';
import { Shield, Server, Users, Activity, Trash2, Power, HardDrive, RefreshCw } from 'lucide-react';
import { Room } from '../types';

interface AdminPanelProps {
  rooms: Room[];
  onCloseRoom: (roomId: string) => void;
}

export const AdminPanel: React.FC<AdminPanelProps> = ({ rooms, onCloseRoom }) => {
  const [stats, setStats] = useState({
    totalRooms: rooms.length,
    activeRooms: rooms.length,
    connectedUsers: 0,
    uptimeSeconds: 3600,
    memoryUsageMB: 48
  });

  const fetchStats = () => {
    fetch('/api/admin/stats')
      .then(res => res.json())
      .then(data => setStats(data))
      .catch(() => {});
  };

  useEffect(() => {
    fetchStats();
    const interval = setInterval(fetchStats, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6 pb-12">
      
      {/* Header */}
      <div className="flex items-center justify-between bg-zinc-900 p-6 rounded-3xl border border-zinc-800">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-400">
            <Shield className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Enterprise Admin Control</h2>
            <p className="text-xs text-zinc-400">Manage real-time rooms, socket bandwidth, and user sessions.</p>
          </div>
        </div>

        <button
          onClick={fetchStats}
          className="p-2.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-zinc-300 hover:text-white transition-all cursor-pointer"
        >
          <RefreshCw className="w-4 h-4" />
        </button>
      </div>

      {/* Metrics Row */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
            <Server className="w-4 h-4 text-indigo-400" /> Server Uptime
          </div>
          <p className="text-xl font-black text-white mt-2">{Math.floor(stats.uptimeSeconds / 60)} mins</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
            <Users className="w-4 h-4 text-violet-400" /> Connected Clients
          </div>
          <p className="text-xl font-black text-white mt-2">{stats.connectedUsers}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
            <Activity className="w-4 h-4 text-emerald-400" /> Active Watch Rooms
          </div>
          <p className="text-xl font-black text-white mt-2">{rooms.length}</p>
        </div>

        <div className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl">
          <div className="flex items-center gap-2 text-zinc-400 text-xs font-semibold">
            <HardDrive className="w-4 h-4 text-amber-400" /> RAM Usage
          </div>
          <p className="text-xl font-black text-white mt-2">{stats.memoryUsageMB} MB</p>
        </div>
      </div>

      {/* Rooms Management Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Active Room Audit</h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-zinc-300">
            <thead className="text-[11px] font-bold text-zinc-500 uppercase bg-zinc-950/80 border-b border-zinc-800">
              <tr>
                <th className="p-3">Room Title</th>
                <th className="p-3">Host</th>
                <th className="p-3">Category</th>
                <th className="p-3">Watchers</th>
                <th className="p-3">Privacy</th>
                <th className="p-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-800/60">
              {rooms.map(room => (
                <tr key={room.id} className="hover:bg-zinc-950/40 transition-colors">
                  <td className="p-3 font-bold text-white">{room.name}</td>
                  <td className="p-3">{room.hostName}</td>
                  <td className="p-3"><span className="text-indigo-400 font-semibold">{room.category}</span></td>
                  <td className="p-3">{room.participants.length}</td>
                  <td className="p-3">{room.passwordRequired ? '🔒 Private' : '🌐 Public'}</td>
                  <td className="p-3 text-right">
                    <button
                      onClick={() => onCloseRoom(room.id)}
                      className="px-3 py-1.5 rounded-lg bg-rose-500/20 hover:bg-rose-500/30 text-rose-400 text-xs font-bold transition-all cursor-pointer inline-flex items-center gap-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Terminate
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};
