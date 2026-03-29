import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Only allow POST to prevent accidental browser hits
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  // Simple secret check — set SETUP_SECRET in Vercel env vars before running
  const secret = req.headers['x-setup-secret'];
  if (secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Create the events table
    await sql`
      CREATE TABLE IF NOT EXISTS events (
        id SERIAL PRIMARY KEY,
        session_id TEXT NOT NULL,
        event_type TEXT NOT NULL,
        event_data JSONB DEFAULT '{}',
        page TEXT DEFAULT 'unknown',
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      )
    `;

    // Index on created_at for time-based queries and cleanup
    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_created_at ON events (created_at)
    `;

    // Index on event_type for report filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_event_type ON events (event_type)
    `;

    // Index on page for multi-app filtering
    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_page ON events (page)
    `;

    // Index on session_id for session-based queries
    await sql`
      CREATE INDEX IF NOT EXISTS idx_events_session_id ON events (session_id)
    `;

    // Create monthly write counter table
    await sql`
      CREATE TABLE IF NOT EXISTS write_counter (
        month_key TEXT PRIMARY KEY,
        count INTEGER DEFAULT 0
      )
    `;

    return res.status(200).json({ 
      success: true, 
      message: 'Database schema created successfully. Delete api/setup-db.js now.' 
    });
  } catch (error) {
    console.error('Setup error:', error);
    return res.status(500).json({ error: 'Setup failed' });
  }
}
