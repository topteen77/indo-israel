/**
 * Append website errors to a rotating log file.
 * Admin can view via "Website errors" (last N lines, today or last hour).
 */
const fs = require('fs');
const path = require('path');

const LOG_DIR = path.join(__dirname, '..', 'logs');
const LOG_FILE = path.join(LOG_DIR, 'website-errors.log');
const MAX_LINE_LENGTH = 2000;

function ensureLogDir() {
  if (!fs.existsSync(LOG_DIR)) {
    fs.mkdirSync(LOG_DIR, { recursive: true });
  }
}

/**
 * Append one error entry. Format: [ISO timestamp] [source] message
 * Detail (e.g. stack) is truncated and appended on same line.
 */
function logWebsiteError(source, message, detail) {
  try {
    ensureLogDir();
    const ts = new Date().toISOString();
    const msg = (message || '').replace(/\r?\n/g, ' ').trim().slice(0, 500);
    const det = detail ? String(detail).replace(/\r?\n/g, ' ').trim().slice(0, MAX_LINE_LENGTH - 200) : '';
    const line = det ? `[${ts}] [${source}] ${msg} | ${det}\n` : `[${ts}] [${source}] ${msg}\n`;
    fs.appendFileSync(LOG_FILE, line);
  } catch (e) {
    console.error('Failed to write website error log:', e.message);
  }
}

/**
 * Read last N lines from the log file. Returns array of { raw, ts, source, message }.
 */
function readLastLines(maxLines = 500) {
  try {
    ensureLogDir();
    if (!fs.existsSync(LOG_FILE)) return [];
    const content = fs.readFileSync(LOG_FILE, 'utf8');
    const lines = content.split(/\r?\n/).filter(Boolean);
    const last = lines.slice(-maxLines);
    const parsed = last.map((raw) => {
      const match = raw.match(/^\[([^\]]+)\]\s*\[([^\]]+)\]\s*(.*)$/);
      if (match) {
        return { raw, ts: match[1], source: match[2], message: match[3] };
      }
      return { raw, ts: null, source: '', message: raw };
    });
    return parsed;
  } catch (e) {
    console.error('Failed to read website error log:', e.message);
    return [];
  }
}

/**
 * Get entries for admin view: if ≤10 errors today, return today's; else return last 1 hour.
 */
function getRecentErrors(lineLimit = 500) {
  const entries = readLastLines(lineLimit);
  const now = new Date();
  const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString().slice(0, 10);
  const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).getTime();

  const parseTs = (ts) => (ts ? new Date(ts).getTime() : 0);

  const todayEntries = entries.filter((e) => e.ts && e.ts.startsWith(todayStart));
  if (todayEntries.length <= 10) {
    return { entries: todayEntries.reverse(), period: 'today' };
  }
  const lastHourEntries = entries.filter((e) => parseTs(e.ts) >= oneHourAgo);
  return { entries: lastHourEntries.reverse(), period: 'last_hour' };
}

module.exports = { logWebsiteError, readLastLines, getRecentErrors };
