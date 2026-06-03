'use client';

interface ChatMessageProps {
  role: 'user' | 'ai';
  content: string;
  options?: string[];
  onOptionClick?: (option: string) => void;
}

export function ChatMessage({ role, content, options, onOptionClick }: ChatMessageProps) {
  const isAI = role === 'ai';

  return (
    <div className={`${isAI ? '' : 'ml-auto'} max-w-[85%]`}>
      <div
        className={`p-3 rounded-xl ${
          isAI ? 'bg-slate-700/50' : 'bg-teal-600/20'
        }`}
      >
        {isAI && (
          <div className="text-xs text-teal-400 mb-1 font-medium">
            Design Consultant
          </div>
        )}
        {!isAI && (
          <div className="text-xs text-teal-300 mb-1 font-medium">You</div>
        )}
        <div className="text-sm leading-relaxed">{content}</div>

        {options && options.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {options.map((opt) => (
              <button
                key={opt}
                onClick={() => onOptionClick?.(opt)}
                className="text-xs bg-slate-600 hover:bg-slate-500 px-2.5 py-1.5 rounded-full transition text-white"
              >
                {opt}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
