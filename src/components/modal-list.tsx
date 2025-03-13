import React, { type ReactNode } from "react";

export interface ListItem {
  id: string;
  label: string;
  description?: string;
  icon?: ReactNode;
  iconColor?: string;
  onClick?: (id: string) => void;
}

export interface ModalButton {
  id: string;
  label: string;
  onClick?: () => void;
  variant?: "primary" | "secondary";
}

export interface ModalListProps {
  title: string;
  isOpen: boolean;
  onClose: () => void;
  items: ListItem[];
  buttons?: ModalButton[];
}

export function ModalList({
  title,
  isOpen,
  onClose,
  items,
  buttons = [{ id: "close", label: "Cancel", variant: "secondary" }],
}: ModalListProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
      <div className="w-full max-w-md rounded-lg bg-gray-800 p-4">
        <h2 className="mb-4 text-xl font-bold">{title}</h2>
        <div className="max-h-60 space-y-2 overflow-y-auto">
          {items.map((item) => (
            <button
              key={item.id}
              onClick={() => item.onClick?.(item.id)}
              className="flex w-full items-center gap-2 rounded-lg p-3 text-left hover:bg-gray-700"
            >
              {item.icon && (
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-full"
                  style={{
                    backgroundColor: `${item.iconColor ?? "#0ea5e9"}30`,
                  }}
                >
                  {item.icon}
                </div>
              )}
              <div>
                <div className="font-medium">{item.label}</div>
                {item.description && (
                  <div className="text-sm text-gray-400">
                    {item.description}
                  </div>
                )}
              </div>
            </button>
          ))}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          {buttons.map((button) => (
            <button
              key={button.id}
              onClick={button.onClick ?? onClose}
              className={`rounded-lg px-4 py-2 ${
                button.variant === "primary"
                  ? "bg-blue-600 hover:bg-blue-700"
                  : "bg-gray-700 hover:bg-gray-600"
              }`}
            >
              {button.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
