import * as chrono from "chrono-node";
import OpenAI from "openai";

const OPENAI_KEY = process.env.OPENAI_API_KEY || "";
const client = OPENAI_KEY ? new OpenAI({ apiKey: OPENAI_KEY }) : null;

export async function llmParse(text) {
  try {
    const raw = String(text || "").trim();
    if (!raw) {
      return { title: "New Task", description: "", priority: "Medium", dueDate: "" };
    }

    if (client) {
      try {
        const prompt = `
You are a task extraction assistant. Given a short spoken sentence, return a JSON object with:
"title" (short 3-7 words),
"description" (1-2 sentence summary),
"priority" (High, Medium, Low),
"dueDate" (ISO-8601 timestamp if a date/time is present, otherwise empty string).

Input:
"${raw}"

Return ONLY valid JSON.
`;
        const response = await client.chat.completions.create({
          model: "gpt-4o-mini",
          messages: [{ role: "user", content: prompt }],
          temperature: 0.2,
          max_tokens: 400
        });

        let rawText = "";
        if (response?.choices && response.choices[0]) {
          const c = response.choices[0];
          if (c.message && typeof c.message.content === "string") rawText = c.message.content;
          else if (typeof c.text === "string") rawText = c.text;
          else rawText = JSON.stringify(c);
        }

        rawText = String(rawText || "").trim();
        const jsonMatch = rawText.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          try {
            const parsed = JSON.parse(jsonMatch[0]);
            return finalizeParsed(parsed, raw);
          } catch (e) {
          }
        }
      } catch (e) {
        console.warn("OpenAI parse failed, falling back to heuristics:", e?.message || e);
      }
    }

    return finalizeParsed(heuristicParse(raw), raw);
  } catch (err) {
    console.error("llmParse fatal error:", err);
    return {
      title: String(text || "").slice(0, 60) || "New Task",
      description: String(text || ""),
      priority: "Medium",
      dueDate: ""
    };
  }
}


function finalizeParsed(parsedCandidate = {}, originalText = "") {
  const result = {
    title: (parsedCandidate.title || "").toString().trim(),
    description: (parsedCandidate.description || "").toString().trim(),
    priority: (parsedCandidate.priority || "").toString().trim(),
    dueDate: (parsedCandidate.dueDate || "").toString().trim()
  };

  // Ensure title
  if (!result.title) {
    result.title = originalText.split(/[.,;\/\-]/)[0].slice(0, 60);
  }
  if (result.title.length > 120) result.title = result.title.slice(0, 117) + "...";
  result.title = result.title.charAt(0).toUpperCase() + result.title.slice(1);

  // Ensure description
  if (!result.description) result.description = originalText;

  // Normalize priority
  const p = result.priority.toLowerCase();
  if (["high", "medium", "low"].includes(p)) {
    result.priority = p.charAt(0).toUpperCase() + p.slice(1);
  } else {
    // try keyword detection in original text
    const lowWords = ["whenever", "sometime", "later", "not urgent", "no rush", "low priority"];
    if (/\b(urgent|asap|immediately|important|critical|now)\b/i.test(originalText)) result.priority = "High";
    else if (lowWords.some(w => originalText.toLowerCase().includes(w))) result.priority = "Low";
    else result.priority = "Medium";
  }

  // If no dueDate, try chrono
  if (!result.dueDate) {
    try {
      const d = chrono.parseDate(originalText);
      if (d) result.dueDate = d.toISOString();
      else result.dueDate = "";
    } catch (e) {
      result.dueDate = "";
    }
  }

  return result;
}

function heuristicParse(text) {
  const cleaned = text.replace(/\b(please|kindly|could you|would you|hey|hi|hello)\b/ig, "").trim().replace(/(please|thanks|thank you)\.?$/i, "").trim();
  let title = "";
  const toMatch = cleaned.match(/\bto\s+([a-z][^\.,]*)/i);
  if (toMatch && toMatch[1]) title = toMatch[1].split(/[.,]/)[0].trim();
  if (!title) {
    const splitToken = cleaned.split(/\b(by|on|tomorrow|tonight|this|next|due|before|after)\b/i)[0];
    title = (splitToken || "").split(/[.,;]/)[0].trim();
  }
  if (!title) title = cleaned.split(/\s+/).slice(0, 6).join(" ");
  title = title.replace(/^\s*[:\-–—]+/, "").trim();
  if (!title) title = text.slice(0, 60);

  return {
    title,
    description: cleaned || text,
    priority: "Medium",
    dueDate: ""
  };
}
