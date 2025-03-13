"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import { Plus, Send, ChevronLeft, Minus } from "lucide-react";
import { nanoid } from "nanoid";
import { Chip } from "@/components/chip";
import { ModalList } from "@/components/modal-list";
import { EmojiIcon } from "@/components/emoji-icon";
import { ChatMessage } from "@/components/chat-message";
import {
  determineRespondingAIs,
  determineRespondingAIsByInference,
  fetchAIResponse,
} from "@/services/ai-service";

import type { Message, Conversation } from "@/types";
import { cn } from "@/utils";
import { defaultAIs } from "@/utils/config";

export default function ChatPage() {
  const [conversation, setConversation] = useState<Conversation>({
    id: nanoid(),
    title: "New Conversation",
    messages: [],
    participants: defaultAIs.slice(0, 2), // Start with just two AIs
  });

  const [inputMessage, setInputMessage] = useState("");
  const [isAddingAI, setIsAddingAI] = useState(false);
  const [selfEngageEnabled, setSelfEngageEnabled] = useState(false);
  const [showSelfEngageConfig, setShowSelfEngageConfig] = useState(false);
  const [maxSelfEngageMessages, setMaxSelfEngageMessages] = useState(10);
  const [isLoading, setIsLoading] = useState(false);
  const [selfEngagementInProgress, setSelfEngagementInProgress] =
    useState(false);
  const messagesContainerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop =
        messagesContainerRef.current.scrollHeight;
    }
  };

  const handleSelfEngageToggle = () => {
    if (!selfEngageEnabled) {
      // Need at least 2 AIs for self-engagement
      if (conversation.participants.length < 2) {
        alert(
          "You need at least 2 AI participants for self-engagement. Please add another AI.",
        );
        return;
      }
      setShowSelfEngageConfig(true);
    } else {
      setSelfEngageEnabled(false);
    }
  };

  const handleSelfEngageConfigSave = () => {
    setSelfEngageEnabled(true);
    setShowSelfEngageConfig(false);

    // If we already have conversation messages, start self-engagement immediately
    if (conversation.messages.length > 0) {
      setTimeout(() => {
        void handleSelfEngagement(conversation.messages);
      }, 500);
    }
  };

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return;

    setIsLoading(true);

    let messageContent = inputMessage.trim();

    // Add @all if no specific mention is found
    messageContent = !/@(\w+)/.exec(messageContent)
      ? messageContent + " @all"
      : messageContent;

    // Create user message
    const userMessage: Message = {
      id: nanoid(),
      content: messageContent,
      role: "human",
      timestamp: new Date(),
    };

    // Add user message to conversation
    setConversation((prev) => ({
      ...prev,
      messages: [...prev.messages, userMessage],
    }));

    // Clear input
    setInputMessage("");

    // Scroll to latest message
    setTimeout(scrollToBottom, 100);

    try {
      // If self-engagement is enabled, skip normal AI responses and jump straight to self-engagement
      if (selfEngageEnabled) {
        // Get updated messages including the new user message for self-engagement
        const updatedMessages = [...conversation.messages, userMessage];

        // Start self-engagement with the updated messages
        setTimeout(() => {
          void handleSelfEngagement(updatedMessages);
        }, 500);
      }
      // Normal mode - get responses from all relevant AIs
      else {
        // Determine which AIs should respond
        const respondingAIs = determineRespondingAIs(
          messageContent,
          conversation.participants,
        );

        const currentMessages = [...conversation.messages, userMessage];
        const previousMessages = [...currentMessages];

        // Process each responding AI
        for (const ai of respondingAIs) {
          // Get AI response
          const aiMessage = await fetchAIResponse(ai, previousMessages);

          // Add AI message to conversation
          setConversation((prev) => ({
            ...prev,
            messages: [...prev.messages, aiMessage],
          }));

          // Add this message to our current message list
          currentMessages.push(aiMessage);

          // Scroll to bottom after adding the message
          setTimeout(scrollToBottom, 100);
        }
      }
    } catch (error) {
      console.error("Error getting AI responses:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Updated handleSelfEngagement to accept initial messages
  const handleSelfEngagement = async (initialMessages?: Message[]) => {
    if (selfEngagementInProgress) return;

    // Use provided initial messages or current conversation messages
    const startingMessages = initialMessages ?? conversation.messages;

    // Don't proceed if there are no messages
    if (startingMessages.length === 0) {
      console.warn("Cannot start self-engagement with no messages");
      return;
    }

    setSelfEngagementInProgress(true);
    let messageCount = 0;

    try {
      // Get the current messages in the conversation
      const currentMessages = [...startingMessages];
      console.log(
        "starting self-engagement with currentMessages",
        currentMessages,
      );

      // Continue until we reach the maximum number of messages
      while (messageCount < maxSelfEngageMessages) {
        // Get the latest message to use as context
        const lastMessage = currentMessages[currentMessages.length - 1];

        // Use AI inference to determine which AIs should respond next
        // (possibly multiple AIs should respond)
        const respondingAIs = await determineRespondingAIsByInference(
          lastMessage?.content ?? "Continue the conversation",
          conversation.participants,
        );

        // If no AIs were selected, end the conversation
        if (respondingAIs.length === 0) {
          console.log("No AIs selected to respond, ending self-engagement");
          break;
        }

        console.log(
          `${respondingAIs.length} AIs selected to respond in this round`,
        );

        // Process each responding AI (similar to handleSendMessage)
        for (const ai of respondingAIs) {
          // Generate a response from this AI
          const aiMessage = await fetchAIResponse(ai, currentMessages);

          // Add the message to the conversation state
          setConversation((prev) => ({
            ...prev,
            messages: [...prev.messages, aiMessage],
          }));

          // Update our working copy of messages
          currentMessages.push(aiMessage);

          // Increment message count
          messageCount++;

          // Scroll to show the new message
          setTimeout(scrollToBottom, 100);

          // Add a natural pause between messages and let UI update
          await new Promise((r) => setTimeout(r, 1000 + Math.random() * 2000));

          // Check if we've reached the max message count
          if (messageCount >= maxSelfEngageMessages) {
            break;
          }
        }
      }

      console.log("Self-engagement completed with", messageCount, "messages");
    } catch (error) {
      console.error("Error during self-engagement:", error);
    } finally {
      setSelfEngagementInProgress(false);
    }
  };

  const addAIParticipant = (aiId: string) => {
    // Find the AI in the default list
    const aiToAdd = defaultAIs.find((ai) => ai.id === aiId);

    if (!aiToAdd) return;

    // Check if AI is already in the conversation
    if (conversation.participants.some((p) => p.id === aiToAdd.id)) return;

    setConversation((prev) => ({
      ...prev,
      participants: [...prev.participants, aiToAdd],
    }));
    setIsAddingAI(false);
  };

  const removeAIParticipant = (aiId: string) => {
    // If removing would result in less than 2 AIs and self-engagement is enabled,
    // disable self-engagement
    if (conversation.participants.length <= 2 && selfEngageEnabled) {
      setSelfEngageEnabled(false);
    }

    setConversation((prev) => ({
      ...prev,
      participants: prev.participants.filter((ai) => ai.id !== aiId),
    }));
  };

  // Create modal list items from available AIs
  const availableAIItems = defaultAIs
    .filter((ai) => !conversation.participants.some((p) => p.id === ai.id))
    .map((ai) => ({
      id: ai.id,
      label: ai.name,
      description: ai.model,
      icon: <EmojiIcon emoji={ai.avatar} />,
      iconColor: ai.color,
      onClick: (id: string) => addAIParticipant(id),
    }));

  return (
    <div className="flex h-screen flex-col bg-gray-900 text-white">
      {/* Self-engagement toggle */}
      <div className="flex items-center justify-center bg-gray-800 py-2">
        <button
          onClick={handleSelfEngageToggle}
          disabled={conversation.participants.length < 2}
          className={cn(
            "flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition-colors hover:bg-opacity-80",
            selfEngageEnabled ? "bg-green-600" : "bg-gray-700",
            conversation.participants.length < 2 &&
              "cursor-not-allowed opacity-50",
          )}
        >
          {selfEngageEnabled
            ? "Disable Self-Engagement"
            : "Enable Self-Engagement"}
        </button>
      </div>

      {/* Header */}
      <header className="flex items-center justify-between border-b border-gray-700 p-4">
        <div className="flex items-center gap-2">
          <Link href="/" className="rounded-full p-2 hover:bg-gray-800">
            <ChevronLeft size={20} />
          </Link>
          <h1 className="text-xl font-bold">{conversation.title}</h1>
        </div>
        <div className="flex items-center gap-2">
          {conversation.participants.map((ai) => (
            <Chip
              key={ai.id}
              id={ai.id}
              label={ai.name}
              icon={<EmojiIcon emoji={ai.avatar} />}
              color={ai.color}
              onRemove={removeAIParticipant}
              showRemoveButton={conversation.participants.length > 1}
            />
          ))}
          <button
            onClick={() => setIsAddingAI(true)}
            className="rounded-full p-2 hover:bg-gray-800"
          >
            <Plus size={20} />
          </button>
        </div>
      </header>

      {/* Chat Messages */}
      <div
        ref={messagesContainerRef}
        className="flex-1 space-y-4 overflow-y-auto p-4"
      >
        {conversation.messages.map((message) => {
          const ai =
            message.role === "ai"
              ? conversation.participants.find((p) => p.id === message.aiId)
              : null;

          return (
            <ChatMessage
              key={message.id}
              id={message.id}
              content={message.content}
              role={message.role}
              timestamp={message.timestamp}
              sender={
                ai
                  ? {
                      name: ai.name,
                      icon: <EmojiIcon emoji={ai.avatar} />,
                      color: ai.color,
                    }
                  : undefined
              }
            />
          );
        })}

        {conversation.messages.length === 0 && (
          <div className="flex h-full items-center justify-center text-gray-500">
            {selfEngageEnabled
              ? "Type a message to seed the AI self-engagement"
              : "Start a conversation with the AIs"}
          </div>
        )}

        {/* Loading */}
        {(isLoading || selfEngagementInProgress) && (
          <div className="flex justify-center">
            <div className="flex items-center space-x-2 text-gray-400">
              <div className="h-2 w-2 animate-pulse rounded-full bg-blue-500"></div>
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-blue-500"
                style={{ animationDelay: "0.2s" }}
              ></div>
              <div
                className="h-2 w-2 animate-pulse rounded-full bg-blue-500"
                style={{ animationDelay: "0.4s" }}
              ></div>
              <span className="ml-2">
                {selfEngagementInProgress
                  ? "AIs are engaging..."
                  : "Waiting for response..."}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Message Input */}
      <div className="border-t border-gray-700 p-4">
        <div className="flex gap-2">
          <textarea
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                void handleSendMessage();
              }
            }}
            disabled={isLoading ?? selfEngagementInProgress}
            placeholder={
              selfEngageEnabled && conversation.messages.length === 0
                ? "Type a message to seed the engagement..."
                : "Type a message..."
            }
            className="flex-1 rounded-lg bg-gray-800 px-4 py-2 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          />
          <button
            onClick={() => void handleSendMessage()}
            disabled={
              !inputMessage.trim() || isLoading || selfEngagementInProgress
            }
            className="rounded-lg bg-blue-600 p-2 disabled:opacity-50"
          >
            <Send size={20} />
          </button>
        </div>

        {/* Self-engagement status */}
        {selfEngageEnabled && (
          <div className="mt-2 flex items-center justify-between text-xs text-gray-400">
            <span>
              Self-engagement:{" "}
              {selfEngagementInProgress ? "In progress" : "Ready"}
            </span>
            <span>{maxSelfEngageMessages} max messages</span>
          </div>
        )}
      </div>

      {/* AI Selection Modal */}
      <ModalList
        title="Add an AI to the conversation"
        isOpen={isAddingAI}
        onClose={() => setIsAddingAI(false)}
        items={availableAIItems}
        buttons={[
          {
            id: "cancel",
            label: "Cancel",
            variant: "secondary",
            onClick: () => setIsAddingAI(false),
          },
        ]}
      />

      {/* Self-Engage Configuration Modal */}
      {showSelfEngageConfig && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50 p-4">
          <div className="w-full max-w-md rounded-lg bg-gray-800 p-6">
            <h2 className="mb-4 text-xl font-bold">Self-Engagement Settings</h2>

            <div className="mb-4">
              <label className="mb-2 block text-sm font-medium">
                Maximum messages to exchange:
              </label>
              <div className="flex items-center">
                <button
                  onClick={() =>
                    setMaxSelfEngageMessages(
                      Math.max(1, maxSelfEngageMessages - 1),
                    )
                  }
                  className="h-10 rounded-l-lg bg-gray-700 p-2 hover:bg-gray-600"
                >
                  <Minus size={16} />
                </button>
                <div className="flex-1 bg-gray-700 px-4 py-2 text-center">
                  {maxSelfEngageMessages}
                </div>
                <button
                  onClick={() =>
                    setMaxSelfEngageMessages(maxSelfEngageMessages + 1)
                  }
                  className="h-10 rounded-r-lg bg-gray-700 p-2 hover:bg-gray-600"
                >
                  <Plus size={16} />
                </button>
              </div>
            </div>

            <p className="mb-4 text-sm text-gray-400">
              The AIs will engage with each other up to this many messages after
              you send your initial prompt.
            </p>

            <div className="flex justify-end gap-2">
              <button
                onClick={() => setShowSelfEngageConfig(false)}
                className="rounded-lg bg-gray-700 px-4 py-2 hover:bg-gray-600"
              >
                Cancel
              </button>
              <button
                onClick={handleSelfEngageConfigSave}
                className="rounded-lg bg-green-600 px-4 py-2 hover:bg-green-700"
              >
                Enable
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
