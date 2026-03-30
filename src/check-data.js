import { neon } from '@neondatabase/serverless';

export default async function handler(req, res) {
  const secret = req.headers['x-check-secret'];
  if (secret !== process.env.CHECK_SECRET) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  const sql = neon(process.env.DATABASE_URL);

  try {
    const total = await sql`SELECT COUNT(*) as total FROM events`;
    const byType = await sql`SELECT event_type, COUNT(*) as count FROM events GROUP BY event_type ORDER BY count DESC`;
    const byPage = await sql`SELECT page, COUNT(*) as count FROM events GROUP BY page ORDER BY count DESC`;
    const dateRange = await sql`SELECT MIN(created_at) as earliest, MAX(created_at) as latest FROM events`;
    const sessions = await sql`SELECT COUNT(DISTINCT session_id) as total_sessions FROM events`;
    const users = await sql`SELECT COUNT(DISTINCT user_id) as logged_in_users FROM events WHERE user_id IS NOT NULL`;
    const sampleFilter = await sql`SELECT event_data FROM events WHERE event_type = 'filter_applied' LIMIT 3`;
    const sampleSearch = await sql`SELECT event_data FROM events WHERE event_type = 'interest_search' LIMIT 3`;
    const sampleExpand = await sql`SELECT event_data FROM events WHERE event_type = 'etf_expanded' LIMIT 3`;

    return res.status(200).json({
      total_events: total[0].total,
      events_by_type: byType,
      events_by_page: byPage,
      date_range: dateRange[0],
      total_sessions: sessions[0].total_sessions,
      logged_in_users: users[0].logged_in_users,
      sample_filter_data: sampleFilter,
      sample_search_data: sampleSearch,
      sample_expand_data: sampleExpand,
    });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  }
}
