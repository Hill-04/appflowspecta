import { useState, useEffect, useRef, useMemo } from "react";
import { Send, Square, ClipboardPaste, Check, Pencil, Trash2, Save, FileText, Upload, AlertTriangle } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { useScriptChat, ChatMessage } from "@/hooks/useScriptChat";
import { useStore } from "@/hooks/useStore";
import { toast } from "sonner";
import { validatePlaceholders, DRAFT_START, DRAFT_END, parseBlockType, BLOCK_TYPE_LABELS, SCRIPT_BLOCKS, PLACEHOLDERS } from "@/lib/scriptBlocks";
import ReactMarkdown from "react-markdown";

interface ScriptChatProps {
  onComplete?: (scriptId?: string) => void;
  fullscreen?: boolean;
  existingScript?: string;
}

const BLOCK_ORDER = ["abertura", "diferencial", "diagnostico", "prova_social", "cta", "geral"];

export default function ScriptChat({ onComplete, fullscreen, existingScript }: ScriptChatProps) {
  const { profileData, addScript } = useStore();
  const [input, setInput] = useState("");
  const [pasteOpen, setPasteOpen] = useState(false);
  const [pasteContent, setPasteContent] = useState("");
  const [saveOpen, setSaveOpen] = useState(false);
  const [scriptName, setScriptName] = useState("");
  const [editingDraft, setEditingDraft] = useState<{ index: number; content: string } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const {
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
  } = useScriptChat({
    profileData: profileData || undefined,
  });

  useEffect(() => {
    if (existingScript) {
      sendInitialMessage();
      setTimeout(() => analyzeExistingScript(existingScript), 500);
    } else {
      sendInitialMessage();
    }
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = () => {
    const text = input.trim();
    if (!text || isStreaming) return;
    setInput("");
    sendMessage(text);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handlePaste = () => {
    const content = pasteContent.trim();
    if (content.length < 20) {
      toast.error("Script muito curto. Cole pelo menos 20 caracteres.");
      return;
    }
    setPasteOpen(false);
    setPasteContent("");
    analyzeExistingScript(content);
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.match(/\.(txt|md|csv|doc)$/i)) {
      toast.error("Formato não suportado. Use arquivos .txt ou .md");
      return;
    }

    if (file.size > 500_000) {
      toast.error("Arquivo muito grande. Máximo 500KB.");
      return;
    }

    if (file.name.match(/\.doc$/i)) {
      toast.info("Arquivos .doc: apenas texto puro será extraído (sem formatação).");
    }

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      if (!text || text.trim().length < 20) {
        toast.error("Arquivo vazio ou com pouco conteúdo.");
        return;
      }
      toast.success(`Arquivo "${file.name}" carregado`);
      analyzeExistingScript(text.slice(0, 5000));
    };
    reader.onerror = () => toast.error("Erro ao ler arquivo");
    reader.readAsText(file);
    e.target.value = "";
  };

  const handleSave = async () => {
    if (!scriptName.trim()) return;
    const finalContent = getFinalScript();
    if (!finalContent.trim()) {
      toast.error("Aprove pelo menos um trecho de script antes de salvar.");
      return;
    }
    await addScript({
      name: scriptName.trim(),
      type: "opening",
      content: finalContent,
      tags: ["copiloto"],
    });
    toast.success("Script salvo!");
    setSaveOpen(false);
    onComplete?.();
  };

  // Group approved drafts by block type in correct order
  const groupedDrafts = useMemo(() => {
    const groups: { blockType: string; drafts: { index: number; content: string }[] }[] = [];
    const map = new Map<string, { index: number; content: string }[]>();

    approvedDrafts.forEach((d, i) => {
      const key = d.blockType;
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push({ index: i, content: d.content });
    });

    for (const bt of BLOCK_ORDER) {
      const drafts = map.get(bt);
      if (drafts) groups.push({ blockType: bt, drafts });
    }

    return groups;
  }, [approvedDrafts]);

  return (
    <div className="flex flex-col h-full min-h-0">
      <input
        ref={fileInputRef}
        type="file"
        accept=".txt,.md,.csv,.doc"
        onChange={handleFileUpload}
        className="hidden"
      />

      <div className="flex-1 flex gap-4 min-h-0 overflow-hidden">
        {/* Chat area */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((msg, i) => (
              <MessageBubble key={i} message={msg} onApproveDraft={approveDraft} />
            ))}
            {isStreaming && messages[messages.length - 1]?.role !== "assistant" && (
              <div className="flex gap-2 items-center text-muted-foreground text-sm">
                <div className="animate-pulse">●</div> Pensando...
              </div>
            )}
          </div>

          {/* Input area */}
          <div className="border-t border-border p-3 shrink-0">
            <div className="flex gap-2 mb-2">
              <Button variant="outline" size="sm" onClick={() => setPasteOpen(true)} className="shrink-0 text-xs">
                <ClipboardPaste className="h-3.5 w-3.5 mr-1" /> Colar script
              </Button>
              <Button variant="outline" size="sm" onClick={() => fileInputRef.current?.click()} className="shrink-0 text-xs">
                <Upload className="h-3.5 w-3.5 mr-1" /> Anexar arquivo
              </Button>
              {approvedDrafts.length > 0 && (
                <Button variant="outline" size="sm" onClick={() => setSaveOpen(true)} className="shrink-0 text-xs ml-auto">
                  <Save className="h-3.5 w-3.5 mr-1" /> Salvar ({approvedDrafts.length})
                </Button>
              )}
            </div>
            <div className="flex gap-2 items-end">
              <Textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Digite sua mensagem..."
                className="min-h-[44px] max-h-[120px] resize-none bg-secondary/50"
                rows={1}
              />
              {isStreaming ? (
                <Button variant="destructive" size="icon" onClick={cancelStream} className="shrink-0 h-10 w-10">
                  <Square className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSend} disabled={!input.trim()} size="icon" className="shrink-0 h-10 w-10 gradient-primary text-primary-foreground">
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </div>

        {/* Draft panel - grouped by block type */}
        {approvedDrafts.length > 0 && (
          <div className="w-72 border-l border-border p-3 hidden lg:flex flex-col min-h-0">
            <h3 className="text-sm font-semibold text-foreground mb-2 flex items-center gap-1.5">
              <FileText className="h-4 w-4" /> Rascunho Final
            </h3>
            <ScrollArea className="flex-1">
              <div className="space-y-3 pr-2">
                {groupedDrafts.map((group) => (
                  <div key={group.blockType}>
                    <Badge variant="outline" className="text-xs mb-1.5">
                      {BLOCK_TYPE_LABELS[group.blockType] || group.blockType}
                    </Badge>
                    {group.drafts.map((draft) => (
                      <Card key={draft.index} className="bg-secondary/50 mb-1.5">
                        <CardContent className="p-3">
                          <p className="text-xs text-foreground whitespace-pre-wrap line-clamp-4">{draft.content}</p>
                          <div className="flex gap-1 mt-2 items-center">
                            <Select
                              value={approvedDrafts[draft.index].blockType}
                              onValueChange={(v) => updateDraftBlockType(draft.index, v)}
                            >
                              <SelectTrigger className="h-6 text-xs w-24">
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                {BLOCK_ORDER.map((bt) => (
                                  <SelectItem key={bt} value={bt} className="text-xs">
                                    {BLOCK_TYPE_LABELS[bt]}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 ml-auto"
                              onClick={() => setEditingDraft({ index: draft.index, content: draft.content })}
                            >
                              <Pencil className="h-3 w-3" />
                            </Button>
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => removeDraft(draft.index)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </div>
        )}
      </div>

      {/* Paste dialog */}
      <Dialog open={pasteOpen} onOpenChange={setPasteOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Colar script existente</DialogTitle>
            <DialogDescription className="text-muted-foreground">Cole seu script para a IA analisar e sugerir melhorias (máx. 5000 caracteres)</DialogDescription>
          </DialogHeader>
          <Textarea
            value={pasteContent}
            onChange={(e) => setPasteContent(e.target.value.slice(0, 5000))}
            placeholder="Cole seu script aqui..."
            rows={8}
            className="bg-secondary/50"
          />
          <p className="text-xs text-muted-foreground text-right">{pasteContent.length}/5000</p>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setPasteOpen(false)}>Cancelar</Button>
            <Button onClick={handlePaste} disabled={pasteContent.trim().length < 20} className="gradient-primary text-primary-foreground">Analisar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Save dialog */}
      <Dialog open={saveOpen} onOpenChange={setSaveOpen}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Salvar script</DialogTitle>
            <DialogDescription className="text-muted-foreground">Dê um nome ao seu script para salvá-lo na biblioteca</DialogDescription>
          </DialogHeader>
          <input
            value={scriptName}
            onChange={(e) => setScriptName(e.target.value)}
            placeholder="Nome do script..."
            className="w-full rounded-lg border border-border bg-secondary px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring/50"
          />
          <div className="bg-secondary/50 rounded-lg p-3 max-h-48 overflow-y-auto">
            <p className="text-xs text-muted-foreground whitespace-pre-wrap">{getFinalScript()}</p>
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setSaveOpen(false)}>Cancelar</Button>
            <Button onClick={handleSave} disabled={!scriptName.trim()} className="gradient-primary text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit draft dialog */}
      <Dialog open={!!editingDraft} onOpenChange={() => setEditingDraft(null)}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">Editar trecho</DialogTitle>
          </DialogHeader>
          <Textarea
            value={editingDraft?.content || ""}
            onChange={(e) => setEditingDraft((prev) => prev ? { ...prev, content: e.target.value } : null)}
            rows={6}
            className="bg-secondary/50"
          />
          <DialogFooter>
            <Button variant="ghost" onClick={() => setEditingDraft(null)}>Cancelar</Button>
            <Button
              onClick={() => {
                if (editingDraft) {
                  editDraft(editingDraft.index, editingDraft.content);
                  setEditingDraft(null);
                }
              }}
              className="gradient-primary text-primary-foreground"
            >
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ============ Message Bubble ============

function MessageBubble({ message, onApproveDraft }: { message: ChatMessage; onApproveDraft: (content: string, blockType: string) => void }) {
  const isUser = message.role === "user";

  const parts = useMemo(() => {
    if (isUser) return [{ type: "text" as const, content: message.content, blockType: "geral" }];
    return parseDrafts(message.content);
  }, [message.content, isUser]);

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} animate-fade-in`}>
      <div className={`max-w-[85%] rounded-2xl px-4 py-3 ${isUser ? "bg-primary/15 text-foreground" : "bg-secondary/60 text-foreground"}`}>
        {parts.map((part, i) =>
          part.type === "draft" ? (
            <DraftCard key={i} content={part.content} blockType={part.blockType} onApprove={(bt) => onApproveDraft(part.content, bt)} />
          ) : (
            <div key={i} className="prose prose-sm prose-invert max-w-none text-sm leading-relaxed [&_p]:mb-2 [&_ul]:mb-2 [&_ol]:mb-2 [&_li]:mb-0.5">
              <ReactMarkdown>{part.content}</ReactMarkdown>
            </div>
          )
        )}
      </div>
    </div>
  );
}

// ============ Draft Card ============

function DraftCard({ content, blockType: initialBlockType, onApprove }: { content: string; blockType: string; onApprove: (blockType: string) => void }) {
  const [approved, setApproved] = useState(false);
  const [blockType, setBlockType] = useState(initialBlockType);
  const invalidPlaceholders = validatePlaceholders(content);

  const handleApprove = () => {
    onApprove(blockType);
    setApproved(true);
  };

  // Build suggestion text for invalid placeholders
  const placeholderSuggestion = useMemo(() => {
    if (invalidPlaceholders.length === 0) return null;
    const validList = PLACEHOLDERS.map((p) => `${p.key} (${p.description})`).join(", ");
    return `Placeholders inválidos detectados. Use apenas: ${validList}`;
  }, [invalidPlaceholders]);

  return (
    <Card className="my-3 border-primary/30 bg-primary/5">
      <CardContent className="p-3">
        <div className="flex items-center gap-2 mb-2">
          <Badge variant="outline" className="text-xs">
            {BLOCK_TYPE_LABELS[blockType] || "Geral"}
          </Badge>
          {!approved && (
            <Select value={blockType} onValueChange={setBlockType}>
              <SelectTrigger className="h-6 text-xs w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BLOCK_ORDER.map((bt) => (
                  <SelectItem key={bt} value={bt} className="text-xs">
                    {BLOCK_TYPE_LABELS[bt]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
        </div>

        <p className="text-sm text-foreground whitespace-pre-wrap font-mono leading-relaxed">{content}</p>

        {invalidPlaceholders.length > 0 && (
          <>
            <div className="mt-2 flex flex-wrap gap-1">
              {invalidPlaceholders.map((p) => (
                <Badge key={p} variant="destructive" className="text-xs">
                  {p} (inválido)
                </Badge>
              ))}
            </div>
            <Alert variant="destructive" className="mt-2 py-2">
              <AlertTriangle className="h-3.5 w-3.5" />
              <AlertDescription className="text-xs">{placeholderSuggestion}</AlertDescription>
            </Alert>
          </>
        )}

        <PlaceholderChips content={content} />

        <div className="flex gap-2 mt-3">
          {approved ? (
            <Badge className="bg-success/15 text-success border-success/30">
              <Check className="h-3 w-3 mr-1" /> Aprovado
            </Badge>
          ) : (
            <Button size="sm" onClick={handleApprove} className="gradient-primary text-primary-foreground text-xs h-7">
              <Check className="h-3 w-3 mr-1" /> Aprovar
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ============ Placeholder Chips ============

function PlaceholderChips({ content }: { content: string }) {
  const validKeys = ["NomeLead", "Empresa", "DorPrincipal", "Diferencial", "CTA"];
  const found = validKeys.filter((k) => content.includes(`[${k}]`));
  if (found.length === 0) return null;

  return (
    <div className="mt-2 flex flex-wrap gap-1">
      {found.map((k) => (
        <Badge key={k} variant="secondary" className="text-xs bg-primary/10 text-primary border-primary/20">
          [{k}]
        </Badge>
      ))}
    </div>
  );
}

// ============ Parse drafts from content ============

// BLOCK_ORDER is defined at the top of the file

function parseDrafts(content: string): Array<{ type: "text" | "draft"; content: string; blockType: string }> {
  const parts: Array<{ type: "text" | "draft"; content: string; blockType: string }> = [];
  let remaining = content;

  while (remaining.includes(DRAFT_START)) {
    const startIdx = remaining.indexOf(DRAFT_START);
    const endIdx = remaining.indexOf(DRAFT_END, startIdx);

    if (endIdx === -1) {
      parts.push({ type: "text", content: remaining, blockType: "geral" });
      return parts;
    }

    const before = remaining.slice(0, startIdx).trim();
    if (before) parts.push({ type: "text", content: before, blockType: "geral" });

    const rawDraft = remaining.slice(startIdx + DRAFT_START.length, endIdx).trim();
    const { blockType, cleanContent } = parseBlockType(rawDraft);
    if (cleanContent) parts.push({ type: "draft", content: cleanContent, blockType });

    remaining = remaining.slice(endIdx + DRAFT_END.length);
  }

  const leftover = remaining.trim();
  if (leftover) parts.push({ type: "text", content: leftover, blockType: "geral" });

  return parts;
}
