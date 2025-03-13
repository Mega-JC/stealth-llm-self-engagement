import React, { type ReactNode } from "react";

export interface ChipProps {
  id: string;
  label: string;
  icon?: ReactNode;
  color?: string;
  onRemove?: (id: string) => void;
  showRemoveButton?: boolean;
}

export function Chip({
  id,
  label,
  icon,
  color = "#0ea5e9",
  onRemove,
  showRemoveButton = false,
}: ChipProps) {
  return (
    <div
      className="flex items-center gap-1 rounded-full px-2 py-1 text-sm"
      style={{ backgroundColor: `${color}30` }}
    >
      {icon && <span className="mr-1">{icon}</span>}
      <span>{label}</span>
      {showRemoveButton && onRemove && (
        <button
          onClick={() => onRemove(id)}
          className="ml-1 hover:text-red-400"
          aria-label={`Remove ${label}`}
        >
          ×
        </button>
      )}
    </div>
  );
}
