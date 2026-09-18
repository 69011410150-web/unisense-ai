import { MessageBubble } from "@/components/ChatBubble";
import { useAppState } from "@/context/AppStateContext";
import { useAskCampus } from "@/hooks/useQueries";
import { MOCK_AI_RECOMMENDATIONS } from "@/data/mockData";
import { cn } from "@/lib/utils";
import type { ChatMessage, RoutePlan } from "@/types";
import { Bot, CornerDownLeft, Eraser, TriangleAlert } from "lucide-react";
import {
  type FormEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const STARTER_QUESTIONS = MOCK_AI_RECOMMENDATIONS.map(({ question }) => question);

const GREETING_TITLE = "สวัสดีครับ ผมคือผู้ช่วย AI ของ UniSense AI";
const GREETING_BODY =
  "ถามเรื่องตารางเรียน อาคารเรียน เส้นทางเดิน หรือรถ EV ภายในมหาวิทยาลัยได้เลยครับ";

function createMessage(sender: ChatMessage["sender"], text: string, route?: RoutePlan): ChatMessage {
  return {
    id: `${sender}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    sender,
    text,
    route,
    createdAt: Date.now(),
  };
}

function TypingIndicator() {
  return (
    <output data-ocid="ai.typing_state" className="flex items-end gap-2.5" aria-live="polite">
      <span className="grid size-8 shrink-0 place-items-center rounded-full bg-gradient-primary text-primary-foreground shadow-soft">
        <Bot className="size-4" aria-hidden="true" />
      </span>
      <div className="flex items-center gap-1.5 rounded-2xl rounded-bl-md border border-border bg-card px-4 py-3 shadow-soft">
        <span className="sr-only">ผู้ช่วยกำลังพิมพ์คำตอบ</span>
        {[0, 1, 2].map((dot) => (
          <span key={dot} aria-hidden="true" className="size-1.5 animate-typing-dot rounded-full bg-muted-foreground" style={{ animationDelay: `${dot * 0.16}s` }} />
        ))}
      </div>
    </output>
  );
}

export function AiAssistant() {
  const { chat, appendMessage, clearChat, pendingQuestion, clearPendingQuestion } = useAppState();
  const askCampus = useAskCampus();
  const [draft, setDraft] = useState("");
  const [error, setError] = useState<string | null>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const consumedRef = useRef<string | null>(null);
  const { mutate: ask } = askCampus;
  const isThinking = askCampus.isPending;

  const send = useCallback((rawQuestion: string) => {
    const question = rawQuestion.trim();
    if (!question || isThinking) return;
    setError(null);
    appendMessage(createMessage("student", question));
    ask(question, {
      onSuccess: (answer) => appendMessage(createMessage("assistant", answer.answer, answer.route)),
      onError: () => setError("ขออภัยครับ ระบบตอบคำถามขัดข้องชั่วคราว กรุณาลองถามอีกครั้ง"),
    });
  }, [ask, isThinking, appendMessage]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const question = draft;
    setDraft("");
    send(question);
  };

  useEffect(() => {
    if (!pendingQuestion) return;
    if (consumedRef.current === pendingQuestion) {
      consumedRef.current = null;
      return;
    }
    consumedRef.current = pendingQuestion;
    clearPendingQuestion();
    send(pendingQuestion);
  }, [pendingQuestion, clearPendingQuestion, send]);

  const messageCount = chat.length;
  useEffect(() => {
    const node = scrollRef.current;
    if (!node) return;
    node.scrollTo({ top: node.scrollHeight, behavior: "smooth" });
  }, [messageCount, isThinking]);

  const handleClear = () => {
    clearChat();
    setError(null);
    inputRef.current?.focus();
  };
  const isEmpty = chat.length === 0 && !isThinking;

  return (
    <div data-ocid="ai.page" className="flex flex-col gap-4">
      <header className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h1 className="font-display text-xl font-bold tracking-tight text-foreground md:text-2xl">ผู้ช่วย AI</h1>
          <p className="mt-1 text-sm text-muted-foreground">ถามเรื่องตารางเรียน อาคารเรียน และเส้นทางในมหาวิทยาลัย</p>
        </div>
        {chat.length > 0 && <button type="button" data-ocid="ai.clear_button" onClick={handleClear} className="inline-flex min-h-[40px] shrink-0 items-center gap-1.5 rounded-full border border-border bg-card px-3.5 text-xs font-semibold text-muted-foreground shadow-soft transition-snappy hover:bg-muted"><Eraser className="size-3.5" aria-hidden="true" />เริ่มบทสนทนาใหม่</button>}
      </header>
      <section data-ocid="ai.conversation_panel" className="flex min-h-[60vh] flex-col overflow-hidden rounded-3xl border border-border bg-gradient-subtle shadow-elevated">
        <div ref={scrollRef} data-ocid="ai.message_list" className="flex-1 space-y-4 overflow-y-auto px-4 py-5 md:px-6">
          {isEmpty ? <div data-ocid="ai.empty_state" className="flex flex-col items-center gap-4 py-6 text-center"><span className="halo-primary grid size-14 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground"><Bot className="size-7" aria-hidden="true" /></span><div className="max-w-md space-y-1.5"><h2 className="font-display text-lg font-bold tracking-tight text-foreground">{GREETING_TITLE}</h2><p className="text-sm leading-relaxed text-muted-foreground">{GREETING_BODY}</p></div></div> : chat.map((message) => <MessageBubble key={message.id} message={message} />)}
          {isThinking && <TypingIndicator />}
          {error && <div data-ocid="ai.error_state" role="alert" className="flex items-start gap-2.5 rounded-2xl border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive"><TriangleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" /><p className="min-w-0 flex-1 leading-relaxed">{error}</p></div>}
        </div>
        <div className="border-t border-border bg-card/80 px-4 py-3.5 md:px-6"><p className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">คำแนะนำจาก AI</p><div data-ocid="ai.suggestions_list" className="flex flex-wrap gap-2">{STARTER_QUESTIONS.map((question, index) => <button key={question} type="button" data-ocid={`ai.suggestion.${index + 1}`} disabled={isThinking} onClick={() => send(question)} className="min-h-[36px] rounded-full border border-border bg-background px-3.5 py-1.5 text-left text-xs font-medium text-foreground shadow-soft transition-snappy hover:border-primary/40 hover:bg-primary/5 disabled:opacity-50">{question}</button>)}</div></div>
        <form onSubmit={handleSubmit} className="border-t border-border bg-card px-4 py-3.5 pb-safe md:px-6"><div className="flex items-end gap-2"><label htmlFor="ai-question" className="sr-only">พิมพ์คำถามถึงผู้ช่วย AI</label><input id="ai-question" ref={inputRef} data-ocid="ai.input" type="text" value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="พิมพ์คำถาม เช่น พรุ่งนี้ฉันต้องไปเรียนที่ไหนบ้าง" autoComplete="off" className="min-h-[48px] min-w-0 flex-1 rounded-2xl border border-input bg-background px-4 text-sm text-foreground shadow-soft outline-none transition-snappy placeholder:text-muted-foreground" /><button type="submit" data-ocid="ai.submit_button" disabled={isThinking || draft.trim().length === 0} aria-label="ส่งคำถาม" className={cn("grid size-12 shrink-0 place-items-center rounded-2xl bg-gradient-primary text-primary-foreground shadow-soft transition-snappy", "hover:shadow-elevated active:scale-[0.95]", "disabled:cursor-not-allowed disabled:opacity-45 disabled:shadow-none")}><CornerDownLeft className="size-5" aria-hidden="true" /></button></div><p className="mt-2 text-[11px] leading-relaxed text-muted-foreground">คำตอบสร้างจากข้อมูลจำลองของมหาวิทยาลัย เพื่อการสาธิตเท่านั้น</p></form>
      </section>
    </div>
  );
}
