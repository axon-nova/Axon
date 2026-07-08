// api/anthropic.js
//
// This function still lives at /api/anthropic, but now calls Google's
// Gemini API instead of Anthropic's. This debug version shows what went
// wrong directly in the chat reply if the response text comes back empty.

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_MAX_REQUESTS = 20;
const requestLog = new Map();

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

    if (!upstream.ok) {
      res.status(200).json({
        content: [{ type: "text", text: "[DEBUG] Gemini error: " + JSON.stringify(data) }],
      });
      return;
    }

    let text =
      data?.candidates?.[0]?.content?.parts?.map((p) => p.text || "").join("") || "";

    if (!text) {
      const candidate = data?.candidates?.[0];
      text =
        "[DEBUG] Empty response. finishReason=" +
        (candidate?.finishReason || "none") +
        " promptFeedback=" +
        JSON.stringify(data?.promptFeedback || {}) +
        " safetyRatings=" +
        JSON.stringify(candidate?.safetyRatings || []);
    }

    res.status(200).json({ content: [{ type: "text", text }] });
  } catch (err) {
    res.status(200).json({
      content: [{ type: "text", text: "[DEBUG] Crash: " + err.message }],
    });
  }
          }
