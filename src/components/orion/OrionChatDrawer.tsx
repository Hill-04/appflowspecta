import { useState, useRef, useEffect } from "react";
import { X, Zap, Send, RotateCcw } from "lucide-react";
import { useStore } from "@/hooks/useStore";
import { useNavigate } from "react-router-dom";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

export default function OrionChatDrawer({ onClose }: { onClose: () => void }) {
  const { profileData, setOrionTourStep } = useStore();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const displayName = profileData?.preferredName || profileData?.firstName || "";

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleSend = async () => {
    const text = input.trim();
    if (!text || isLoading) return;
    setInput("");

    const userMsg: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMsg]);
    setIsLoading(true);

    let assistantSoFar = "";

    try {
      // Get user session token for authenticated request
      const { data: { session } } = await (await import("@/integrations/supabase/client")).supabase.auth.getSession();
      const token = session?.access_token;
      if (!token) {
        throw new Error("Não autenticado");
      }

      const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/orion-chat`;
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ messages: [...messages, userMsg] }),
      });

      if (!resp.ok || !resp.body) {
        throw new Error("Falha na conexão");
      }

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content as string | undefined;
            if (content) {
              assistantSoFar += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch {
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "Desculpe, ocorreu um erro na comunicação. Tente novamente." },
      ]);
    }

    setIsLoading(false);
  };

  const navigate = useNavigate();

  const handleRestartTour = async () => {
    await setOrionTourStep(0);
    onClose();
    navigate("/app");
  };

  return (
    <div className="w-80 sm:w-96 h-[480px] glass-surface-elevated flex flex-col animate-in slide-in-from-bottom-2 fade-in duration-300 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <div className="h-7 w-7 rounded-full gradient-blue flex items-center justify-center shadow-[0_0_12px_-3px_hsl(205_90%_54%/0.3)]">
            <Zap className="h-3.5 w-3.5 text-primary-foreground" />
          </div>
          <div>
            <p className="text-sm font-medium text-foreground">ORION</p>
            <p className="text-[10px] text-muted-foreground/50 uppercase tracking-wider">Assistente Estratégico</p>
          </div>
        </div>
        <button onClick={onClose} className="p-1 rounded-md hover:bg-secondary text-muted-foreground hover:text-foreground transition">
          <X className="h-4 w-4" />
        </button>
      </div>

      {/* Messages */}
      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-3 space-y-3">
        {messages.length === 0 && (
          <div className="text-center py-8 space-y-3">
            <p className="text-xs text-muted-foreground">
              {displayName ? `Olá, ${displayName}.` : "Olá."} Como posso ajudá-lo?
            </p>
            <button
              onClick={handleRestartTour}
              className="inline-flex items-center gap-1.5 text-xs text-primary hover:text-primary/80 transition"
            >
              <RotateCcw className="h-3 w-3" /> Refazer tutorial
            </button>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div
              className={`max-w-[85%] rounded-xl px-3 py-2 text-xs leading-relaxed ${
                m.role === "user"
                  ? "bg-primary/15 text-foreground"
                  : "bg-white/[0.04] text-foreground/90 border border-white/[0.06]"
              }`}
            >
              {m.role === "assistant" ? (
                <div className="prose prose-invert prose-xs max-w-none [&>p]:m-0 [&>ul]:m-0 [&>ol]:m-0">
                  <ReactMarkdown>{m.content}</ReactMarkdown>
                </div>
              ) : (
                m.content
              )}
            </div>
          </div>
        ))}
        {isLoading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-white/[0.04] border border-white/[0.06] rounded-xl px-3 py-2">
              <span className="text-xs text-muted-foreground animate-pulse">Pensando...</span>
            </div>
          </div>
        )}
      </div>

      {/* Quick actions */}
      {messages.length > 0 && (
        <div className="px-4 pb-1">
          <button onClick={handleRestartTour} className="text-[10px] text-muted-foreground/50 hover:text-primary transition flex items-center gap-1">
            <RotateCcw className="h-2.5 w-2.5" /> Refazer tutorial
          </button>
        </div>
      )}

      {/* Input */}
      <div className="px-3 py-3 border-t border-white/[0.06]">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend();
          }}
          className="flex items-center gap-2"
        >
          <input
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Pergunte algo..."
            className="flex-1 bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground/40 focus:outline-none focus:ring-1 focus:ring-primary/30 transition"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="h-8 w-8 rounded-lg gradient-primary flex items-center justify-center text-primary-foreground disabled:opacity-30 transition hover:opacity-90"
          >
            <Send className="h-3.5 w-3.5" />
          </button>
        </form>
      </div>
    </div>
  );
}
