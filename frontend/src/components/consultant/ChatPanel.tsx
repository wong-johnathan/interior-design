'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { RoomTabBar } from './RoomTabBar';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import { X } from 'lucide-react';
import { sendChatMessage, extractBrief, type ChatMessage as ChatMessageType, type DesignBrief } from '@/lib/gemini';

interface ChatPanelProps {
  activeRoom: string;
  onRoomChange: (room: string) => void;
  onClose: () => void;
  isMobile?: boolean;
  onBriefChange?: (briefs: Record<string, DesignBrief>) => void;
}

const ROOM_NAMES: Record<string, string> = {
  living: 'Living Room',
  mbr: 'Master Bedroom',
  kitchen: 'Kitchen',
  bed2: 'Bedroom 2',
  bath1: 'Bathroom 1',
  bath2: 'Bathroom 2',
};

const WELCOME_MESSAGES: Record<string, ChatMessageType> = {
  living: {
    role: 'ai',
    content:
      "Welcome! Let's design your **Living Room**. This is the heart of your HDB home. What overall style or vibe are you thinking of? Japandi, Minimalist, Industrial, or something else?",
  },
  mbr: {
    role: 'ai',
    content:
      "Now let's design your **Master Bedroom**. What kind of atmosphere do you want — calm and serene, warm and cozy, or modern and sleek? Any preferred color palette?",
  },
  kitchen: {
    role: 'ai',
    content:
      "Let's work on your **Kitchen**. What style are you leaning toward? Do you prefer open shelving, closed cabinets, or a mix? Any thoughts on countertop materials or backsplash tiles?",
  },
  bed2: {
    role: 'ai',
    content:
      "Now for **Bedroom 2**. Is this a guest room, kids' room, or home office? What style would you like here?",
  },
  bath1: {
    role: 'ai',
    content:
      "Let's design **Bathroom 1** (common bathroom). What tile style and color scheme do you prefer? Thinking about a rain shower or bathtub?",
  },
  bath2: {
    role: 'ai',
    content:
      "Now for **Bathroom 2** (master ensuite or second bathroom). What look are you going for? Any specific fixtures or materials in mind?",
  },
};

export function ChatPanel({ activeRoom, onRoomChange, onClose, isMobile, onBriefChange }: ChatPanelProps) {
  // Per-room chat histories
  const [roomHistories, setRoomHistories] = useState<Record<string, ChatMessageType[]>>(() => {
    const initial: Record<string, ChatMessageType[]> = {};
    for (const room of Object.keys(WELCOME_MESSAGES)) {
      initial[room] = [{ ...WELCOME_MESSAGES[room] }];
    }
    return initial;
  });

  const [isStreaming, setIsStreaming] = useState(false);
  const [streamingContent, setStreamingContent] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const currentMessages = roomHistories[activeRoom] || [];

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [currentMessages, streamingContent, isStreaming]);

  // Update brief whenever messages change
  useEffect(() => {
    if (!onBriefChange) return;
    const briefs: Record<string, DesignBrief> = {};
    for (const [roomId, msgs] of Object.entries(roomHistories)) {
      if (msgs.length > 1) {
        briefs[roomId] = extractBrief(msgs, roomId);
      }
    }
    onBriefChange(briefs);
  }, [roomHistories, onBriefChange]);

  const handleSend = useCallback(
    async (text: string) => {
      if (!text.trim() || isStreaming) return;

      const userMessage: ChatMessageType = { role: 'user', content: text };
      const updatedMessages = [...currentMessages, userMessage];

      // Update history immediately with user message
      setRoomHistories((prev) => ({
        ...prev,
        [activeRoom]: updatedMessages,
      }));

      setIsStreaming(true);
      setStreamingContent('');

      try {
        // Send all messages including system-level prompts that are in the AI history
        // Filter out what the API needs: user + ai messages (excluding the system prompt mix-in)
        const apiMessages = updatedMessages.map((m) => ({
          role: m.role,
          content: m.content,
        }));

        await sendChatMessage(apiMessages, activeRoom, (chunk) => {
          setStreamingContent((prev) => prev + chunk);
        });

        // Once streaming is done, add the full AI response to history
        setStreamingContent((prev) => {
          const fullResponse = prev;
          setRoomHistories((hist) => ({
            ...hist,
            [activeRoom]: [
              ...hist[activeRoom],
              { role: 'ai', content: fullResponse },
            ],
          }));
          return '';
        });
      } catch (err) {
        const errorMessage =
          err instanceof Error ? err.message : 'An error occurred';
        setStreamingContent('');
        setRoomHistories((prev) => ({
          ...prev,
          [activeRoom]: [
            ...prev[activeRoom],
            {
              role: 'ai',
              content: `**Error:** ${errorMessage}. Please try again.`,
            },
          ],
        }));
      } finally {
        setIsStreaming(false);
      }
    },
    [activeRoom, currentMessages, isStreaming]
  );

  const handleOptionClick = useCallback(
    (option: string) => {
      handleSend(option);
    },
    [handleSend]
  );

  const handleRoomChange = useCallback(
    (room: string) => {
      onRoomChange(room);
    },
    [onRoomChange]
  );

  const roomName = ROOM_NAMES[activeRoom] || activeRoom;

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between p-3 border-b border-slate-700">
        <h2 className="text-sm font-semibold text-slate-200">
          AI Design Consultant
        </h2>
        <button
          onClick={onClose}
          className="p-1 rounded-lg hover:bg-slate-700 text-slate-400 hover:text-slate-200 transition"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Room tabs */}
      <div className="p-3 border-b border-slate-700">
        <RoomTabBar activeRoom={activeRoom} onRoomChange={handleRoomChange} />
        <div className="text-[10px] text-slate-500 mt-1.5">
          Currently designing: <span className="text-teal-400">{roomName}</span>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {currentMessages.map((msg, i) => (
          <ChatMessage
            key={i}
            role={msg.role}
            content={msg.content}
            onOptionClick={handleOptionClick}
          />
        ))}

        {/* Streaming indicator */}
        {isStreaming && (
          <div className="max-w-[85%]">
            <div className="bg-slate-700/50 p-3 rounded-xl">
              <div className="text-xs text-teal-400 mb-1 font-medium">
                Design Consultant
              </div>
              <div className="text-sm leading-relaxed text-slate-200 whitespace-pre-wrap">
                {streamingContent || (
                  <div className="flex gap-1">
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dot"
                      style={{ animationDelay: '0s' }}
                    />
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dot"
                      style={{ animationDelay: '0.2s' }}
                    />
                    <span
                      className="w-2 h-2 bg-slate-400 rounded-full animate-pulse-dot"
                      style={{ animationDelay: '0.4s' }}
                    />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-3 border-t border-slate-700">
        <ChatInput
          onSend={handleSend}
          disabled={isStreaming}
          placeholder={
            isStreaming
              ? 'Waiting for response...'
              : `Describe your ${roomName} style...`
          }
        />
      </div>
    </div>
  );
}
