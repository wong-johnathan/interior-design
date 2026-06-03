'use client';

import { useState } from 'react';
import { RoomTabBar } from './RoomTabBar';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { X } from 'lucide-react';

interface ChatPanelProps {
  activeRoom: string;
  onRoomChange: (room: string) => void;
  onClose: () => void;
  isMobile?: boolean;
}

const MOCK_MESSAGES: { role: 'user' | 'ai'; content: string; options?: string[] }[] = [
  {
    role: 'ai',
    content: "Welcome! Let's design your Verandah Kallang flat. What overall vibe are you going for?",
    options: ['🌿 Japandi', '🏭 Industrial', '❄️ Minimalist', '🌊 Coastal'],
  },
  {
    role: 'user',
    content: 'I want Japandi overall, but the kitchen should be vintage green tiles',
  },
  {
    role: 'ai',
    content:
      "Great choices! I've set the main areas to Japandi: light oak flooring, warm white walls. For the kitchen with vintage green tiles — should the cabinets be dark wood or white?",
    options: ['Dark wood', 'White', 'Something else...'],
  },
];

export function ChatPanel({ activeRoom, onRoomChange, onClose, isMobile }: ChatPanelProps) {
  const [messages, setMessages] = useState(MOCK_MESSAGES);
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (text: string) => {
    setMessages((prev) => [...prev, { role: 'user', content: text }]);
    setIsTyping(true);
    setTimeout(() => {
      setIsTyping(false);
      setMessages((prev) => [
        ...prev,
        {
          role: 'ai',
          content:
            "Great choice! I've updated the design. You can see the changes in the 3D viewport.",
          options: ["I'm happy!", 'Continue with next room'],
        },
      ]);
    }, 1500);
  };

  const handleOptionClick = (option: string) => {
    handleSend(option);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Room tabs */}
      <div className="p-3 border-b border-slate-700">
        <RoomTabBar activeRoom={activeRoom} onRoomChange={onRoomChange} />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {messages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            options={msg.options}
            onOptionClick={handleOptionClick}
          />
        ))}
        {isTyping && (
          <div className="bg-slate-700/50 p-3 rounded-xl max-w-[85%]">
            <div className="text-xs text-teal-400 mb-1">Design Consultant</div>
            <div className="flex gap-1">
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0s' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.2s' }} />
              <span className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dot" style={{ animationDelay: '0.4s' }} />
            </div>
          </div>
        )}
        <div className="bg-slate-700/50 p-3 rounded-xl max-w-[85%]">
          <div className="text-xs text-teal-400 mb-1">Design Consultant</div>
          <div className="text-sm text-slate-300 italic">
            You can see the changes being applied to the 3D model in real-time →
          </div>
        </div>
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700">
        <ChatInput onSend={handleSend} disabled={isTyping} />
      </div>
    </div>
  );
}
