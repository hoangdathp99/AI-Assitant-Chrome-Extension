// Type definitions for AI Chatbot Extension

export interface ChatMessage {
  id: string;
  role: "user" | "model";
  text: string;
  timestamp: number;
}

export interface AgentCursorState {
  visible: boolean;
  x: number;
  y: number;
  label?: string;
  isClicking?: boolean;
}

export interface AgentContext {
  pageUrl: string;
  pageTitle: string;
  setCursor: (state: AgentCursorState) => void;
}

// Chrome Extension Storage Types
export interface ExtensionStorage {
  geminiApiKey?: string;
  chatbotEnabled?: boolean;
}

// Gemini API Types (simplified from @google/genai)
export interface Content {
  role: "user" | "model";
  parts: Part[];
}

export interface Part {
  text?: string;
  functionCall?: FunctionCall;
  functionResponse?: FunctionResponse;
}

export interface FunctionCall {
  name: string;
  id: string;
  args: Record<string, any>;
}

export interface FunctionResponse {
  name: string;
  id: string;
  response: {
    result: any;
  };
}
