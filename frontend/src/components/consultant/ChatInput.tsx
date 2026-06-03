'use client';

import { useState } from 'react';
import { Send } from 'lucide-react';

interface ChatInputProps {
  onSend: (text: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSend, disabled = false, placeholder = 'Type a message...' }: ChatInputProps) {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (text.trim() && !disabled) {
      onSend(text.trim());
      setText('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="flex gap-2">
      <input
        type="text"
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        disabled={disabled}
        className="flex-1 bg-slate-700 rounded-lg px-3 py-2 text-sm text-white placeholder-slate-400 border border-slate-600 focus:outline-none focus:border-teal-500 disabled:opacity-50"
      />
      <button
        type="submit"
        disabled={!text.trim() || disabled}
        className="bg-teal-600 hover:bg-teal-500 disabled:bg-slate-700 disabled:text-slate-500 px-3 py-2 rounded-lg text-sm transition flex items-center gap-1"
      >
        <Send className="w-3.5 h-3.5" />
        Send
      </button>
    </form>
  );
}
