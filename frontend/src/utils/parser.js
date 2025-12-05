import chrono from 'chrono-node';

/**
 * Very lightweight parser: extracts priority, date using chrono, and a cleaned title.
 * For complicated inputs, add an LLM-based fallback.
 */
export function parseVoiceText(text) {
  const lower = text.toLowerCase();
  let priority = 'Medium';
  if (/\b(high|urgent|critical)\b/.test(lower)) priority = 'High';
  else if (/\b(low)\b/.test(lower)) priority = 'Low';

  // parse date with chrono
  const parsed = chrono.parse(text);
  let dueDate = null;
  if (parsed && parsed.length > 0) {
    dueDate = parsed[0].start && parsed[0].start.date();
  }

  // naive title extraction: remove 'remind me to', 'create', 'task', and date phrase
  let title = text.replace(/remind me to\s*/i, '')
    .replace(/create a \w* task to\s*/i, '')
    .replace(/create (an|a) task to\s*/i, '')
    .replace(/\bby\b.*$/i, '')
    .replace(/\b(that's|it's)\b.*$/i, '')
    .trim();

  // if empty, fallback to whole text
  if (!title) title = text;

  return { title, priority, dueDate, transcript: text };
}