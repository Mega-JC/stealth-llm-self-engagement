import { nanoid } from "nanoid";
import { ChatAnthropic } from "@langchain/anthropic";
import {
  HumanMessage,
  AIMessage,
  SystemMessage,
} from "@langchain/core/messages";
import type { AIParticipant, Message } from "@/types";

/**
 * Creates a LangChain chat model instance based on participant config
 */
function createChatModel(participant: AIParticipant) {
  // For now, we'll use Anthropic's Claude models
  return new ChatAnthropic({
    modelName: participant.model,
    anthropicApiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
    temperature: 0.7,
  });
}

/**
 * Convert our app's message format to LangChain message format
 */
function convertToLangChainMessages(
  messages: Message[],
  participant: AIParticipant,
) {
  const langChainMessages = [new SystemMessage(participant.basePrompt)];

  for (let i = 0; i < messages.length; i++) {
    const message = messages[i]!;
    if (message.role === "human" || i === messages.length - 1) {
      // Last message is always human to make LangChain respond properly
      langChainMessages.push(new HumanMessage(message.content));
    } else {
      langChainMessages.push(new AIMessage(message.content));
    }
  }

  return langChainMessages;
}

/**
 * Fetch a single response from one AI regarding the conversation history
 */
export const fetchAIResponse = async (
  participant: AIParticipant,
  messages: Message[],
  replyIndex = -1,
) => {
  try {
    console.log(
      `Getting response from ${participant.name} (${participant.model})...`,
    );

    // Create LangChain model
    const chatModel = createChatModel(participant);

    // Convert messages to LangChain format
    const langChainMessages = convertToLangChainMessages(
      replyIndex === -1 ? messages : messages.slice(0, replyIndex + 1),
      participant,
    );

    // Call the model
    const response = await chatModel.invoke(langChainMessages);

    // Create message object
    const aiMessage: Message = {
      id: nanoid(),
      content: response.content as string,
      role: "ai",
      timestamp: new Date(),
      aiId: participant.id,
    };

    return aiMessage;
  } catch (error) {
    console.error(`Error getting response from ${participant.name}:`, error);

    // Return a fallback message on error
    return {
      id: nanoid(),
      content: `I apologize, but I encountered an issue while processing your request. Please try again later.`,
      role: "ai" as const,
      timestamp: new Date(),
      aiId: participant.id,
    };
  }
};

/**
 * Determines which AIs should respond to a message based on the mentions
 */
export function determineRespondingAIs(
  messageContent: string,
  participants: AIParticipant[],
): AIParticipant[] {
  // If message mentions specific AIs, only they should respond
  const mentionedAIs = participants.filter((ai) =>
    messageContent.toLowerCase().includes(`@${ai.name.toLowerCase()}`),
  );

  if (mentionedAIs.length > 0) {
    return mentionedAIs;
  }

  // If message contains @all, all AIs should respond
  if (messageContent.toLowerCase().includes("@all")) {
    return [...participants];
  }

  // By default, just the first AI responds if none are specifically mentioned
  return [participants[0]!];
}

/**
 * Determines which AIs should respond to a message using a decider LLM
 * This is used when we want an AI to decide which other AIs should respond,
 * particularly useful during self-engagement
 */
export const determineRespondingAIsByInference = async (
  messageContent: string,
  participants: AIParticipant[],
): Promise<AIParticipant[]> => {
  try {
    // Create a simple decision-making model
    const deciderModel = new ChatAnthropic({
      modelName: "claude-3-haiku-20240307",
      anthropicApiKey: process.env.NEXT_PUBLIC_ANTHROPIC_API_KEY,
      temperature: 0.2, // Low temperature for more deterministic responses
    });

    // Build a system prompt that explains what we want
    const systemPrompt = new SystemMessage(
      "You are a conversation router that determines which AI agents should respond to a message. " +
        "Your job is to analyze the message content and determine which AI agents are most appropriate to respond. " +
        "Output ONLY the names of the agents who should respond, separated by commas, " +
        "or 'all' if all agents should respond. No other text or explanations.",
    );

    // Build the human message with context about the participants
    const contextMessage = new HumanMessage(
      'Looking at this message: "' +
        messageContent +
        '"\n\n' +
        "Which of these AI participants should respond?\n\n" +
        participants
          .map((p) => `- ${p.name}: ${p.basePrompt.split("\n")[0]}`)
          .join("\n") +
        "\n\n" +
        "Reply with ONLY the names separated by commas (e.g., 'assistant,critic'), " +
        "or 'all' if all participants should respond. If no specific agent is appropriate, " +
        "select the most suitable one based on the message content.",
    );

    // Get the LLM's decision
    const response = await deciderModel.invoke([systemPrompt, contextMessage]);
    const decision = (response.content as string).trim().toLowerCase();

    console.log(`Inference decision: "${decision}"`);

    // Process the decision
    if (decision === "all") {
      return [...participants];
    }

    // Split by commas and clean up the names
    const selectedNames = decision
      .split(",")
      .map((name) => name.trim())
      .filter((name) => name.length > 0);

    // Find matching participants
    const selectedParticipants = participants.filter((participant) =>
      selectedNames.includes(participant.name.toLowerCase()),
    );

    // If no matches were found (which shouldn't happen), default to first participant
    if (selectedParticipants.length === 0) {
      console.warn(
        "No matching participants found from inference. Defaulting to first participant.",
      );
      return [participants[0]!];
    }

    return selectedParticipants;
  } catch (error) {
    console.error("Error determining responding AIs by inference:", error);
    // On error, default to the basic rule-based determination
    return determineRespondingAIs(messageContent, participants);
  }
};
