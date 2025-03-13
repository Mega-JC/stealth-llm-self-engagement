import { type ReactNode } from "react";

export interface ChatMessageProps {
  id: string;
  content: string;
  role: "human" | "ai";
  timestamp: Date;
  sender?: {
    name?: string;
    icon?: ReactNode;
    color?: string;
  };
}

export function ChatMessage({
  content,
  role,
  timestamp,
  sender,
}: ChatMessageProps) {
  return (
    <div
      className={`flex ${role === "human" ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[70%] rounded-lg p-3 ${
          role === "human"
            ? "bg-blue-600"
            : sender?.color
              ? `bg-opacity-20`
              : "bg-gray-700"
        }`}
        style={sender?.color ? { backgroundColor: `${sender.color}30` } : {}}
      >
        {sender?.name && (
          <div
            className="mb-1 flex items-center gap-2 font-medium"
            style={{ color: sender.color }}
          >
            {sender.icon && sender.icon}
            <span>{sender.name}</span>
          </div>
        )}
        <p className="whitespace-pre-wrap">{content}</p>
        <div className="mt-1 text-xs text-gray-400">
          {timestamp.toLocaleTimeString()}
        </div>
      </div>
    </div>
  );
}
