import { neon } from '@neondatabase/serverless';

// ─── Configuration ───
const MAX_EVENTS_PER_REQUEST = 20;
const MAX_PAYLOAD_SIZE = 4096; // 4KB max per request
const MAX_MONTHLY_WRITES = 50000;
const RATE_LIMIT_WINDOW_MS = 60000; // 1 minute
const RATE_LIMIT_MAX = 30; // 30 requests per minute per IP
const MAX_EVENT_AGE_MS = 120000; // reject events older than 2 minutes
const STORAGE_THRESHOLD_MB = 200;
const RETENTION_DAYS = 90;
const CLEANUP_INTERVAL = 100; // run cleanup every N writes

// Whitelist of allowed event types — anything else gets rejected
const ALLOWED_EVENT_TYPES = new Set([
  'page_view',
  'session_heartbeat',
  'filter_applied',
  'filter_cleared',
  'etf_expanded',
  'etf_collapsed',
  'etf_added_to_package',
  'etf_removed_from_package',
  'package_cleared',
  'interest_search',
  'sort_changed',
  'page_changed',
  'disclosure_opened',
  'sidebar_toggled',
]);

// Allowed origin domains
const ALLOWED_ORIGINS = [
  'https://briancronin.ai',
  'https://www.briancronin.ai',
  'http://localhost:5173', // local dev
  'http://localhost:3000',
];

// ─── In-memory rate limiter ───
const rateLimitMap = new Map();

function checkRateLimit(ip) {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (!record) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (now - record.windowStart > RATE_LIMIT_WINDOW_MS) {
    rateLimitMap.set(ip, { count: 1, windowStart: now });
    return true;
  }

  if (record.count >= RATE_LIMIT_MAX) {
    return false;
  }

  record.count++;
  return true;
}

// ─── Validation helpers ───
function isValidUUID(str) {
  return typeof str === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(str);
}

function sanitizeString(str, maxLength = 200) {
  if (typeof str !== 'string') return '';
  return str.replace(/[\x00-\x1F\x7F]/g, '').trim().slice(0, maxLength);
}

function validateEvent(event) {
  if (!event || typeof event !== 'object') return null;

  const eventType = sanitizeString(event.event_type, 50);
  if (!ALLOWED_EVENT_TYPES.has(eventType)) return null;

  const sessionId = event.session_id;
  if (!isValidUUID(sessionId)) return null;

  const page = sanitizeString(event.page || 'unknown', 100);

  const timestamp = event.timestamp;
  if (timestamp) {
    const age = Date.now() - timestamp;
    if (age > MAX_EVENT_AGE_MS || age < -10000) return null;
  }

  let eventData = {};
  if (event.event_data && typeof event.event_data === 'object' && !Array.isArray(event.event_data)) {
    const dataStr = JSON.stringify(event.event_data);
    if (dataStr.length <= 1024) {
      eventData = event.event_data;
    }
  }

  return { eventType, sessionId, page, eventData };
}

// ─── Monthly write cap ───
async function checkAndIncrementWriteCount(sql, count) {
  try {
    const monthKey = new Date().toISOString().slice(0, 7);

    const result = await sql`
      INSERT INTO write_counter (month_key, count)
      VALUES (${monthKey}, ${count})
      ON CONFLICT (month_key)
      DO UPDATE SET count = write_counter.count + ${count}
      RETURNING count
    `;

    return result[0].count <= MAX_MONTHLY_WRITES;
  } catch (error) {
    console.error('Write counter error:', error);
    return true; // fail open for telemetry
  }
}

// ─── Storage cleanup ───
async function runCleanupIfNeeded(sql) {
  try {
    await sql`
      DELETE FROM events
      WHERE created_at < NOW() - INTERVAL '90 days'
    `;

    const sizeResult = await sql`
      SELECT pg_total_relation_size('events') as size_bytes
    `;

    const sizeMB = sizeResult[0].size_bytes / (1024 * 1024);

    if (sizeMB > STORAGE_THRESHOLD_MB) {
      await sql`
        DELETE FROM events
        WHERE id IN (
          SELECT id FROM events
          ORDER BY created_at ASC
          LIMIT (SELECT COUNT(*) / 5 FROM events)
        )
      `;
      console.log(`Cleanup: table was ${sizeMB.toFixed(1)}MB, trimmed oldest 20%`);
    }
  } catch (error) {
    console.error('Cleanup error:', error);
  }
}

// ─── Write counter for cleanup scheduling ───
let writesSinceCleanup = 0;

// ─── Main handler ───
export default async function handler(req, res) {
  // ── CORS headers ──
  const origin = req.headers.origin || '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
  }
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // ── Origin check ──
  if (process.env.VERCEL_ENV === 'production' && origin && !ALLOWED_ORIGINS.includes(origin)) {
    return res.status(200).json({ ok: true });
  }

  // ── Rate limiting ──
  const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim() || req.socket?.remoteAddress || 'unknown';
  if (!checkRateLimit(ip)) {
    return res.status(200).json({ ok: true });
  }

  // ── Payload size check ──
  const bodyStr = JSON.stringify(req.body);
  if (bodyStr.length > MAX_PAYLOAD_SIZE) {
    return res.status(200).json({ ok: true });
  }

  // ── Parse and validate events ──
  const body = req.body;
  if (!body) {
    return res.status(200).json({ ok: true });
  }

  const rawEvents = Array.isArray(body.events) ? body.events : (body.event_type ? [body] : []);

  if (rawEvents.length === 0 || rawEvents.length > MAX_EVENTS_PER_REQUEST) {
    return res.status(200).json({ ok: true });
  }

  const validEvents = rawEvents.map(validateEvent).filter(Boolean);

  if (validEvents.length === 0) {
    return res.status(200).json({ ok: true });
  }

  // ── Write to database ──
  try {
    const sql = neon(process.env.DATABASE_URL);

    // Check monthly cap
    const withinCap = await checkAndIncrementWriteCount(sql, validEvents.length);
    if (!withinCap) {
      return res.status(200).json({ ok: true });
    }

    // Insert all valid events
    for (const event of validEvents) {
      await sql`
        INSERT INTO events (session_id, event_type, event_data, page)
        VALUES (${event.sessionId}, ${event.eventType}, ${JSON.stringify(event.eventData)}, ${event.page})
      `;
    }

    // Cleanup check
    writesSinceCleanup += validEvents.length;
    if (writesSinceCleanup >= CLEANUP_INTERVAL) {
      writesSinceCleanup = 0;
      runCleanupIfNeeded(sql).catch(console.error);
    }

    return res.status(200).json({ ok: true });
  } catch (error) {
    console.error('Telemetry write error:', error.message);
    return res.status(200).json({ ok: true });
  }
}
