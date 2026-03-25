import { useState, useCallback, useRef } from "react";
import { toast } from "sonner";
import { combineBlocksToContent } from "@/lib/scriptBlocks";
import type { ProfileData } from "@/hooks/useScriptCopilot";
import { supabase } from "@/integrations/supabase/client";

export interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

export interface ApprovedDraft {
  blockType: string;
  content: string;
}

interface UseScriptChatParams {
  objective?: string;
  channel?: string;
  profileData?: ProfileData | null;
}

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/script-copilot`;
const STREAM_TIMEOUT_MS = 120_000;
const THROTTLE_MS = 50;

export function useScriptChat({ objective, channel, profileData }: UseScriptChatParams) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [approvedDrafts, setApprovedDrafts] = useState<ApprovedDraft[]>([]);
  const abortRef = useRef<AbortController | null>(null);

  const sendMessage = useCallback(
    async (userText: string) => {
      const userMsg: ChatMessage = { role: "user", content: userText };
      const newMessages = [...messages, userMsg];
      setMessages(newMessages);
      setIsStreaming(true);

      let assistantSoFar = "";
      let pendingFlush = false;
      let rafId: number | null = null;
      let lastFlush = 0;

      const flushToState = () => {
        pendingFlush = false;
        rafId = null;
        setMessages((prev) => {
          const last = prev[prev.length - 1];
          if (last?.role === "assistant") {
            return prev.map((m, i) => (i === prev.length - 1 ? { ...m, content: assistantSoFar } : m));
          }
          return [...prev, { role: "assistant", content: assistantSoFar }];
        });
      };

      const upsertAssistant = (chunk: string) => {
        assistantSoFar += chunk;
        const now = Date.now();
        if (now - lastFlush >= THROTTLE_MS) {
          lastFlush = now;
          flushToState();
        } else if (!pendingFlush) {
          pendingFlush = true;
          rafId = requestAnimationFrame(flushToState);
        }
      };

      try {
        const controller = new AbortController();
        abortRef.current = controller;

        // 120s timeout
        const timeoutId = setTimeout(() => controller.abort(), STREAM_TIMEOUT_MS);

        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Você precisa estar logado para usar o copiloto.");
          setIsStreaming(false);
          return;
        }

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "chat",
            messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
            context: { objective, channel, profileData },
          }),
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        if (!resp.ok) {
          let errorMsg = "Erro ao gerar resposta";
          try {
            const errData = await resp.json();
            errorMsg = errData.error || errorMsg;
          } catch {}
          toast.error(errorMsg);
          setIsStreaming(false);
          return;
        }

        if (!resp.body) {
          toast.error("Streaming não suportado");
          setIsStreaming(false);
          return;
        }

        const reader = resp.body.getReader();
        const decoder = new TextDecoder();
        let textBuffer = "";
        let streamDone = false;

        while (!streamDone) {
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
            if (jsonStr === "[DONE]") {
              streamDone = true;
              break;
            }

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        // Final flush
        if (textBuffer.trim()) {
          for (let raw of textBuffer.split("\n")) {
            if (!raw) continue;
            if (raw.endsWith("\r")) raw = raw.slice(0, -1);
            if (raw.startsWith(":") || raw.trim() === "") continue;
            if (!raw.startsWith("data: ")) continue;
            const jsonStr = raw.slice(6).trim();
            if (jsonStr === "[DONE]") continue;
            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;
              if (content) upsertAssistant(content);
            } catch {}
          }
        }

        // Ensure final state flush
        if (rafId) cancelAnimationFrame(rafId);
        flushToState();
      } catch (e: any) {
        if (e.name !== "AbortError") {
          console.error("Stream error:", e);
          toast.error("Erro de conexão. Tente novamente.");
        }
      } finally {
        setIsStreaming(false);
        abortRef.current = null;
      }
    },
    [messages, objective, channel, profileData]
  );

  const cancelStream = useCallback(() => {
    abortRef.current?.abort();
  }, []);

  const approveDraft = useCallback((content: string, blockType: string) => {
    setApprovedDrafts((prev) => [...prev, { blockType, content }]);
  }, []);

  const editDraft = useCallback((index: number, newContent: string) => {
    setApprovedDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, content: newContent } : d)));
  }, []);

  const updateDraftBlockType = useCallback((index: number, newBlockType: string) => {
    setApprovedDrafts((prev) => prev.map((d, i) => (i === index ? { ...d, blockType: newBlockType } : d)));
  }, []);

  const removeDraft = useCallback((index: number) => {
    setApprovedDrafts((prev) => prev.filter((_, i) => i !== index));
  }, []);

  const getFinalScript = useCallback(() => {
    // Group by blockType, then use combineBlocksToContent for legacy format
    const blockMap: Record<string, string> = {};
    for (const draft of approvedDrafts) {
      const key = draft.blockType === "geral" ? "geral" : draft.blockType;
      if (blockMap[key]) {
        blockMap[key] += "\n\n" + draft.content;
      } else {
        blockMap[key] = draft.content;
      }
    }

    // Use combineBlocksToContent for known blocks, append geral at the end
    const knownBlocks = combineBlocksToContent(blockMap);
    const geral = blockMap["geral"];
    if (geral && knownBlocks) return knownBlocks + "\n\n" + geral;
    if (geral) return geral;
    return knownBlocks;
  }, [approvedDrafts]);

  const sendInitialMessage = useCallback(() => {
    const greeting: ChatMessage = {
      role: "assistant",
      content:
        "Olá! 👋 Vou te ajudar a criar um script de prospecção sob medida.\n\nAntes de começar, me conta:\n1. **Qual canal** você vai usar? (WhatsApp, email, ligação, Instagram)\n2. **Qual seu objetivo?** (marcar reunião, fechar venda, gerar interesse, qualificar lead)\n3. **Você já tem algum script ou material** que queira aproveitar?\n\nPode responder livremente que eu adapto!",
    };
    setMessages([greeting]);
  }, []);

  const analyzeExistingScript = useCallback(
    async (script: string) => {
      const truncated = script.slice(0, 5000);

      if (script.length > 3000) {
        toast.info("Script grande detectado. Analisando os primeiros 5000 caracteres.");
      }

      const userMsg: ChatMessage = {
        role: "user",
        content: `Analise e melhore este script:\n\n${truncated}`,
      };
      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
          toast.error("Você precisa estar logado para usar o copiloto.");
          setIsStreaming(false);
          return;
        }

        const resp = await fetch(CHAT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            action: "analyze_script",
            context: { existingScript: truncated, objective, channel, profileData },
          }),
        });

        if (!resp.ok) {
          let errorMsg = "Erro ao analisar script";
          try { const e = await resp.json(); errorMsg = e.error || errorMsg; } catch {}
          toast.error(errorMsg);
          setIsStreaming(false);
          return;
        }

        const data = await resp.json();
        setMessages((prev) => [...prev, { role: "assistant", content: data.content || "Não consegui analisar o script." }]);
      } catch (e) {
        console.error("Analyze error:", e);
        toast.error("Erro ao analisar script. Tente novamente.");
      } finally {
        setIsStreaming(false);
      }
    },
    [objective, channel, profileData]
  );

  return {
    messages,
    isStreaming,
    approvedDrafts,
    sendMessage,
    cancelStream,
    approveDraft,
    editDraft,
    updateDraftBlockType,
    removeDraft,
    getFinalScript,
    sendInitialMessage,
    analyzeExistingScript,
  };
}
