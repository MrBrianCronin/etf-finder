import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const secret = req.headers['x-setup-secret'];
  if (secret !== process.env.SETUP_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    // Add nullable user_id column
    await sql`ALTER TABLE events ADD COLUMN IF NOT EXISTS user_id TEXT DEFAULT NULL`;

    // Index for querying all events by a specific user
    await sql`CREATE INDEX IF NOT EXISTS idx_events_user_id ON events (user_id) WHERE user_id IS NOT NULL`;

    // Composite index for per-app user queries
    await sql`CREATE INDEX IF NOT EXISTS idx_events_user_page ON events (user_id, page) WHERE user_id IS NOT NULL`;

    // Verify
    const cols = await sql`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'events' AND column_name = 'user_id'
    `;

    return res.status(200).json({ 
      success: true, 
      message: 'Migration complete — user_id column added.',
      verification: cols
    });
  } catch (error) {
    console.error('Migration error:', error);
    return res.status(500).json({ error: 'Migration failed', details: error.message });
  }
}
