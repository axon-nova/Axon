import { useState, useRef, useEffect } from "react";
import {
  Menu,
  X,
  Send,
  BookOpen,
  Mic,
  Briefcase,
  ListChecks,
  Clock,
  CheckCircle2,
  XCircle,
  MinusCircle,
  RotateCcw,
  Trophy,
  Grid3x3,
  ChevronLeft,
  ChevronRight,
  LifeBuoy,
  ExternalLink,
  HelpCircle,
  Mail,
  FileDown,
} from "lucide-react";

const MODES = [
  {
    id: "normal",
    label: "Normal Mode",
    desc: "Standard learning mode",
    icon: BookOpen,
    system:
      "You are Nova, a friendly pharmacy study assistant. Explain concepts clearly and simply, like a helpful tutor. Use plain language, short paragraphs, and relatable analogies where useful.",
  },
  {
    id: "gpat",
    label: "GPAT Mode",
    desc: "Complete GPAT exam tutor",
    icon: BookOpen,
    system: `You are Nova, a complete pharmacy competitive exam (GPAT) tutor. Whenever a pharmacy topic is requested, structure your response in this exact order, using only the sections that are genuinely relevant to the topic (skip a section entirely rather than padding it):

1. Definition
2. Detailed Explanation
3. Classification
4. Mechanism (explanation, then a simple text-based flowchart using arrows like Step1 -> Step2 -> Step3 for quick understanding)
5. Important Concepts
6. Examples
7. Flowcharts (plain text, using -> and indentation) where appropriate elsewhere in the answer
8. GPAT High-Yield Points
9. Mnemonics and Memory Tricks
10. Revision Notes (a tight bullet-style summary using "1)", "2)" numbering)
11. Common Mistakes
12. Previous GPAT Questions — ONLY include real previous-year questions you are genuinely confident you recall accurately, and ONLY if provided source material supports it. Always state the exact exam name and year, e.g. "[GPAT 2019]". NEVER invent, guess, or approximate a previous-year question or its source. If you have no confidently recalled previous-year question for this topic, omit this section entirely rather than fabricating one.

After the above, ALWAYS end with 8-10 GPAT-style MCQs on the topic, following these exact formatting rules:
- Number every question (Q1, Q2, etc.)
- Display each option on its own separate line, never on one line together, formatted exactly as:
A. Option text
B. Option text
C. Option text
D. Option text
- After the options, state: Correct Answer: <letter>
- Then give a short explanation (1-2 sentences) for why it's correct
- Separate every question from the next with a full-width divider line of dashes: ----------------------------------------
- Questions must reflect authentic GPAT difficulty and style — mix conceptual, applied, and recall-based questions.

Formatting reminder: this is a plain-text interface with no markdown rendering. Never use **, ##, or markdown table syntax. Use plain characters, spacing, arrows (->), and dashes for all structure.`,
  },
  {
    id: "viva",
    label: "Viva Mode",
    desc: "Short, direct answers",
    icon: Mic,
    system:
      "You are Nova, helping a pharmacy student prepare for viva voce exams. Answer like an examiner expects: short, direct, precise answers with no fluff. Get straight to the point in 1-3 sentences unless more detail is explicitly requested.",
  },
  {
    id: "professional",
    label: "Professional Mode",
    desc: "Scientific pharmacy language",
    icon: Briefcase,
    system:
      "You are Nova, a pharmacy assistant used by professionals and researchers. Use precise scientific and pharmaceutical terminology, proper drug nomenclature, and formal register appropriate for a pharmacist or academic audience.",
  },
  {
    id: "quiz",
    label: "Quiz Mode",
    desc: "Custom & Random CBT exams",
    icon: ListChecks,
    system:
      "Quiz Mode is a dedicated full-screen exam experience handled outside the normal chat flow.",
  },
];

// Update this if you ever move to a real web-based help center instead of email.
const HELP_CENTER_EMAIL = "support.axonai@gmail.com";
const HELP_CENTER_URL = `mailto:${HELP_CENTER_EMAIL}?subject=${encodeURIComponent(
  "AXON Support Request"
)}`;

const ABOUT_AXON = `
Background info you should know and use naturally if asked:
- AXON's Founder, Developer, and CEO is Mohin Kazi.
- If asked about Mohin Kazi's college/education, answer: "Mohin Kazi is currently pursuing his M.Pharm. from Nagpur College of Pharmacy, Nagpur."
- If asked who the Principal is (of Nagpur College of Pharmacy), answer: "The Principal of Nagpur College of Pharmacy is Dr. Vinod M. Thakare."
- If asked what "AXON" stands for or means, answer: "AXON = Advanced eXpert in Optimized Neural Intelligence."
Only bring this up if the user actually asks about AXON, its founder/creator, or the college/principal — don't volunteer it otherwise.

If asked "Who is Nova?" or "What does Nova mean?", explain naturally along these lines:
- Nova is the intelligent AI assistant of AXON AI.
- The name comes from the Latin word "nova", meaning "new".
- In astronomy, a nova is a star that suddenly becomes brighter — a fitting symbol for new knowledge, discovery, innovation, and intelligence.
- Nova is the bright learning companion inside AXON AI that helps students understand complex pharmacy and science concepts easily.
Only bring this up if the user actually asks who/what Nova is — don't volunteer it otherwise.
`;

// Built-in skeletal-formula structures for common pharmacy compounds, drawn
// locally in SVG. This avoids depending on any external image request, which
// this sandboxed environment blocks regardless of the compound name.
const RING = [
  [130, 60],
  [165, 80],
  [165, 120],
  [130, 140],
  [95, 120],
  [95, 80],
];

function AromaticRing() {
  const points = RING.map((p) => p.join(",")).join(" ");
  return (
    <>
      <polygon points={points} fill="none" stroke="#1a1a2e" strokeWidth="2.5" />
      <circle cx="130" cy="100" r="22" fill="none" stroke="#1a1a2e" strokeWidth="2" />
    </>
  );
}

