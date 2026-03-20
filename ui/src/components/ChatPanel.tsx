import {
  User,
  Sparkles,
  Wrench,
  CheckCircle2,
  XCircle,
  Loader2,
  MessageSquareDashed,
  ArrowUp,
  Mic,
  Paperclip,
  Brain,
} from "lucide-react";
import { useState, useRef, useEffect, useCallback } from "react";
import { GatewayClient } from "../gateway/client";
import { useChatStore } from "../store/chat-store";
import { useVideoStore } from "../store/video-store";
import { parseToolCall } from "../tools/video-tools";
import type { ChatMessage, ToolCall } from "../types/chat";
import { AnimatedOrb } from "./chat/animated-orb";

// ── Gateway singleton ────────────────────────────────────────────────────────

let gatewayClient: GatewayClient | null = null;

function getGatewayClient(
  onEvent: (event: string, payload: unknown) => void,
  onConnect: () => void,
  onDisconnect: (reason: string) => void,
): GatewayClient {
  if (!gatewayClient) {
    const wsUrl =
      window.location.protocol === "https:"
        ? `wss://${window.location.host}/ws`
        : `ws://${window.location.hostname}:19001`;

    gatewayClient = new GatewayClient({
      url: wsUrl,
      token: "383ee68484fe47182186eca7bedeb86a58824bdee2bf3118",
      onEvent,
      onConnect,
      onDisconnect,
    });
  }
  return gatewayClient;
}

// ── Tool Call Card ───────────────────────────────────────────────────────────

function ToolCallCard({ toolCall }: { toolCall: ToolCall }) {
  return (
    <div className="flex items-start gap-2 p-2.5 rounded-xl bg-stone-50 border border-stone-200 text-xs chat-shadow">
      <Wrench className="w-3.5 h-3.5 text-emerald-600 mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="font-mono font-medium text-stone-700">{toolCall.name}</span>
          {toolCall.status === "completed" && <CheckCircle2 className="w-3 h-3 text-emerald-500" />}
          {toolCall.status === "error" && <XCircle className="w-3 h-3 text-red-500" />}
          {(toolCall.status === "pending" || toolCall.status === "running") && (
            <Loader2 className="w-3 h-3 text-emerald-600 animate-spin" />
          )}
        </div>
        <pre className="text-[10px] text-stone-400 mt-1 overflow-x-auto whitespace-pre-wrap">
          {JSON.stringify(toolCall.args, null, 2)}
        </pre>
      </div>
    </div>
  );
}

