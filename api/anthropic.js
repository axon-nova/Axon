// api/anthropic.js
//
// This function still lives at /api/anthropic, but now calls Google's
// Gemini API instead of Anthropic's. This version temporarily logs the last
// raw Gemini response so we can debug why the visible text might be empty —
// visit /api/anthropic?debug=1 in your browser after chatting once to see it.

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestLog = new Map();

// Debug-only: remembers the last raw Gemini response in memory so we can
// inspect it. Safe to remove once things are working.
let lastDebugInfo = null;

function isRateLimited(ip) {
  const now = Date.now();
  const entry = requestLog.get(ip) || [];
  const recent = entry.filter((t) => now - t < RATE_LIMIT_WINDOW_MS);
  recent.push(now);
  requestLog.set(ip, recent);
  return recent.length > RATE_LIMIT_MAX_REQUESTS;
}

function toGeminiContents(messages) {
  return messages.map((m) => ({
    role: m.role === "assistant" ? "model" : "user",
    parts: [{ text: typeof m.content === "string" ? m.content : String(m.content) }],
  }));
}

export default async function handler(req, res) {
  if (req.method === "GET") {
    if (req.query && req.query.debug) {
      res.status(200).json({ lastDebugInfo });
      return;
    }
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  if (req.method !== "POST") {
    res.status(405).json({ error: "Method not allowed" });
    return;
  }

  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  if (isRateLimited(ip)) {
    res.status(429).json({ error: "Too many requests. Please slow down and try again shortly." });
    return;
  }

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "Server is missing GEMINI_API_KEY." });
    return;
  }

  try {
    const { system, messages, max_tokens } = req.body || {};
    if (!Array.isArray(messages)) {
      res.status(400).json({ error: "Request body must include a messages array." });
      return;
    }

    const geminiBody = {
      contents: toGeminiContents(messages),
      generationConfig: {
        maxOutputTokens: max_tokens || 1000,
      },
    };
    if (system) {
      geminiBody.systemInstruction = { parts: [{ text: system }] };
    }

    const model = "gemini-2.5-flash";
    const upstream = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(geminiBody),
      }
    );

    const data = await upstream.json();

    // Save for debugging — visit /api/anthropic?debug=1 to view.
    lastDebugInfo = {
      upstreamStatus: upstream.status,
      upstreamOk: upstream.ok,
      raw: data,
    };

    if (!upstream.ok) {
      res.status(upstream.status).json({ error: "Gemini API error", detail: data });
      return;
    }

    const text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    lastDebugInfo = { crashError: err.message };
    res.status(500).json({ error: "Upstream request failed", detail: err.message });
  }
}
