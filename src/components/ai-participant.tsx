import React from "react";
import { X } from "lucide-react";

interface AIParticipantProps {
  id: string;
  name: string;
  avatar: string;
  model: string;
  color: string;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

export function AIParticipant({
  id,
  name,
  avatar,
  model,
  color,
  onRemove,
  canRemove,
}: AIParticipantProps) {
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-1 text-sm"
      style={{ backgroundColor: `${color}30` }}
    >
      <span className="mr-1">{avatar}</span>
      <span>{name}</span>
      <span className="text-xs text-gray-400">{model}</span>
      {canRemove && (
        <button
          onClick={() => onRemove(id)}
          className="ml-1 hover:text-red-400"
          aria-label={`Remove ${name}`}
        >
          <X size={12} />
        </button>
      )}
    </div>
  );
}
