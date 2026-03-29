/**
 * Telemetry Module
 * ================
 * Lightweight, anonymous event tracking for briancronin.ai apps.
 * 
 * Usage:
 *   import { trackEvent, initTelemetry } from './telemetry';
 *   
 *   // Call once on app load
 *   initTelemetry('etf-finder');
 *   
 *   // Track events anywhere
 *   trackEvent('filter_applied', { filter: 'sector', value: 'Technology' });
 *   trackEvent('etf_expanded', { ticker: 'SPY' });
 * 
 * Security:
 *   - No PII collected (no IPs, no user agents, no cookies)
 *   - Session ID is a random UUID stored in memory only (not persisted)
 *   - Events are batched to reduce API calls
 *   - All failures are silent — never affects user experience
 */

// ─── Configuration ───
const TELEMETRY_ENDPOINT = '/api/telemetry';
const BATCH_INTERVAL_MS = 5000; // Send events every 5 seconds
const HEARTBEAT_INTERVAL_MS = 30000; // Heartbeat every 30 seconds
const MAX_BATCH_SIZE = 15;

// ─── State ───
let sessionId = null;
let currentPage = 'unknown';
let eventQueue = [];
let batchTimer = null;
let heartbeatTimer = null;
let isInitialized = false;

// ─── Generate a cryptographically random UUID v4 ───
function generateSessionId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
}

// ─── Send batched events to the API ───
async function flushEvents() {
  if (eventQueue.length === 0) return;

  // Grab current batch and clear queue
  const batch = eventQueue.splice(0, MAX_BATCH_SIZE);

  try {
    const response = await fetch(TELEMETRY_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ events: batch }),
      // Don't wait forever — timeout after 3 seconds
      signal: AbortSignal.timeout ? AbortSignal.timeout(3000) : undefined,
    });
    // We don't check the response — fire and forget
  } catch (error) {
    // Silent failure — telemetry should never break the app
    // Events are lost, which is acceptable
  }
}

// ─── Public API ───

/**
 * Initialize telemetry for a specific page/app.
 * Call once when the app loads.
 * 
 * @param {string} page - App identifier (e.g., 'etf-finder', 'homepage')
 */
export function initTelemetry(page) {
  if (isInitialized) return;
  isInitialized = true;

  sessionId = generateSessionId();
  currentPage = page || 'unknown';

  // Start the batch send timer
  batchTimer = setInterval(flushEvents, BATCH_INTERVAL_MS);

  // Start heartbeat for time-on-page tracking
  heartbeatTimer = setInterval(() => {
    trackEvent('session_heartbeat', {});
  }, HEARTBEAT_INTERVAL_MS);

  // Track initial page view
  trackEvent('page_view', {
    url: typeof window !== 'undefined' ? window.location.pathname : '',
    referrer: typeof document !== 'undefined' ? document.referrer || '' : '',
  });

  // Flush remaining events when the user leaves
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      flushEvents();
    });

    // Also flush when the page becomes hidden (mobile tab switching)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        flushEvents();
      }
    });
  }
}

/**
 * Track an event.
 * 
 * @param {string} eventType - One of the allowed event types
 * @param {object} eventData - Additional data for the event
 */
export function trackEvent(eventType, eventData = {}) {
  if (!isInitialized || !sessionId) return;

  // Don't track if the page isn't visible (background tabs)
  if (typeof document !== 'undefined' && document.visibilityState === 'hidden' && eventType !== 'session_heartbeat') {
    return;
  }

  eventQueue.push({
    session_id: sessionId,
    event_type: eventType,
    event_data: eventData,
    page: currentPage,
    timestamp: Date.now(),
  });

  // If queue is getting large, flush immediately
  if (eventQueue.length >= MAX_BATCH_SIZE) {
    flushEvents();
  }
}

/**
 * Clean up timers. Call when the app unmounts (optional).
 */
export function destroyTelemetry() {
  if (batchTimer) clearInterval(batchTimer);
  if (heartbeatTimer) clearInterval(heartbeatTimer);
  flushEvents(); // Send any remaining events
  isInitialized = false;
  sessionId = null;
  eventQueue = [];
}