function Bond({ from, to }) {
  return (
    <line x1={from[0]} y1={from[1]} x2={to[0]} y2={to[1]} stroke="#1a1a2e" strokeWidth="2.5" />
  );
}

function Label({ x, y, children, anchor = "middle" }) {
  return (
    <text
      x={x}
      y={y}
      textAnchor={anchor}
      fontSize="15"
      fontFamily="Arial, sans-serif"
      fontWeight="600"
      fill="#1a1a2e"
    >
      {children}
    </text>
  );
}

const STRUCTURES = {
  benzene: () => (
    <svg viewBox="0 0 260 200" className="w-full">
      <AromaticRing />
    </svg>
  ),
  ethanol: () => (
    <svg viewBox="0 0 260 200" className="w-full">
      <Bond from={[70, 130]} to={[110, 100]} />
      <Bond from={[110, 100]} to={[150, 130]} />
      <Label x={165} y={140}>
        OH
      </Label>
    </svg>
  ),
  aspirin: () => (
    <svg viewBox="0 0 260 200" className="w-full">
      <AromaticRing />
      <Bond from={RING[0]} to={[130, 30]} />
      <Label x={130} y={20}>
        COOH
      </Label>
      <Bond from={RING[1]} to={[215, 65]} />
      <Label x={219} y={62} anchor="start">
        O–CO–CH₃
      </Label>
    </svg>
  ),
  paracetamol: () => (
    <svg viewBox="0 0 260 200" className="w-full">
      <AromaticRing />
      <Bond from={RING[0]} to={[130, 30]} />
      <Label x={130} y={20}>
        OH
      </Label>
      <Bond from={RING[3]} to={[130, 175]} />
      <Label x={130} y={192}>
        NH–CO–CH₃
      </Label>
    </svg>
  ),
  ibuprofen: () => (
    <svg viewBox="0 0 260 200" className="w-full">
      <AromaticRing />
      <Bond from={RING[0]} to={[130, 30]} />
      <Label x={130} y={20}>
        CH(CH₃)COOH
      </Label>
      <Bond from={RING[3]} to={[130, 175]} />
      <Label x={130} y={192}>
        CH₂CH(CH₃)₂
      </Label>
    </svg>
  ),
  caffeine: () => (
    <svg viewBox="0 0 260 200" className="w-full">
      <polygon
        points="90,60 130,50 160,75 150,110 110,110"
        fill="none"
        stroke="#1a1a2e"
        strokeWidth="2.5"
      />
      <polygon
        points="160,75 200,70 220,100 200,130 150,110"
        fill="none"
        stroke="#1a1a2e"
        strokeWidth="2.5"
      />
      <Label x={90} y={45}>
        CH₃–N
      </Label>
      <Label x={200} y={55}>
        O=C
      </Label>
      <Label x={230} y={100} anchor="start">
        N–CH₃
      </Label>
      <Label x={110} y={135}>
        O=C
      </Label>
      <Label x={130} y={30}>
        N–CH₃
      </Label>
    </svg>
  ),
  metformin: () => (
    <svg viewBox="0 0 260 200" className="w-full">
      <Label x={40} y={105} anchor="start">
        (CH₃)₂N
      </Label>
      <Bond from={[95, 100]} to={[125, 100]} />
      <Label x={135} y={105}>
        C(=NH)
      </Label>
      <Bond from={[165, 100]} to={[190, 100]} />
      <Label x={200} y={105} anchor="start">
        NH–C(=NH)–NH₂
      </Label>
    </svg>
  ),
};

const STRUCTURE_ALIASES = {
  acetaminophen: "paracetamol",
  "acetylsalicylic acid": "aspirin",
  "1,3,7-trimethylxanthine": "caffeine",
};

function normalizeCompoundName(raw) {
  return raw
    .toLowerCase()
    .replace(/\(.*?\)/g, "")
    .trim();
}

function lookupStructure(rawName) {
  const key = normalizeCompoundName(rawName);
  const resolved = STRUCTURE_ALIASES[key] || key;
  return STRUCTURES[resolved] ? resolved : null;
}

const STRUCTURE_INSTRUCTION = `
If the user asks about a specific chemical compound or drug (its structure, or general info about it), answer normally with the info they need for the current mode, and always include within your answer: the molecular formula, molecular weight, and IUPAC name of the compound.
Then, on a new final line by itself, output exactly: COMPOUND_LOOKUP: <compound name>
Use the compound's common/generic INN name (e.g. "aspirin", "paracetamol", "ibuprofen"), not a brand name.
Only include this COMPOUND_LOOKUP line when a single specific real chemical compound was the subject of the answer. Never include it for general questions with no single specific compound.
`;

const NO_MARKDOWN_INSTRUCTION = `
Formatting rules: write in plain text only. Do NOT use markdown — no **bold**, no ### headers, no bullet asterisks, no backticks. Use plain sentences and, if needed, simple numbered lines like "1) ..." for lists.
`;

