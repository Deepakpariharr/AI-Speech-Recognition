import * as chrono from 'chrono-node';

const PRIORITY_MAP = [
  { re: /(critical|urgent|high priority|highly urgent|asap)/i, value: 'High' },
  { re: /(low priority|not urgent|whenever|low priority)/i, value: 'Low' }
];

function detectPriority(text) {
  for (let p of PRIORITY_MAP) {
    if (p.re.test(text)) return p.value;
  }
  return 'Medium';
}

function extractStatus(text) {
  if (/in progress|doing|start working|start working on/i.test(text)) return 'In Progress';
  if (/done|completed|finished/i.test(text)) return 'Done';
  return 'To Do';
}

function extractTitle(text) {
  let t = text.replace(/(create|make|add|task|remind me to|please|would you|remind me)/ig, '');
  t = t.replace(/\b(by|before|due|on)\b.*$/ig, '');
  t = t.replace(/remind me to/i, '');
  return t.trim().replace(/[.,]$/,'');
}

function extractDueDate(text, refDate = new Date()) {
  const results = chrono.parse(text, refDate);
  if (!results || results.length === 0) return null;
  const dt = results[0].start.date();
  return dt;
}

export async function parse(text) {
  const title = extractTitle(text) || text;
  const priority = detectPriority(text);
  const status = extractStatus(text);
  const dueDate = extractDueDate(text);
  return {
    title,
    priority,
    status,
    dueDate: dueDate ? dueDate.toISOString() : null
  };
}
