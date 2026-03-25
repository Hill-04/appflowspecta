import { useState, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import type { BlockId } from "@/lib/scriptBlocks";
import { SCRIPT_BLOCKS } from "@/lib/scriptBlocks";

export type BlockStatus = "pending" | "generating" | "ready" | "approved";

export interface ProfileData {
  offerType?: string;
  targetAudienceDescription?: string;
  mainPain?: string;
  differential?: string;
  averageTicket?: string;
}

interface UseScriptCopilotParams {
  objective: string;
  channel: string;
  profileData: ProfileData;
}

export function useScriptCopilot({ objective, channel, profileData }: UseScriptCopilotParams) {
  const [blocks, setBlocks] = useState<Record<string, string>>({});
  const [blockStatus, setBlockStatus] = useState<Record<string, BlockStatus>>(
    () => Object.fromEntries(SCRIPT_BLOCKS.map((b) => [b.id, "pending" as BlockStatus]))
  );

  const callEdgeFunction = useCallback(
    async (action: string, block: string, extra: Record<string, string> = {}) => {
      const { data, error } = await supabase.functions.invoke("script-copilot", {
        body: { action, block, objective, channel, profileData, ...extra },
      });

      if (error) {
        const msg = (data as any)?.error || "Erro ao gerar bloco";
        toast.error(msg);
        return null;
      }
      return data?.content as string | null;
    },
    [objective, channel, profileData]
  );

  const generateBlock = useCallback(
    async (blockId: BlockId) => {
      setBlockStatus((s) => ({ ...s, [blockId]: "generating" }));
      const content = await callEdgeFunction("generate_block", blockId);
      if (content) {
        setBlocks((b) => ({ ...b, [blockId]: content }));
        setBlockStatus((s) => ({ ...s, [blockId]: "ready" }));
      } else {
        setBlockStatus((s) => ({ ...s, [blockId]: "pending" }));
      }
    },
    [callEdgeFunction]
  );

  const refineBlock = useCallback(
    async (blockId: BlockId, feedback: string) => {
      setBlockStatus((s) => ({ ...s, [blockId]: "generating" }));
      const content = await callEdgeFunction("refine_block", blockId, {
        currentContent: blocks[blockId] || "",
        feedback,
      });
      if (content) {
        setBlocks((b) => ({ ...b, [blockId]: content }));
        setBlockStatus((s) => ({ ...s, [blockId]: "ready" }));
      } else {
        setBlockStatus((s) => ({ ...s, [blockId]: "ready" }));
      }
    },
    [callEdgeFunction, blocks]
  );

  const generateVariation = useCallback(
    async (blockId: BlockId) => {
      setBlockStatus((s) => ({ ...s, [blockId]: "generating" }));
      const content = await callEdgeFunction("generate_variation", blockId, {
        currentContent: blocks[blockId] || "",
      });
      if (content) {
        setBlocks((b) => ({ ...b, [blockId]: content }));
        setBlockStatus((s) => ({ ...s, [blockId]: "ready" }));
      } else {
        setBlockStatus((s) => ({ ...s, [blockId]: "ready" }));
      }
    },
    [callEdgeFunction, blocks]
  );

  const approveBlock = useCallback((blockId: BlockId) => {
    setBlockStatus((s) => ({ ...s, [blockId]: "approved" }));
  }, []);

  const resetBlock = useCallback((blockId: BlockId) => {
    setBlockStatus((s) => ({ ...s, [blockId]: "pending" }));
    setBlocks((b) => ({ ...b, [blockId]: "" }));
  }, []);

  const updateBlockContent = useCallback((blockId: BlockId, content: string) => {
    setBlocks((b) => ({ ...b, [blockId]: content }));
  }, []);

  const allApproved = SCRIPT_BLOCKS.every((b) => blockStatus[b.id] === "approved");

  return {
    blocks,
    blockStatus,
    generateBlock,
    refineBlock,
    generateVariation,
    approveBlock,
    resetBlock,
    updateBlockContent,
    allApproved,
  };
}
