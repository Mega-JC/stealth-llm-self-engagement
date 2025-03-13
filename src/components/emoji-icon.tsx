import React from "react";

export interface EmojiIconProps {
  emoji: string;
  className?: string;
}
export function EmojiIcon({ emoji, className = "" }: EmojiIconProps) {
  return <span className={className}>{emoji}</span>;
}
