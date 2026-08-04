import React, { useState } from 'react';
import { X, Film, Lock, Globe, Upload, Sparkles, Check, Link as LinkIcon, Users, Play } from 'lucide-react';
import { Room, MediaItem, User } from '../types';
import { PRESET_MEDIA, CATEGORIES } from '../data/presetMedia';

interface CreateRoomModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreateRoom: (roomData: Partial<Room>) => void;
  user: User | null;
}

export const CreateRoomModal: React.FC<CreateRoomModalProps> = ({
  isOpen,
  onClose,
  onCreateRoom,
  user
}) => {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Room['category']>('Movies');
  const [isPublic, setIsPublic] = useState(true);
  const [password, setPassword] = useState('');
  const [passwordHint, setPasswordHint] = useState('');
  const [maxParticipants, setMaxParticipants] = useState(25);
  const [mediaSourceType, setMediaSourceType] = useState<'preset' | 'custom' | 'upload'>('preset');
  const [selectedPreset, setSelectedPreset] = useState<MediaItem>(PRESET_MEDIA[0]);
  const [customUrl, setCustomUrl] = useState('');
  const [customTitle, setCustomTitle] = useState('');
  const [uploadedFileName, setUploadedFileName] = useState('');
  const [uploadedObjectUrl, setUploadedObjectUrl] = useState('');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      setUploadedFileName(file.name);
      setUploadedObjectUrl(url);
      if (!name) setName(`Watch Party: ${file.name.replace(/\.[^/.]+$/, "")}`);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    let media: MediaItem = selectedPreset;

    if (mediaSourceType === 'custom' && customUrl) {
      media = {
        type: customUrl.includes('youtube.com') || customUrl.includes('youtu.be') ? 'youtube' : 'mp4',
        url: customUrl,
        title: customTitle || 'Shared Video Stream',
        duration: 300,
        posterUrl: 'https://images.unsplash.com/photo-1517604931442-7e0c8ed2963c?w=800&auto=format&fit=crop&q=80'
      };
    } else if (mediaSourceType === 'upload' && uploadedObjectUrl) {
      media = {
        type: 'mp4',
        url: uploadedObjectUrl,
        title: uploadedFileName || 'Local Stream File',
        duration: 600,
        posterUrl: 'https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=800&auto=format&fit=crop&q=80'
      };
    }

    onCreateRoom({
      name: name || `🍿 ${user?.name || 'Host'}'s Cinema Party`,
      description: description || 'Join us for a synchronized watch party session!',
      category,
      isPublic,
      password: isPublic ? '' : password,
      passwordHint: isPublic ? '' : passwordHint,
      maxParticipants,
      media
    });

    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="bg-zinc-900 border border-zinc-800 w-full max-w-2xl rounded-3xl p-6 md:p-8 shadow-2xl relative max-h-[90vh] overflow-y-auto">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-xl bg-zinc-800/60 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Title */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-indigo-500 to-violet-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20">
            <Film className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-white tracking-tight">Create New Watch Party Room</h2>
            <p className="text-xs text-zinc-400">Set up your synchronized playback stream & invite participants.</p>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          
          {/* Room Name & Category */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Party Room Title</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. 🍿 Friday Sci-Fi Night"
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as any)}
                className="w-full px-4 py-2.5 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white focus:outline-none focus:border-indigo-500 transition-colors"
              >
                {CATEGORIES.filter(c => c !== 'All').map(c => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-1.5">Description (Optional)</label>
            <textarea
              rows={2}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="What are we watching today?"
              className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500 transition-colors resize-none"
            />
          </div>

          {/* Media Source Selector */}
          <div>
            <label className="block text-xs font-semibold text-zinc-300 mb-2">Select Stream Video Source</label>
            <div className="grid grid-cols-3 gap-2 mb-3">
              <button
                type="button"
                onClick={() => setMediaSourceType('preset')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mediaSourceType === 'preset'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                Featured Movies
              </button>

              <button
                type="button"
                onClick={() => setMediaSourceType('custom')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mediaSourceType === 'custom'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <LinkIcon className="w-3.5 h-3.5" />
                Custom URL
              </button>

              <button
                type="button"
                onClick={() => setMediaSourceType('upload')}
                className={`py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                  mediaSourceType === 'upload'
                    ? 'bg-indigo-600/20 border-indigo-500 text-indigo-300'
                    : 'bg-zinc-950 border-zinc-800 text-zinc-400 hover:text-white'
                }`}
              >
                <Upload className="w-3.5 h-3.5" />
                Upload File
              </button>
            </div>

            {/* Source Type Content */}
            {mediaSourceType === 'preset' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 max-h-48 overflow-y-auto pr-1">
                {PRESET_MEDIA.map(preset => (
                  <div
                    key={preset.url}
                    onClick={() => setSelectedPreset(preset)}
                    className={`p-2.5 rounded-xl border flex items-center gap-3 cursor-pointer transition-all ${
                      selectedPreset.url === preset.url
                        ? 'bg-indigo-600/20 border-indigo-500 ring-1 ring-indigo-500'
                        : 'bg-zinc-950 border-zinc-800/80 hover:border-zinc-700'
                    }`}
                  >
                    <img
                      src={preset.posterUrl}
                      alt={preset.title}
                      className="w-12 h-12 rounded-lg object-cover"
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold text-white truncate">{preset.title}</p>
                      <p className="text-[10px] text-zinc-400 truncate">{preset.description}</p>
                    </div>
                    {selectedPreset.url === preset.url && (
                      <Check className="w-4 h-4 text-indigo-400 shrink-0" />
                    )}
                  </div>
                ))}
              </div>
            )}

            {mediaSourceType === 'custom' && (
              <div className="space-y-3 bg-zinc-950 p-3.5 rounded-2xl border border-zinc-800">
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Direct Stream URL (MP4, HLS, YouTube)</label>
                  <input
                    type="url"
                    value={customUrl}
                    onChange={(e) => setCustomUrl(e.target.value)}
                    placeholder="https://commondatastorage.googleapis.com/.../video.mp4"
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <div>
                  <label className="block text-[11px] text-zinc-400 mb-1">Stream Title</label>
                  <input
                    type="text"
                    value={customTitle}
                    onChange={(e) => setCustomTitle(e.target.value)}
                    placeholder="Custom Stream Video"
                    className="w-full px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-indigo-500"
                  />
                </div>
              </div>
            )}

            {mediaSourceType === 'upload' && (
              <div className="border-2 border-dashed border-zinc-800 hover:border-indigo-500/50 bg-zinc-950 rounded-2xl p-6 text-center transition-colors">
                <Upload className="w-8 h-8 text-indigo-400 mx-auto mb-2" />
                <p className="text-xs font-semibold text-white">Upload or Drag & Drop local video</p>
                <p className="text-[10px] text-zinc-500 mt-0.5">Supports MP4, WebM, MOV files</p>
                <input
                  type="file"
                  accept="video/*"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="file-upload-input"
                />
                <label
                  htmlFor="file-upload-input"
                  className="mt-3 inline-block px-4 py-1.5 rounded-xl bg-zinc-800 hover:bg-zinc-700 text-xs text-white font-medium cursor-pointer transition-colors"
                >
                  Choose File
                </label>
                {uploadedFileName && (
                  <p className="text-xs text-emerald-400 font-semibold mt-3 flex items-center justify-center gap-1">
                    <Check className="w-3.5 h-3.5" /> Selected: {uploadedFileName}
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Privacy & Password */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-zinc-800">
            <div>
              <label className="block text-xs font-semibold text-zinc-300 mb-2">Access Control</label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsPublic(true)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    isPublic
                      ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Globe className="w-3.5 h-3.5" /> Public
                </button>

                <button
                  type="button"
                  onClick={() => setIsPublic(false)}
                  className={`flex-1 py-2 px-3 rounded-xl text-xs font-semibold border flex items-center justify-center gap-1.5 transition-all ${
                    !isPublic
                      ? 'bg-amber-500/10 border-amber-500/40 text-amber-400'
                      : 'bg-zinc-950 border-zinc-800 text-zinc-400'
                  }`}
                >
                  <Lock className="w-3.5 h-3.5" /> Password
                </button>
              </div>
            </div>

            {!isPublic && (
              <div className="space-y-2">
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Room Password</label>
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Set password"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-zinc-300 mb-1">Password Hint (Optional)</label>
                  <input
                    type="text"
                    value={passwordHint}
                    onChange={(e) => setPasswordHint(e.target.value)}
                    placeholder="e.g. Favorite movie, or year"
                    className="w-full px-4 py-2 bg-zinc-950 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-600 focus:outline-none focus:border-amber-500"
                  />
                </div>
              </div>
            )}
          </div>

          {/* Max Participants */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-semibold text-zinc-300 flex items-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-indigo-400" /> Max Capacity
              </label>
              <span className="text-xs font-bold text-indigo-400">{maxParticipants} Participants</span>
            </div>
            <input
              type="range"
              min={2}
              max={100}
              value={maxParticipants}
              onChange={(e) => setMaxParticipants(parseInt(e.target.value))}
              className="w-full accent-indigo-500 bg-zinc-950 rounded-lg cursor-pointer"
            />
          </div>

          {/* Create Button */}
          <button
            type="submit"
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 hover:from-indigo-600 hover:to-violet-700 text-white text-xs font-bold shadow-xl shadow-indigo-500/30 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Play className="w-4 h-4 fill-white" />
            Launch Watch Party
          </button>
        </form>

      </div>
    </div>
  );
};