// ── Typing Indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div
      className="flex gap-2 mr-auto max-w-[85%]"
      style={{ animation: "assistant-msg-enter 0.3s ease-out" }}
    >
      <AnimatedOrb size={28} className="mt-0.5" />
      <div className="px-4 py-3 rounded-2xl rounded-bl-md bg-white border border-stone-200 chat-shadow">
        <div className="flex items-center gap-1.5">
          {[0, 1, 2].map((i) => (
            <div
              key={i}
              className="w-2 h-2 rounded-full bg-stone-400"
              style={{
                animation: `typing-dot 1.4s ease-in-out infinite`,
                animationDelay: `${i * 150}ms`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ── Message Bubble ───────────────────────────────────────────────────────────

function MessageBubble({ message }: { message: ChatMessage }) {
  const isUser = message.role === "user";
  const isSystem = message.role === "system";

  const animStyle = isUser
    ? { animation: "user-msg-enter 0.5s cubic-bezier(0.34, 1.56, 0.64, 1)" }
    : { animation: "assistant-msg-enter 0.3s ease-out" };

  return (
    <div className={`flex gap-2 ${isUser ? "flex-row-reverse" : ""}`} style={animStyle}>
      {/* Avatar */}
      {isUser ? (
        <div className="w-7 h-7 rounded-full bg-white border border-stone-200 flex items-center justify-center flex-shrink-0 chat-shadow">
          <User className="w-3.5 h-3.5 text-stone-800" />
        </div>
      ) : isSystem ? (
        <div className="w-7 h-7 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center flex-shrink-0">
          <Sparkles className="w-3.5 h-3.5 text-amber-600" />
        </div>
      ) : (
        <AnimatedOrb size={28} className="mt-0.5" />
      )}

      {/* Content */}
      <div className={`flex flex-col gap-1.5 max-w-[85%] ${isUser ? "items-end" : "items-start"}`}>
        <div
          className={
            isUser
              ? "px-4 py-2.5 rounded-2xl rounded-br-md bg-white border border-stone-200 text-sm text-stone-800 leading-relaxed chat-shadow"
              : isSystem
                ? "px-4 py-2.5 rounded-2xl rounded-bl-md bg-amber-50/80 border border-amber-100 text-sm text-stone-700 leading-relaxed"
                : "py-1 text-sm text-stone-800 leading-relaxed"
          }
        >
          <span className="whitespace-pre-wrap break-words">{message.content}</span>
          {message.isStreaming && (
            <span className="inline-block w-0.5 h-4 ml-0.5 bg-emerald-500 animate-pulse rounded-full" />
          )}
        </div>

        {/* Tool calls */}
        {message.toolCalls && message.toolCalls.length > 0 && (
          <div className="w-full space-y-1.5">
            {message.toolCalls.map((tc) => (
              <ToolCallCard key={tc.id} toolCall={tc} />
            ))}
          </div>
        )}

        {/* Timestamp */}
        <span className="text-[10px] text-stone-400 px-1">
          {new Date(message.timestamp).toLocaleTimeString([], {
            hour: "2-digit",
            minute: "2-digit",
          })}
        </span>
      </div>
    </div>
  );
}

// ── Main ChatPanel ───────────────────────────────────────────────────────────

export function ChatPanel() {
  const [input, setInput] = useState("");
  const [gatewayConnected, setGatewayConnected] = useState(false);
  const streamingMsgIdRef = useRef<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const clientRef = useRef<GatewayClient | null>(null);
  const connectedOnce = useRef(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const messages = useChatStore((s) => s.messages);
  const addUserMessage = useChatStore((s) => s.addUserMessage);
  const addAssistantMessage = useChatStore((s) => s.addAssistantMessage);
  const updateMessage = useChatStore((s) => s.updateMessage);
  const isAgentThinking = useChatStore((s) => s.isAgentThinking);
  const setAgentThinking = useChatStore((s) => s.setAgentThinking);
  const setConnectionStatus = useChatStore((s) => s.setConnectionStatus);
  const sessionKey = useChatStore((s) => s.sessionKey);
  const clearMessages = useChatStore((s) => s.clearMessages);

  const composition = useVideoStore((s) => s.composition);
  const applyToolAction = useVideoStore((s) => s.applyToolAction);

  // ── Gateway connection ─────────────────────────────────────────────────

  useEffect(() => {
    const handleEvent = (event: string, payload: unknown) => {
      const p = payload as Record<string, unknown>;

      if (event === "chat" || event === "agent") {
        const state = p.state as string;
        const message = p.message as Record<string, unknown> | undefined;

        if (state === "delta") {
          let text = "";
          if (message?.content && Array.isArray(message.content)) {
            const textBlock = (message.content as Array<Record<string, unknown>>).find(
              (c) => c.type === "text",
            );
            if (textBlock?.text) {
              text = textBlock.text as string;
            }
          } else if (message?.text) {
            text = message.text as string;
          }

          const msgId = streamingMsgIdRef.current;
          if (msgId && text) {
            useChatStore.getState().updateMessage(msgId, { content: text, isStreaming: true });
          }
        } else if (state === "final") {
          const msgId = streamingMsgIdRef.current;
          if (msgId) {
            useChatStore.getState().updateMessage(msgId, { isStreaming: false });
          }
          useChatStore.getState().setAgentThinking(false);
          streamingMsgIdRef.current = null;
        } else if (state === "aborted" || state === "error") {
          useChatStore.getState().setAgentThinking(false);
          streamingMsgIdRef.current = null;
          if (state === "error") {
            useChatStore.getState().addAssistantMessage("Something went wrong. Please try again.");
          }
        }
      }
    };

    const client = getGatewayClient(
      handleEvent,
      () => {
        setGatewayConnected(true);
        setConnectionStatus("connected");
        connectedOnce.current = true;
      },
      () => {
        setGatewayConnected(false);
        setConnectionStatus("disconnected");
      },
    );

    clientRef.current = client;
    setConnectionStatus("connecting");
    client.start();

    const timeout = setTimeout(() => {
      if (!client.connected) {
        setConnectionStatus("disconnected");
      }
    }, 5000);

    return () => {
      clearTimeout(timeout);
      client.stop();
      clientRef.current = null;
      gatewayClient = null;
    };
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  useEffect(() => {
    const ta = textareaRef.current;
    if (ta) {
      ta.style.height = "auto";
      ta.style.height = Math.min(ta.scrollHeight, 120) + "px";
    }
  }, [input]);

  // ── Send handler ───────────────────────────────────────────────────────

  const handleSend = useCallback(async () => {
    const text = input.trim();
    if (!text) {
      return;
    }

    setInput("");
    addUserMessage(text);
    setAgentThinking(true);

    if (clientRef.current?.connected) {
      try {
        const msgId = addAssistantMessage("");
        streamingMsgIdRef.current = msgId;
        updateMessage(msgId, { isStreaming: true });
        await clientRef.current.sendChat(sessionKey, text);
        return;
      } catch (err) {
        console.warn("Gateway send failed, falling back to local:", err);
        streamingMsgIdRef.current = null;
      }
    }

    setTimeout(() => {
      processUserMessage(text);
    }, 500);
  }, [input, addUserMessage, setAgentThinking, sessionKey, addAssistantMessage, updateMessage]);

  const processUserMessage = useCallback(
    (text: string) => {
      const lower = text.toLowerCase();
      const toolCalls: ToolCall[] = [];
      let response = "";

      if (lower.includes("add") && lower.includes("scene")) {
        const sceneType = lower.includes("intro")
          ? "intro"
          : lower.includes("outro")
            ? "outro"
            : lower.includes("cta")
              ? "cta"
              : lower.includes("feature")
                ? "feature"
                : "content";
        const toolAction = parseToolCall("add_scene", {
          name: `New ${sceneType.charAt(0).toUpperCase() + sceneType.slice(1)}`,
          type: sceneType,
          duration_seconds: 4,
        });
        if (toolAction) {
          applyToolAction(toolAction);
          toolCalls.push({
            id: crypto.randomUUID(),
            name: "add_scene",
            args: { type: sceneType, duration: "4s" },
            status: "completed",
          });
          response = `Added a new ${sceneType} scene (4 seconds). You can see it in the timeline.`;
        }
      } else if (lower.includes("list") && lower.includes("scene")) {
        const sceneList = composition.scenes
          .map(
            (s, i) =>
              `${i + 1}. ${s.name} (${s.type}, ${(s.durationInFrames / composition.fps).toFixed(1)}s)`,
          )
          .join("\n");
        response = `Here are your scenes:\n${sceneList}`;
      } else {
        response =
          'I can help you edit this video! Try: "Add a feature scene", "List all scenes", or ask me anything about the video.';
      }

      setAgentThinking(false);
      addAssistantMessage(response, toolCalls.length > 0 ? toolCalls : undefined);
    },
    [composition, applyToolAction, addAssistantMessage, setAgentThinking],
  );

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      void handleSend();
    }
  };

  const hasMessages = messages.length > 0;

  // ── Render ─────────────────────────────────────────────────────────────

  return (
    <div className="flex flex-col w-80 bg-stone-50 relative">
      {/* Clear button */}
      {hasMessages && (
        <button
          onClick={clearMessages}
          className="absolute top-3 left-3 z-20 w-8 h-8 rounded-full bg-white border border-stone-200 flex items-center justify-center hover:bg-stone-100 transition-colors chat-shadow"
          title="Clear chat"
        >
          <MessageSquareDashed className="w-4 h-4 text-stone-500" />
        </button>
      )}

      {/* Connection dot */}
      <div className="absolute top-3 right-3 z-20 flex items-center gap-1.5">
        <div
          className={`w-2 h-2 rounded-full ${gatewayConnected ? "bg-emerald-500" : "bg-stone-300"}`}
        />
        <span className="text-[10px] text-stone-400">
          {gatewayConnected ? "Connected" : "Offline"}
        </span>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-3 pt-14 pb-36">
        {!hasMessages ? (
          /* Empty state */
          <div className="flex flex-col items-center justify-center h-full gap-5">
            <div style={{ animation: "orb-intro 2s cubic-bezier(0.16, 1, 0.3, 1)" }}>
              <AnimatedOrb size={100} />
            </div>
            <div
              className="text-center"
              style={{ animation: "text-blur-intro 1.5s cubic-bezier(0.16, 1, 0.3, 1)" }}
            >
              <p className="text-base font-semibold text-stone-700">AVT Video Editor</p>
              <p className="text-sm text-stone-400 mt-1.5 px-6 leading-relaxed">
                Send a message to begin editing your video with AI
              </p>
            </div>
          </div>
        ) : (
          <div className="space-y-4">
            {messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} />
            ))}

            {isAgentThinking && !streamingMsgIdRef.current && <TypingIndicator />}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Composer */}
      <div
        className="absolute bottom-0 left-0 right-0 z-10 p-3"
        style={
          !hasMessages
            ? { animation: "composer-intro 2s cubic-bezier(0.16, 1, 0.3, 1) 0.5s both" }
            : undefined
        }
      >
        <div className="bg-white rounded-3xl p-4 chat-shadow border border-stone-100 focus-within:border-stone-300 transition-colors">
          {/* Top row: textarea + send */}
          <div className="flex items-end gap-2">
            <textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Type a message... (Shift+Enter for new line)"
              rows={1}
              className="flex-1 bg-transparent text-sm resize-none max-h-28 text-stone-800 placeholder:text-stone-400 px-2 py-1.5"
              style={{ lineHeight: "1.5" }}
              disabled={isAgentThinking}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isAgentThinking}
              className="w-9 h-9 rounded-full flex items-center justify-center flex-shrink-0 transition-all hover:scale-105 disabled:opacity-30 disabled:cursor-not-allowed"
              style={{ overflow: "hidden", position: "relative" }}
            >
              {input.trim() ? (
                <div className="w-full h-full flex items-center justify-center">
                  <AnimatedOrb size={36} />
                  <ArrowUp className="w-4 h-4 text-white absolute" strokeWidth={2.5} />
                </div>
              ) : (
                <div className="w-full h-full rounded-full bg-stone-100 flex items-center justify-center">
                  <ArrowUp className="w-4 h-4 text-stone-400" strokeWidth={2.5} />
                </div>
              )}
            </button>
          </div>

          {/* Bottom row: mic, attach, model */}
          <div className="flex items-center gap-2 mt-2.5 pt-0">
            <button
              className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors text-stone-600"
              title="Voice input"
            >
              <Mic className="w-4 h-4" />
            </button>
            <button
              className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors text-stone-600"
              title="Attach file"
            >
              <Paperclip className="w-4 h-4" />
            </button>
            <button
              className="w-9 h-9 rounded-full bg-stone-100 flex items-center justify-center hover:bg-stone-200 transition-colors text-stone-600"
              title="Model: Claude"
            >
              <Brain className="w-4 h-4" />
            </button>
            <span className="text-xs text-stone-400">Claude</span>
          </div>
        </div>
      </div>
    </div>
  );
}
