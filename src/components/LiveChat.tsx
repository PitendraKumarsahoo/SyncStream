import React, { useState, useRef, useEffect } from 'react';
import { Send, Smile, Sparkles, MessageSquare, Image, ShieldAlert } from 'lucide-react';
import { ChatMessage, User } from '../types';

interface LiveChatProps {
  messages: ChatMessage[];
  onSendMessage: (text: string, type?: 'message' | 'reaction' | 'gif', reactionEmoji?: string) => void;
  currentUser: User | null;
}

export const LiveChat: React.FC<LiveChatProps> = ({
  messages,
  onSendMessage,
  currentUser
}) => {
  const [text, setText] = useState('');
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const EMOJI_PRESETS = ['👍', '❤️', '🔥', '😂', '🎉', '🍿', '🚀', '💯', '😮', '👏'];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!text.trim()) return;
    onSendMessage(text.trim());
    setText('');
    setShowEmojiPicker(false);
  };

  const handleEmojiClick = (emoji: string) => {
    onSendMessage(emoji, 'reaction', emoji);
    setShowEmojiPicker(false);
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900/90 rounded-3xl border border-zinc-800/80 overflow-hidden shadow-xl">
      
      {/* Header */}
      <div className="px-4 py-3 bg-zinc-950/80 border-b border-zinc-800 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <MessageSquare className="w-4 h-4 text-indigo-400" />
          <h3 className="text-xs font-bold text-white uppercase tracking-wider">Live Chat</h3>
        </div>
        <span className="text-[10px] font-semibold text-zinc-400 bg-zinc-900 px-2 py-0.5 rounded-full border border-zinc-800">
          {messages.length} messages
        </span>
      </div>

      {/* Messages List */}
      <div className="flex-1 p-4 overflow-y-auto space-y-3.5 max-h-[420px] lg:max-h-none">
        {messages.map((msg) => {
          if (msg.type === 'system') {
            return (
              <div key={msg.id} className="my-2 text-center">
                <span className="inline-block px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-[10px] font-semibold">
                  {msg.text}
                </span>
              </div>
            );
          }

          const isMe = currentUser?.id === msg.senderId;

          return (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${isMe ? 'flex-row-reverse' : ''}`}
            >
              <img
                src={msg.senderAvatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150&auto=format&fit=crop&q=80'}
                alt={msg.senderName}
                className="w-7 h-7 rounded-full object-cover shrink-0 ring-1 ring-zinc-700 mt-0.5"
              />

              <div className={`max-w-[80%] ${isMe ? 'items-end' : 'items-start'}`}>
                <div className={`flex items-center gap-2 text-[10px] text-zinc-400 mb-0.5 ${isMe ? 'flex-row-reverse' : ''}`}>
                  <span className="font-bold text-zinc-300">{msg.senderName}</span>
                  <span>{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>

                <div
                  className={`p-3 rounded-2xl text-xs leading-relaxed break-words shadow-sm ${
                    isMe
                      ? 'bg-gradient-to-r from-indigo-600 to-violet-600 text-white rounded-tr-none'
                      : 'bg-zinc-950 border border-zinc-800 text-zinc-200 rounded-tl-none'
                  }`}
                >
                  {msg.text}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Emoji Picker Popup */}
      {showEmojiPicker && (
        <div className="p-2 bg-zinc-950 border-t border-zinc-800 grid grid-cols-5 gap-1.5 animate-fadeIn">
          {EMOJI_PRESETS.map((emoji) => (
            <button
              key={emoji}
              onClick={() => handleEmojiClick(emoji)}
              className="p-2 text-xl hover:bg-zinc-800 rounded-xl transition-all active:scale-125 cursor-pointer text-center"
            >
              {emoji}
            </button>
          ))}
        </div>
      )}

      {/* Input Box */}
      <form onSubmit={handleSubmit} className="p-3 bg-zinc-950 border-t border-zinc-800/80 flex items-center gap-2">
        <button
          type="button"
          onClick={() => setShowEmojiPicker(!showEmojiPicker)}
          className="p-2 rounded-xl bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer"
        >
          <Smile className="w-4 h-4" />
        </button>

        <input
          type="text"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={currentUser ? "Send a live message..." : "Sign in to chat..."}
          disabled={!currentUser}
          className="flex-1 px-3.5 py-2 bg-zinc-900 border border-zinc-800 rounded-xl text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-indigo-500 transition-colors"
        />

        <button
          type="submit"
          disabled={!text.trim() || !currentUser}
          className="p-2 rounded-xl bg-indigo-600 hover:bg-indigo-500 disabled:bg-zinc-800 text-white disabled:text-zinc-600 transition-all cursor-pointer disabled:cursor-not-allowed shadow-md shadow-indigo-600/20"
        >
          <Send className="w-4 h-4" />
        </button>
      </form>

    </div>
  );
};
