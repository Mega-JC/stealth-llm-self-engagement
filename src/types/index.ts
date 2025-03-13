import { type ReactNode } from "react";

// AI Participant type
export type AIParticipant = {
  id: string;
  name: string;
  avatar: string;
  model: string;
  color: string;
  basePrompt: string;
};

// Message types
export type Message =
  | {
      id: string;
      content: string;
      role: "human";
      timestamp: Date;
    }
  | {
      id: string;
      content: string;
      role: "ai";
      timestamp: Date;
      aiId: string;
    };

// Conversation type
export type Conversation = {
  id: string;
  title: string;
  messages: Message[];
  participants: AIParticipant[];
};

// Self-engagement types
export interface SelfEngagementOptions {
  maxMessages: number;
}

// Component props types
export interface AIParticipantProps {
  id: string;
  name: string;
  avatar: string;
  model: string;
  color: string;
  onRemove: (id: string) => void;
  canRemove: boolean;
}

// Modal types
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

export interface ChipProps {
  id: string;
  label: string;
  icon?: ReactNode;
  color?: string;
  onRemove?: (id: string) => void;
  showRemoveButton?: boolean;
}

export interface EmojiIconProps {
  emoji: string;
  className?: string;
}
