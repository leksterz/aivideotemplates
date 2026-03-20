import { create } from "zustand";
import type { ChatMessage, ConnectionStatus, ToolCall } from "../types/chat";

function uid(): string {
  return crypto.randomUUID();
}

export interface ChatStore {
  messages: ChatMessage[];
  connectionStatus: ConnectionStatus;
  isAgentThinking: boolean;
  sessionKey: string;
  currentRunId: string | null;

  // Actions
  addUserMessage: (content: string) => string;
  addAssistantMessage: (content: string, toolCalls?: ToolCall[]) => string;
  addSystemMessage: (content: string) => void;
  updateMessage: (id: string, updates: Partial<ChatMessage>) => void;
  appendToMessage: (id: string, content: string) => void;
  setConnectionStatus: (status: ConnectionStatus) => void;
  setAgentThinking: (thinking: boolean) => void;
  setCurrentRunId: (runId: string | null) => void;
  clearMessages: () => void;
}

export const useChatStore = create<ChatStore>((set) => ({
  messages: [],
  connectionStatus: "disconnected",
  isAgentThinking: false,
  sessionKey: "avt-editor-" + uid(),
  currentRunId: null,

  addUserMessage: (content) => {
    const id = uid();
    set((s) => ({
      messages: [...s.messages, { id, role: "user", content, timestamp: Date.now() }],
    }));
    return id;
  },

  addAssistantMessage: (content, toolCalls) => {
    const id = uid();
    set((s) => ({
      messages: [
        ...s.messages,
        { id, role: "assistant", content, timestamp: Date.now(), toolCalls },
      ],
    }));
    return id;
  },

  addSystemMessage: (content) => {
    const id = uid();
    set((s) => ({
      messages: [...s.messages, { id, role: "system", content, timestamp: Date.now() }],
    }));
  },

  updateMessage: (id, updates) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, ...updates } : m)),
    })),

  appendToMessage: (id, content) =>
    set((s) => ({
      messages: s.messages.map((m) => (m.id === id ? { ...m, content: m.content + content } : m)),
    })),

  setConnectionStatus: (status) => set({ connectionStatus: status }),
  setAgentThinking: (thinking) => set({ isAgentThinking: thinking }),
  setCurrentRunId: (runId) => set({ currentRunId: runId }),
  clearMessages: () => set({ messages: [] }),
}));
