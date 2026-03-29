import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  // Simple auth check — use any secret you want
  const secret = req.headers['x-check-secret'];
  if (secret !== process.env.CHECK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const count = await sql`SELECT COUNT(*) as total FROM events`;
    const recent = await sql`
      SELECT event_type, event_data, page, created_at 
      FROM events 
      ORDER BY created_at DESC 
      LIMIT 10
    `;
    const byType = await sql`
      SELECT event_type, COUNT(*) as count 
      FROM events 
      GROUP BY event_type 
      ORDER BY count DESC
    `;

    return res.status(200).json({
      total_events: count[0].total,
      events_by_type: byType,
      recent_10: recent,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