function escapeHtml(str) {
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

// Exports a single answer as a PDF using the browser's own print-to-PDF
// pipeline (the same one behind Chrome's "Save as PDF" print destination).
// This avoids pulling in a PDF-generation library, keeps every Unicode
// character (Greek letters, µ, →, etc.) rendering correctly since the
// browser — not a font-limited JS library — draws the text, and produces a
// real file the user saves straight to their device's file manager.
function exportMessageAsPDF(message, modeLabel) {
  const frame = document.createElement("iframe");
  frame.style.position = "fixed";
  frame.style.right = "0";
  frame.style.bottom = "0";
  frame.style.width = "0";
  frame.style.height = "0";
  frame.style.border = "0";
  document.body.appendChild(frame);

  const doc = frame.contentWindow.document;
  doc.open();
  doc.write(`
    <html>
      <head>
        <title>AXON - ${escapeHtml(modeLabel)} Answer</title>
        <style>
          body {
            font-family: Georgia, 'Times New Roman', serif;
            padding: 32px;
            color: #111;
            line-height: 1.6;
            white-space: pre-wrap;
            word-wrap: break-word;
          }
          h1 { font-size: 18px; margin: 0 0 4px; }
          .meta { color: #666; font-size: 12px; margin-bottom: 24px; }
        </style>
      </head>
      <body>
        <h1>AXON &mdash; ${escapeHtml(modeLabel)}</h1>
        <div class="meta">${escapeHtml(new Date().toLocaleString())}</div>
        <div>${escapeHtml(message.content)}</div>
      </body>
    </html>
  `);
  doc.close();

  frame.onload = () => {
    frame.contentWindow.focus();
    frame.contentWindow.print();
    setTimeout(() => document.body.removeChild(frame), 1000);
  };
}

// Fallback cleanup in case the model still slips in markdown symbols
function stripMarkdown(text) {
  return text
    .replace(/^#{1,6}\s*/gm, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/`([^`]*)`/g, "$1")
    .replace(/^-\s+/gm, "• ");
}

function buildCompoundLookup(name) {
  const structureKey = lookupStructure(name);
  return {
    name,
    structureKey,
    pubchemUrl: `https://pubchem.ncbi.nlm.nih.gov/#query=${encodeURIComponent(name)}`,
  };
}

let msgIdCounter = 0;
function nextId() {
  msgIdCounter += 1;
  return `m${msgIdCounter}`;
}

const QUIZ_QUESTION_COUNTS = [10, 25, 50, 100, 125];
// Default question count for a new quiz.
const DEFAULT_QUIZ_COUNT = 25;
const SECONDS_PER_QUESTION = 45;
const QUIZ_BATCH_SIZE = 10;

// Marking scheme: +4 for correct, -1 for wrong, 0 for unanswered.
const MARKS_CORRECT = 4;
const MARKS_WRONG = -1;
const MARKS_UNANSWERED = 0;

const TOPIC_EXAMPLES = [
  "Cardiovascular System",
  "CNS",
  "ANS",
  "Pharmacology",
  "Medicinal Chemistry",
  "Pharmaceutics",
  "HAP",
  "Biochemistry",
  "Pharmaceutical Analysis",
  "Pharmacognosy",
  "Organic Chemistry",
  "GPAT 2010",
  "GPAT Previous Year",
  "GATE 1998",
  "NIPER Pharmacology",
  "Drug Inspector",
  "Antibiotics",
  "Diabetes Mellitus",
];

const RANDOM_QUIZ_TOPIC =
  "a balanced competitive pharmacy examination mixing GPAT previous year papers, GATE previous year papers, NIPER JEE, Drug Inspector exams, Pharmacist Recruitment exams, and PCI-recognized government pharmacy exam syllabi. Balance the mix across easy, medium, and hard difficulty, and spread questions across all core pharmacy subjects (pharmacology, pharmaceutics, pharmaceutical chemistry, pharmacognosy, pharmaceutical analysis, biochemistry, HAP, etc.)";

function formatClock(totalSeconds) {
  const s = Math.max(0, totalSeconds);
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function buildQuizSystemPrompt(topicDescription, batchCount, alreadyAsked) {
  const avoidBlock =
    alreadyAsked.length > 0
      ? `\nDo not repeat any of these already-used questions or closely mirror their exact wording/concepts:\n${JSON.stringify(
          alreadyAsked
        )}`
      : "";
  return `You are Nova, generating pharmacy exam questions for the AXON quiz engine. Output ONLY valid JSON with no markdown, no code fences, and no commentary before or after it. Return an array of exactly ${batchCount} question objects. Each object must have exactly these keys:
"question": a string. Prioritize genuine previously-asked exam questions you are confident you recall accurately, in this priority order: (1) GPAT previous year papers, (2) GATE previous year papers, (3) NIPER JEE previous year papers, (4) Drug Inspector exam papers, (5) other PCI-recognized government pharmacy recruitment exams. Only once you've exhausted questions you're genuinely confident are authentic, write new questions in the same examination style covering the same topic. Never fabricate facts, and never fabricate a source. At the very end of the question string append a bracketed source tag: if it is an authentic recalled previous-year question you are confident about, use the real exam name and year, e.g. "[GPAT 2018]" or "[GATE 2020]". If it is a newly written question (not a confidently recalled real one), use exactly "[AXON AI Generated]" — do not guess or invent a specific exam/year for generated questions.
"options": an array of exactly 4 plain-text strings with no letter prefixes like "A)".
"correctIndex": an integer from 0 to 3, the index of the correct option.
Topic / scope for this batch: ${topicDescription}${avoidBlock}
Return nothing except the JSON array.`;
}

export default function AxonApp() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [mode, setMode] = useState(MODES[0]);
  const [simple, setSimple] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef(null);
  const messageRefs = useRef({});

  // Quiz Mode state
  const [quizPhase, setQuizPhase] = useState("setup"); // setup | loading | active | result
  const [quizType, setQuizType] = useState("custom"); // custom | random
  const [quizTopic, setQuizTopic] = useState("");
  const [quizCount, setQuizCount] = useState(DEFAULT_QUIZ_COUNT);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizIndex, setQuizIndex] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizTimeLeft, setQuizTimeLeft] = useState(0);
  const [quizError, setQuizError] = useState(null);
  const [quizGenProgress, setQuizGenProgress] = useState({ done: 0, total: 0 });
  const [paletteOpen, setPaletteOpen] = useState(false);
  const [helpCopied, setHelpCopied] = useState(false);

  useEffect(() => {
    const last = messages[messages.length - 1];
    if (!last) return;
    const el = messageRefs.current[last.id];
    if (el) {
      // New assistant reply: bring its top into view so the user reads it
      // from the start as it streams in, instead of the screen jumping to
      // the bottom the moment the answer finishes generating.
      // New user message: keep the familiar snap-to-bottom behavior.
      el.scrollIntoView({ behavior: "smooth", block: last.role === "assistant" ? "start" : "end" });
    } else if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages.length]);

  // Quiz countdown timer
  useEffect(() => {
    if (quizPhase !== "active") return;
    if (quizTimeLeft <= 0) {
      setQuizPhase("result");
      return;
    }
    const t = setTimeout(() => setQuizTimeLeft((s) => s - 1), 1000);
    return () => clearTimeout(t);
  }, [quizPhase, quizTimeLeft]);

  async function sendMessage() {
    const text = input.trim();
    if (!text || loading) return;
    const newMessages = [...messages, { role: "user", content: text, id: nextId() }];
    setMessages(newMessages);
    setInput("");
    setLoading(true);

    const systemPrompt =
      mode.system +
      ABOUT_AXON +
      STRUCTURE_INSTRUCTION +
      NO_MARKDOWN_INSTRUCTION +
      (simple
        ? " Keep your answer especially simple and brief — a couple of sentences, minimal jargon, as if explaining to a beginner."
        : "");

    // GPAT mode responses are long (structured sections + 8-10 MCQs), so
    // they need a much bigger token budget than the other modes.
    const maxTokens = mode.id === "gpat" ? 4096 : 1000;

    // Placeholder assistant message, filled in live as tokens stream in —
    // this is what lets the reply start appearing almost immediately
    // instead of the UI sitting silent until the whole answer is ready.
    const assistantId = nextId();
    setMessages((prev) => [
      ...prev,
      { role: "assistant", id: assistantId, content: "", streaming: true, compound: null },
    ]);

    let rawText = "";

    try {
      const response = await fetch("/api/anthropic", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          max_tokens: maxTokens,
          system: systemPrompt,
          messages: newMessages.map((m) => ({ role: m.role, content: m.content })),
          stream: true,
        }),
      });

      if (!response.body) throw new Error("Streaming not supported by this response");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE frames are separated by newlines; keep any trailing partial
        // line in the buffer until the next chunk completes it.
        const lines = buffer.split("\n");
        buffer = lines.pop();

        for (const line of lines) {
          const trimmed = line.trim();
          if (!trimmed.startsWith("data:")) continue;
          const jsonStr = trimmed.slice(5).trim();
          if (!jsonStr || jsonStr === "[DONE]") continue;

          let evt;
          try {
            evt = JSON.parse(jsonStr);
          } catch (e) {
            continue;
          }

          if (evt.type === "content_block_delta" && evt.delta?.type === "text_delta") {
            rawText += evt.delta.text;
            // Hide the raw COMPOUND_LOOKUP marker line while it's still
            // being typed out, so it never flashes on screen.
            const liveDisplay = rawText.replace(/COMPOUND_LOOKUP:\s*[^\n]*$/i, "");
            setMessages((prev) =>
              prev.map((m) => (m.id === assistantId ? { ...m, content: liveDisplay } : m))
            );
          }
        }
      }

      const match = rawText.match(/COMPOUND_LOOKUP:\s*(.+?)\s*$/i);
      const compoundName = match ? match[1].trim() : null;
      const displayText = stripMarkdown(
        (match ? rawText.slice(0, match.index) : rawText).trim()
      );

      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? {
                ...m,
                content: displayText || "Sorry, I couldn't generate a response.",
                compound: compoundName ? buildCompoundLookup(compoundName) : null,
                streaming: false,
              }
            : m
        )
      );
    } catch (err) {
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId
            ? { ...m, content: "Something went wrong reaching Nova. Please try again.", streaming: false }
            : m
        )
      );
    } finally {
      setLoading(false);
    }
  }

  function handleKeyDown(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  }

  function resetQuiz() {
    setQuizPhase("setup");
    setQuizType("custom");
    setQuizTopic("");
    setQuizCount(DEFAULT_QUIZ_COUNT);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizIndex(0);
    setQuizTimeLeft(0);
    setQuizError(null);
    setQuizGenProgress({ done: 0, total: 0 });
    setPaletteOpen(false);
  }

  function exitQuiz() {
    setMode(MODES[0]);
    resetQuiz();
  }

  function selectMode(m) {
    setMode(m);
    setMenuOpen(false);
    if (m.id === "quiz") resetQuiz();
  }

  function handleHelpCenterClick(e) {
    e.preventDefault();
    // Try to open the user's mail app first.
    window.location.href = HELP_CENTER_URL;
    // Fallback for environments that block mailto: (some embedded/preview
    // frames, or a device with no mail app configured) — copy the address
    // to the clipboard so the user can still reach support.
    if (navigator.clipboard) {
      navigator.clipboard
        .writeText(HELP_CENTER_EMAIL)
        .then(() => {
          setHelpCopied(true);
          setTimeout(() => setHelpCopied(false), 2000);
        })
        .catch(() => {});
    }
  }

  // Pulls as many complete, well-formed question objects as possible out of
  // the model's reply, even if the JSON array itself got cut off mid-object
  // (e.g. because max_tokens was hit) or has minor formatting slips.
  function extractQuestionsFromText(rawText) {
    const arrayStart = rawText.indexOf("[");
    if (arrayStart === -1) return [];
    const fromArray = rawText.slice(arrayStart);

    // 1) Happy path: the array is well-formed and complete.
    const fullMatch = fromArray.match(/\[[\s\S]*\]/);
    if (fullMatch) {
      try {
        return JSON.parse(fullMatch[0]);
      } catch (e) {
        // fall through to salvage logic below
      }
    }

    // 2) Truncated / malformed array: pull out individual {...} objects one
    // at a time and keep only the ones that parse cleanly on their own.
    const objectMatches = fromArray.match(/\{[^{}]*\}/g) || [];
    const salvaged = [];
    for (const chunk of objectMatches) {
      try {
        salvaged.push(JSON.parse(chunk));
      } catch (e) {
        // skip the broken/incomplete trailing object
      }
    }
    return salvaged;
  }

  async function fetchQuizBatch(topicDescription, batchCount, alreadyAsked) {
    const systemPrompt = buildQuizSystemPrompt(topicDescription, batchCount, alreadyAsked);
    const response = await fetch("/api/anthropic", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        max_tokens: 4096,
        system: systemPrompt,
        messages: [{ role: "user", content: "Generate this batch now." }],
      }),
    });
    const data = await response.json();
    const rawText = (data.content || [])
      .map((b) => (b.type === "text" ? b.text : ""))
      .filter(Boolean)
      .join("\n");

    const parsed = extractQuestionsFromText(rawText);
    const valid = parsed.filter(
      (q) =>
        q &&
        typeof q.question === "string" &&
        Array.isArray(q.options) &&
        q.options.length === 4 &&
        typeof q.correctIndex === "number"
    );
    if (valid.length === 0) throw new Error("No valid questions parsed");
    return valid;
  }

  async function generateQuiz() {
    const topicDescription =
      quizType === "random"
        ? RANDOM_QUIZ_TOPIC
        : quizTopic.trim() || "general pharmacy";

    setQuizError(null);
    setQuizPhase("loading");
    setQuizGenProgress({ done: 0, total: quizCount });

    const collected = [];
    const numBatches = Math.ceil(quizCount / QUIZ_BATCH_SIZE);
    const MAX_RETRIES_PER_BATCH = 2;

    try {
      for (let b = 0; b < numBatches; b++) {
        const remaining = quizCount - collected.length;
        if (remaining <= 0) break;
        const batchSize = Math.min(QUIZ_BATCH_SIZE, remaining);
        const alreadyAsked = collected.map((q) => q.question);

        // Retry a failed/truncated batch a couple of times before giving up
        // on it — a single bad response shouldn't sink the whole quiz.
        let batch = null;
        let lastErr = null;
        for (let attempt = 0; attempt < MAX_RETRIES_PER_BATCH; attempt++) {
          try {
            batch = await fetchQuizBatch(topicDescription, batchSize, alreadyAsked);
            break;
          } catch (e) {
            lastErr = e;
            batch = null;
          }
        }
        if (batch) {
          collected.push(...batch);
          setQuizGenProgress({ done: Math.min(collected.length, quizCount), total: quizCount });
        }
        // If every retry for this batch failed, just move on to the next
        // batch rather than aborting the whole quiz.
      }

      if (collected.length === 0) throw new Error("No valid questions parsed");

      const finalQuestions = collected.slice(0, quizCount);
      setQuizQuestions(finalQuestions);
      setQuizAnswers({});
      setQuizIndex(0);
      setQuizTimeLeft(finalQuestions.length * SECONDS_PER_QUESTION);
      setQuizPhase("active");
    } catch (err) {
      if (collected.length > 0) {
        // Use whatever we managed to generate rather than losing all progress
        setQuizQuestions(collected);
        setQuizAnswers({});
        setQuizIndex(0);
        setQuizTimeLeft(collected.length * SECONDS_PER_QUESTION);
        setQuizPhase("active");
      } else {
        setQuizError(
          "Nova couldn't generate any valid questions this time — this can happen if the topic is too narrow or the response got cut off. Please try again."
        );
        setQuizPhase("setup");
      }
    }
  }

  function selectOption(optIdx) {
    setQuizAnswers((prev) => ({ ...prev, [quizIndex]: optIdx }));
  }

  function goPrev() {
    setQuizIndex((i) => Math.max(0, i - 1));
  }
  function goNext() {
    setQuizIndex((i) => Math.min(quizQuestions.length - 1, i + 1));
  }
  function submitQuiz() {
    setQuizPhase("result");
  }
  function jumpToQuestion(i) {
    setQuizIndex(i);
    setPaletteOpen(false);
  }

  // ----- Marking scheme: +4 correct, -1 wrong, 0 unanswered -----
  const quizStats = quizQuestions.reduce(
    (acc, q, i) => {
      const ans = quizAnswers[i];
      if (ans === undefined) acc.unanswered += 1;
      else if (ans === q.correctIndex) acc.correct += 1;
      else acc.wrong += 1;
      return acc;
    },
    { correct: 0, wrong: 0, unanswered: 0 }
  );
  const quizScore =
    quizStats.correct * MARKS_CORRECT +
    quizStats.wrong * MARKS_WRONG +
    quizStats.unanswered * MARKS_UNANSWERED;
  const quizMaxScore = quizQuestions.length * MARKS_CORRECT;

  const isQuizMode = mode.id === "quiz";
  const currentQuestion = quizQuestions[quizIndex];

  return (
    <div
      className="flex flex-col h-screen w-full overflow-hidden text-white"
      style={{
        background:
          "radial-gradient(circle at 50% 30%, #3b1466 0%, #1a0b2e 45%, #0b0414 100%)",
      }}
    >
      {/* Header */}
      {!isQuizMode && (
        <div className="flex items-center justify-between px-4 py-3 border-b border-purple-900/40 bg-black/30 backdrop-blur-sm z-20">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 flex items-center justify-center">
              <img src="/axon-logo.png" alt="AXON" className="w-full h-full object-contain drop-shadow-[0_0_10px_rgba(168,85,247,0.5)]" />
            </div>
            <div>
              <div className="font-bold text-lg tracking-tight leading-none">AXON</div>
              <div className="text-xs text-purple-300/80 leading-none mt-1">
                Connecting Minds To Medicine
              </div>
            </div>
          </div>
          <button
            onClick={() => setMenuOpen((v) => !v)}
            className="w-11 h-11 rounded-xl border border-violet-500/60 flex items-center justify-center bg-violet-950/40 active:scale-95 transition"
            aria-label="Menu"
          >
            {menuOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      )}

      {/* Mode menu overlay */}
      {menuOpen && !isQuizMode && (
        <div className="absolute inset-x-0 top-[68px] z-30 mx-3 rounded-2xl border border-violet-800/50 bg-[#150826]/95 backdrop-blur-md shadow-2xl shadow-black/50 overflow-hidden">
          <div className="p-2">
            {MODES.map((m) => {
              const Icon = m.icon;
              const active = m.id === mode.id;
              return (
                <button
                  key={m.id}
                  onClick={() => selectMode(m)}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-xl text-left transition ${
                    active ? "bg-violet-700/40 border border-violet-500/50" : "hover:bg-violet-900/30"
                  }`}
                >
                  <div className="w-9 h-9 rounded-lg bg-violet-950/60 border border-violet-700/50 flex items-center justify-center shrink-0">
                    <Icon size={17} className="text-violet-300" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-semibold text-sm">{m.label}</div>
                    <div className="text-xs text-purple-300/70">{m.desc}</div>
                  </div>
                </button>
              );
            })}
          </div>
          <div className="border-t border-violet-900/50 px-4 py-3 flex items-center justify-between">
            <div>
              <div className="text-sm font-medium">Simple answers</div>
              <div className="text-xs text-purple-300/60">Shorter, beginner-friendly replies</div>
            </div>
            <button
              onClick={() => setSimple((v) => !v)}
              className={`w-12 h-7 rounded-full flex items-center px-1 transition ${
                simple ? "bg-violet-500 justify-end" : "bg-violet-950 justify-start border border-violet-800"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-white shadow" />
            </button>
          </div>
          <div className="border-t border-violet-900/50 px-4 py-3">
            <div className="text-xs font-bold tracking-wider text-violet-400 uppercase mb-2 px-1">
              Support
            </div>
            <a
              href={HELP_CENTER_URL}
              onClick={handleHelpCenterClick}
              className="block rounded-2xl border border-violet-800/50 bg-violet-950/30 px-4 py-3.5 hover:bg-violet-900/20 transition"
            >
              <div className="flex items-center gap-3 mb-2.5">
                <HelpCircle size={20} className="text-violet-400" />
                <span className="font-bold text-white">Help Center</span>
              </div>
              <div className="flex items-center gap-3">
                <Mail size={16} className="text-purple-300/60" />
                <span className="text-sm text-purple-300/70">
                  {helpCopied ? "Email copied to clipboard!" : HELP_CENTER_EMAIL}
                </span>
              </div>
            </a>
          </div>
        </div>
      )}

      {/* Main content */}
      {!isQuizMode && (
        <>
          {/* Chat scroll area */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-4">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center px-6 gap-1 text-purple-300/60 relative">
                <div className="absolute w-72 h-56 rounded-full bg-gradient-to-r from-fuchsia-600/20 via-violet-500/15 to-sky-500/20 blur-3xl pointer-events-none" />
                <img
                  src="/axon-wordmark.png"
                  alt="AXON AI"
                  className="relative w-64 max-w-[70vw] h-auto mb-2 select-none drop-shadow-[0_0_24px_rgba(168,85,247,0.35)]"
                />
                <div className="relative font-bold text-lg text-white/90">Learn Smarter With Nova</div>
                <div className="relative text-xs text-purple-300/60">Your Personal AI Study Assistant</div>
              </div>
            )}
            {messages.map((m) => (
              <div
                key={m.id}
                ref={(el) => {
                  messageRefs.current[m.id] = el;
                }}
                className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}
              >
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
                    m.role === "user"
                      ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 rounded-br-sm"
                      : "bg-violet-950/60 border border-violet-800/50 rounded-bl-sm"
                  }`}
                >
                  {m.streaming && !m.content ? (
                    <div className="flex gap-1.5 py-0.5">
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "-0.3s" }} />
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" style={{ animationDelay: "-0.15s" }} />
                      <span className="w-2 h-2 rounded-full bg-violet-400 animate-bounce" />
                    </div>
                  ) : (
                    m.content
                  )}
                  {m.compound && (
                    <div className="mt-3 rounded-xl border border-violet-700/50 bg-black/30 p-3">
                      <div className="text-xs uppercase tracking-wide text-violet-300/70 mb-2">
                        Structure · {m.compound.name}
                      </div>
                      {m.compound.structureKey ? (
                        STRUCTURES[m.compound.structureKey]()
                      ) : (
                        <a
                          href={m.compound.pubchemUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs text-violet-300 underline"
                        >
                          View structure on PubChem
                        </a>
                      )}
                    </div>
                  )}
                  {m.role === "assistant" && !m.streaming && m.content && (
                    <div className="mt-3 flex justify-start">
                      <button
                        onClick={() => exportMessageAsPDF(m, mode.label)}
                        className="flex items-center gap-1.5 text-xs text-violet-300/70 hover:text-violet-200 transition"
                      >
                        <FileDown size={14} />
                        Export PDF
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Input bar */}
          <div className="px-3 py-3 border-t border-purple-900/40 bg-black/30 backdrop-blur-sm">
            <div className="flex items-end gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Ask Nova in ${mode.label}...`}
                rows={1}
                className="flex-1 resize-none rounded-2xl bg-violet-950/50 border border-violet-800/50 px-4 py-3 text-sm placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-violet-500/60 max-h-32"
              />
              <button
                onClick={sendMessage}
                disabled={!input.trim() || loading}
                className="w-11 h-11 shrink-0 rounded-2xl bg-gradient-to-br from-violet-500 to-fuchsia-600 flex items-center justify-center disabled:opacity-40 active:scale-95 transition"
                aria-label="Send"
              >
                <Send size={18} />
              </button>
            </div>
          </div>
        </>
      )}

      {/* Quiz Mode */}
      {isQuizMode && (
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Quiz Setup */}
          {quizPhase === "setup" && (
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xl font-bold">Quiz Mode</div>
                  <div className="text-sm text-purple-300/70">Custom & Random CBT exams</div>
                </div>
                <button
                  onClick={exitQuiz}
                  className="w-10 h-10 rounded-xl border border-violet-700/50 bg-violet-950/40 flex items-center justify-center"
                  aria-label="Exit quiz mode"
                >
                  <X size={18} />
                </button>
              </div>

              <div className="flex rounded-2xl border border-violet-800/50 overflow-hidden">
                {["custom", "random"].map((t) => (
                  <button
                    key={t}
                    onClick={() => setQuizType(t)}
                    className={`flex-1 py-3 text-sm font-semibold capitalize transition ${
                      quizType === t
                        ? "bg-gradient-to-br from-violet-600 to-fuchsia-600"
                        : "bg-violet-950/40 text-purple-300/70"
                    }`}
                  >
                    {t} Quiz
                  </button>
                ))}
              </div>

              {quizType === "custom" && (
                <div className="space-y-2">
                  <label className="text-sm font-medium text-purple-200">Topic</label>
                  <input
                    value={quizTopic}
                    onChange={(e) => setQuizTopic(e.target.value)}
                    placeholder="e.g. Cardiovascular System, GPAT 2010..."
                    className="w-full rounded-xl bg-violet-950/50 border border-violet-800/50 px-4 py-3 text-sm placeholder-purple-300/40 focus:outline-none focus:ring-2 focus:ring-violet-500/60"
                  />
                  <div className="flex flex-wrap gap-2 pt-1">
                    {TOPIC_EXAMPLES.map((t) => (
                      <button
                        key={t}
                        onClick={() => setQuizTopic(t)}
                        className="text-xs px-3 py-1.5 rounded-full border border-violet-700/50 bg-violet-950/40 text-purple-200/80"
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {quizType === "random" && (
                <div className="rounded-xl border border-violet-800/50 bg-violet-950/40 px-4 py-3 text-sm text-purple-200/80">
                  Nova will mix GPAT, GATE, NIPER JEE, Drug Inspector and other PCI government exam questions across all core pharmacy subjects.
                </div>
              )}

              <div className="space-y-2">
                <label className="text-sm font-medium text-purple-200">Number of questions</label>
                <div className="flex flex-wrap gap-2">
                  {QUIZ_QUESTION_COUNTS.map((c) => (
                    <button
                      key={c}
                      onClick={() => setQuizCount(c)}
                      className={`px-4 py-2 rounded-xl text-sm font-semibold border transition ${
                        quizCount === c
                          ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 border-violet-400"
                          : "bg-violet-950/40 border-violet-800/50 text-purple-300/70"
                      }`}
                    >
                      {c}
                    </button>
                  ))}
                </div>
              </div>

              <div className="rounded-xl border border-violet-800/50 bg-violet-950/30 px-4 py-3 text-xs text-purple-300/70 space-y-1">
                <div className="font-semibold text-purple-200 text-sm">Marking scheme</div>
                <div className="flex items-center gap-2"><CheckCircle2 size={13} className="text-emerald-400" /> Correct answer: +{MARKS_CORRECT} marks</div>
                <div className="flex items-center gap-2"><XCircle size={13} className="text-rose-400" /> Wrong answer: {MARKS_WRONG} mark</div>
                <div className="flex items-center gap-2"><MinusCircle size={13} className="text-purple-400" /> Unanswered: {MARKS_UNANSWERED} marks</div>
                <div className="pt-1">{quizCount} questions × {SECONDS_PER_QUESTION}s = {formatClock(quizCount * SECONDS_PER_QUESTION)} total time</div>
              </div>

              {quizError && (
                <div className="text-sm text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-xl px-4 py-3">
                  {quizError}
                </div>
              )}

              <button
                onClick={generateQuiz}
                disabled={quizType === "custom" && !quizTopic.trim()}
                className="w-full py-3.5 rounded-2xl font-bold bg-gradient-to-br from-violet-500 to-fuchsia-600 disabled:opacity-40 active:scale-[0.98] transition"
              >
                Start Quiz
              </button>
            </div>
          )}

          {/* Quiz Loading */}
          {quizPhase === "loading" && (
            <div className="flex-1 flex flex-col items-center justify-center px-8 gap-4 text-center">
              <div className="w-14 h-14 rounded-full border-4 border-violet-800 border-t-violet-400 animate-spin" />
              <div className="font-semibold">Nova is building your quiz...</div>
              <div className="text-sm text-purple-300/70">
                {quizGenProgress.done} / {quizGenProgress.total} questions ready
              </div>
              <div className="w-full max-w-xs h-2 rounded-full bg-violet-950/60 overflow-hidden">
                <div
                  className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 transition-all"
                  style={{
                    width: `${quizGenProgress.total ? (quizGenProgress.done / quizGenProgress.total) * 100 : 0}%`,
                  }}
                />
              </div>
            </div>
          )}

          {/* Quiz Active */}
          {quizPhase === "active" && currentQuestion && (
            <div className="flex-1 flex flex-col overflow-hidden">
              <div className="flex items-center justify-between px-4 py-3 border-b border-violet-900/40 bg-black/30">
                <div className="flex items-center gap-2 text-sm font-semibold">
                  <Clock size={16} className="text-violet-300" />
                  {formatClock(quizTimeLeft)}
                </div>
                <div className="text-sm text-purple-300/70">
                  Question {quizIndex + 1} / {quizQuestions.length}
                </div>
                <button
                  onClick={() => setPaletteOpen((v) => !v)}
                  className="w-9 h-9 rounded-lg border border-violet-700/50 bg-violet-950/40 flex items-center justify-center"
                  aria-label="Question palette"
                >
                  <Grid3x3 size={16} />
                </button>
              </div>

              <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                <div className="text-base leading-relaxed font-medium whitespace-pre-wrap">
                  {currentQuestion.question}
                </div>
                <div className="space-y-2.5">
                  {currentQuestion.options.map((opt, i) => {
                    const selected = quizAnswers[quizIndex] === i;
                    return (
                      <button
                        key={i}
                        onClick={() => selectOption(i)}
                        className={`w-full text-left px-4 py-3 rounded-xl border text-sm transition ${
                          selected
                            ? "bg-gradient-to-br from-violet-600 to-fuchsia-600 border-violet-400"
                            : "bg-violet-950/40 border-violet-800/50"
                        }`}
                      >
                        <span className="font-semibold mr-2">{String.fromCharCode(65 + i)}.</span>
                        {opt}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div className="px-4 py-3 border-t border-violet-900/40 bg-black/30 flex items-center gap-2">
                <button
                  onClick={goPrev}
                  disabled={quizIndex === 0}
                  className="flex-1 py-3 rounded-xl border border-violet-700/50 bg-violet-950/40 disabled:opacity-30 flex items-center justify-center gap-1 text-sm font-semibold"
                >
                  <ChevronLeft size={16} /> Prev
                </button>
                {quizIndex === quizQuestions.length - 1 ? (
                  <button
                    onClick={submitQuiz}
                    className="flex-1 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold"
                  >
                    Submit Quiz
                  </button>
                ) : (
                  <button
                    onClick={goNext}
                    className="flex-1 py-3 rounded-xl border border-violet-700/50 bg-violet-950/40 flex items-center justify-center gap-1 text-sm font-semibold"
                  >
                    Next <ChevronRight size={16} />
                  </button>
                )}
              </div>

              {paletteOpen && (
                <div className="absolute inset-x-3 bottom-20 z-30 rounded-2xl border border-violet-800/50 bg-[#150826]/95 backdrop-blur-md shadow-2xl p-4 max-h-72 overflow-y-auto">
                  <div className="text-sm font-semibold mb-3">Jump to question</div>
                  <div className="grid grid-cols-6 gap-2">
                    {quizQuestions.map((_, i) => {
                      const answered = quizAnswers[i] !== undefined;
                      const isCurrent = i === quizIndex;
                      return (
                        <button
                          key={i}
                          onClick={() => jumpToQuestion(i)}
                          className={`aspect-square rounded-lg text-xs font-semibold flex items-center justify-center border ${
                            isCurrent
                              ? "bg-gradient-to-br from-violet-500 to-fuchsia-600 border-violet-300"
                              : answered
                              ? "bg-violet-800/50 border-violet-600/50"
                              : "bg-violet-950/40 border-violet-800/50 text-purple-300/60"
                          }`}
                        >
                          {i + 1}
                        </button>
                      );
                    })}
                  </div>
                  <button
                    onClick={submitQuiz}
                    className="w-full mt-4 py-2.5 rounded-xl bg-gradient-to-br from-violet-600 to-fuchsia-600 text-sm font-bold"
                  >
                    Submit Quiz
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Quiz Result */}
          {quizPhase === "result" && (
            <div className="flex-1 overflow-y-auto px-5 py-6 space-y-6">
              <div className="flex flex-col items-center text-center gap-2 py-4">
                <Trophy size={34} className="text-amber-400" />
                <div className="text-3xl font-extrabold">
                  {quizScore} <span className="text-lg font-medium text-purple-300/60">/ {quizMaxScore}</span>
                </div>
                <div className="text-sm text-purple-300/70">Final score (negative marking applied)</div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="rounded-xl border border-emerald-800/50 bg-emerald-950/30 px-3 py-3 text-center">
                  <div className="text-xl font-bold text-emerald-400">{quizStats.correct}</div>
                  <div className="text-xs text-emerald-300/70">Correct</div>
                  <div className="text-[10px] text-emerald-300/50 mt-0.5">+{quizStats.correct * MARKS_CORRECT}</div>
                </div>
                <div className="rounded-xl border border-rose-800/50 bg-rose-950/30 px-3 py-3 text-center">
                  <div className="text-xl font-bold text-rose-400">{quizStats.wrong}</div>
                  <div className="text-xs text-rose-300/70">Wrong</div>
                  <div className="text-[10px] text-rose-300/50 mt-0.5">{quizStats.wrong * MARKS_WRONG}</div>
                </div>
                <div className="rounded-xl border border-violet-800/50 bg-violet-950/30 px-3 py-3 text-center">
                  <div className="text-xl font-bold text-purple-300">{quizStats.unanswered}</div>
                  <div className="text-xs text-purple-300/70">Unanswered</div>
                  <div className="text-[10px] text-purple-300/50 mt-0.5">+0</div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="text-sm font-semibold text-purple-200">Review</div>
                {quizQuestions.map((q, i) => {
                  const ans = quizAnswers[i];
                  const correct = ans === q.correctIndex;
                  const unanswered = ans === undefined;
                  return (
                    <div
                      key={i}
                      className={`rounded-xl border px-4 py-3 text-sm space-y-2 ${
                        unanswered
                          ? "border-violet-800/50 bg-violet-950/30"
                          : correct
                          ? "border-emerald-800/50 bg-emerald-950/20"
                          : "border-rose-800/50 bg-rose-950/20"
                      }`}
                    >
                      <div className="flex items-start gap-2">
                        {unanswered ? (
                          <MinusCircle size={16} className="text-purple-400 shrink-0 mt-0.5" />
                        ) : correct ? (
                          <CheckCircle2 size={16} className="text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle size={16} className="text-rose-400 shrink-0 mt-0.5" />
                        )}
                        <div className="font-medium">{i + 1}. {q.question}</div>
                      </div>
                      <div className="pl-6 space-y-1 text-xs text-purple-200/80">
                        {q.options.map((opt, oi) => (
                          <div
                            key={oi}
                            className={
                              oi === q.correctIndex
                                ? "text-emerald-300 font-semibold"
                                : oi === ans
                                ? "text-rose-300"
                                : ""
                            }
                          >
                            {String.fromCharCode(65 + oi)}. {opt}
                            {oi === q.correctIndex ? " ✓" : oi === ans ? " ✗" : ""}
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="flex gap-2 pb-4">
                <button
                  onClick={resetQuiz}
                  className="flex-1 py-3 rounded-xl border border-violet-700/50 bg-violet-950/40 flex items-center justify-center gap-2 text-sm font-semibold"
                >
                  <RotateCcw size={16} /> New Quiz
                </button>
                <button
                  onClick={exitQuiz}
                  className="flex-1 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-fuchsia-600 text-sm font-bold"
                >
                  Exit Quiz Mode
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
