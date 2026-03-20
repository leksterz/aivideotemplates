/**
 * OpenClaw Gateway WebSocket Client (React port).
 * Speaks Protocol v3 — binary-safe JSON over WebSocket.
 */

type GatewayEventFrame = {
  type: "event";
  event: string;
  payload?: unknown;
  seq?: number;
};

type GatewayResponseFrame = {
  type: "res";
  id: string;
  ok: boolean;
  payload?: unknown;
  error?: { code: string; message: string; details?: unknown };
};

type Pending = {
  resolve: (value: unknown) => void;
  reject: (err: unknown) => void;
};

export type GatewayClientOptions = {
  url: string;
  token?: string;
  password?: string;
  onEvent?: (event: string, payload: unknown) => void;
  onConnect?: () => void;
  onDisconnect?: (reason: string) => void;
};

export class GatewayClient {
  private ws: WebSocket | null = null;
  private pending = new Map<string, Pending>();
  private closed = false;
  private backoffMs = 800;
  private opts: GatewayClientOptions;

  constructor(opts: GatewayClientOptions) {
    this.opts = opts;
  }

  get connected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  start() {
    this.closed = false;
    this.connect();
  }

  stop() {
    this.closed = true;
    this.ws?.close();
    this.ws = null;
    this.flushPending(new Error("client stopped"));
  }

  async request<T = unknown>(method: string, params?: unknown): Promise<T> {
    return new Promise((resolve, reject) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        reject(new Error("not connected"));
        return;
      }
      const id = crypto.randomUUID();
      this.pending.set(id, {
        resolve: resolve as (v: unknown) => void,
        reject,
      });
      this.ws.send(JSON.stringify({ type: "req", id, method, params }));
    });
  }

  // Convenience methods matching OpenClaw gateway API
  async sendChat(sessionKey: string, message: string, attachments?: unknown[]) {
    return this.request("chat.send", {
      sessionKey,
      idempotencyKey: crypto.randomUUID(),
      message,
      attachments,
    });
  }

  async getChatHistory(sessionKey: string) {
    return this.request("chat.history", { sessionKey });
  }

  async abortChat(sessionKey: string) {
    return this.request("chat.abort", { sessionKey });
  }

  async listAgents() {
    return this.request("agents.list");
  }

  async listSessions() {
    return this.request("sessions.list");
  }

  private connect() {
    if (this.closed) {
      return;
    }

    this.ws = new WebSocket(this.opts.url);

    this.ws.addEventListener("open", () => {
      this.backoffMs = 800;
      this.sendConnectFrame();
    });

    this.ws.addEventListener("message", (ev) => {
      this.handleMessage(String(ev.data ?? ""));
    });

    this.ws.addEventListener("close", (ev) => {
      this.ws = null;
      this.flushPending(new Error(`closed (${ev.code}): ${ev.reason}`));
      this.opts.onDisconnect?.(ev.reason || "connection closed");
      if (!this.closed) {
        this.scheduleReconnect();
      }
    });

    this.ws.addEventListener("error", () => {
      // close handler will fire
    });
  }

  private sendConnectFrame() {
    if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
      return;
    }

    const auth: Record<string, string> = {};
    if (this.opts.token) {
      auth.token = this.opts.token;
    }
    if (this.opts.password) {
      auth.password = this.opts.password;
    }

    const frame = {
      type: "req",
      id: crypto.randomUUID(),
      method: "connect",
      params: {
        minProtocol: 3,
        maxProtocol: 3,
        client: {
          id: "openclaw-control-ui",
          displayName: "AVT Video Editor",
          version: "0.1.0",
          platform: "web",
          mode: "webchat",
        },
        role: "operator",
        scopes: ["operator.admin", "operator.write", "operator.read"],
        ...(Object.keys(auth).length > 0 ? { auth } : {}),
      },
    };

    const connectId = frame.id;
    this.pending.set(connectId, {
      resolve: (_payload: unknown) => {
        this.opts.onConnect?.();
      },
      reject: (err) => {
        console.error("Connect failed:", err);
      },
    });

    this.ws.send(JSON.stringify(frame));
  }

  private handleMessage(raw: string) {
    let frame: GatewayResponseFrame | GatewayEventFrame | { type: string };
    try {
      frame = JSON.parse(raw);
    } catch {
      return;
    }

    if (frame.type === "res") {
      const res = frame as GatewayResponseFrame;
      const p = this.pending.get(res.id);
      if (p) {
        this.pending.delete(res.id);
        if (res.ok) {
          p.resolve(res.payload);
        } else {
          p.reject(new Error(res.error?.message ?? "unknown error"));
        }
      }
    } else if (frame.type === "event") {
      const evt = frame as GatewayEventFrame;
      this.opts.onEvent?.(evt.event, evt.payload);
    } else if (frame.type === "hello-ok") {
      // Handle hello-ok as successful connect
      this.opts.onConnect?.();
    }
  }

  private scheduleReconnect() {
    if (this.closed) {
      return;
    }
    const delay = this.backoffMs;
    this.backoffMs = Math.min(this.backoffMs * 1.7, 15_000);
    setTimeout(() => this.connect(), delay);
  }

  private flushPending(err: Error) {
    for (const [, p] of this.pending) {
      p.reject(err);
    }
    this.pending.clear();
  }
}
