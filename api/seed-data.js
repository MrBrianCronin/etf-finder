import { neon } from '@neondatabase/serverless';

function uuid() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = Math.random() * 16 | 0;
    return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
  });
}

function randomItem(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function randomItems(arr, min = 1, max = 3) {
  const count = min + Math.floor(Math.random() * (max - min + 1));
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, count);
}
function randomInt(min, max) { return min + Math.floor(Math.random() * (max - min + 1)); }

const ETF_TICKERS = ['SPY','VOO','QQQ','VTI','IWM','ARKK','SCHD','VGT','XLK','XLF','XLE','XLV','VNQ','BND','TLT','GLD','VWO','IBIT','JEPI','SOXX','SMH','VIG','HDV','ICLN','XBI'];
const SECTORS = ['Broad Market','Technology','Healthcare','Financials','Energy','Fixed Income','Real Estate','Commodities'];
const RISK_LEVELS = ['Conservative','Moderately Conservative','Moderate','Moderately Aggressive','Aggressive'];
const ASSET_CLASSES = ['Equity','Fixed Income','Commodity','Crypto'];
const GEO_OPTIONS = ['US','International Developed','Emerging Markets','Global'];
const EXPENSE_OPTIONS = ['u010','010_025','025_050','050_100'];
const AUM_OPTIONS = ['u1b','1b_10b','10b_50b','50b_100b','100bp'];
const DIV_OPTIONS = ['none','0_1','1_3','3_5','5p'];
const SEARCH_TERMS = ['ai','clean energy','dividends','tech','bonds','crypto','healthcare','retirement','growth','value','international','real estate','gold','income','esg'];
const SORT_COLUMNS = ['ticker','name','expense','aum','div_yield','1Y','3Y','YTD'];

const CAR_STAGES = ['budget','riders','driving','reliability','features','powertrain','style','final'];
const CAR_MAKES = ['Toyota','Honda','Ford','Chevrolet','Tesla','Hyundai','Kia','BMW','Subaru','Mazda'];

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  
  const secret = req.headers['x-setup-secret'];
  if (secret !== process.env.SETUP_SECRET) return res.status(403).json({ error: 'Forbidden' });

  const sql = neon(process.env.DATABASE_URL);
  const events = [];
  const now = Date.now();

  // Generate 30 days of ETF Finder sessions
  for (let day = 0; day < 30; day++) {
    const sessionsPerDay = randomInt(2, 8);
    const dayOffset = day * 24 * 60 * 60 * 1000;

    for (let s = 0; s < sessionsPerDay; s++) {
      const sessionId = uuid();
      const hourOffset = randomInt(7, 22) * 60 * 60 * 1000;
      let ts = now - dayOffset + hourOffset;
      const isLoggedIn = Math.random() < 0.25;
      const userId = isLoggedIn ? uuid() : null;

      // Page view
      events.push({ session_id: sessionId, event_type: 'page_view', event_data: { url: '/etf-finder', referrer: '' }, page: 'etf-finder', user_id: userId, ts });
      ts += randomInt(2000, 8000);

      // Heartbeats
      const heartbeats = randomInt(2, 12);
      for (let h = 0; h < heartbeats; h++) {
        ts += 30000;
        events.push({ session_id: sessionId, event_type: 'session_heartbeat', event_data: {}, page: 'etf-finder', user_id: userId, ts });
      }

      // Filter interactions
      const filterCount = randomInt(1, 5);
      for (let f = 0; f < filterCount; f++) {
        ts += randomInt(3000, 10000);
        const filters = {};
        if (Math.random() < 0.7) filters.sectors = randomItems(SECTORS, 1, 2);
        if (Math.random() < 0.5) filters.risk = randomItems(RISK_LEVELS, 1, 2);
        if (Math.random() < 0.3) filters.assetClass = randomItems(ASSET_CLASSES, 1, 1);
        if (Math.random() < 0.2) filters.geo = randomItems(GEO_OPTIONS, 1, 1);
        if (Math.random() < 0.25) filters.expense = randomItem(EXPENSE_OPTIONS);
        if (Math.random() < 0.2) filters.aum = randomItem(AUM_OPTIONS);
        if (Math.random() < 0.2) filters.divYield = randomItem(DIV_OPTIONS);

        events.push({ session_id: sessionId, event_type: 'filter_applied', event_data: { filters, results: randomInt(3, 80) }, page: 'etf-finder', user_id: userId, ts });
      }

      // Interest search
      if (Math.random() < 0.4) {
        ts += randomInt(2000, 6000);
        const term = randomItem(SEARCH_TERMS);
        events.push({ session_id: sessionId, event_type: 'interest_search', event_data: { query: term, matches: [term.charAt(0).toUpperCase() + term.slice(1)] }, page: 'etf-finder', user_id: userId, ts });
      }

      // ETF expansions
      const expandCount = randomInt(0, 6);
      for (let e = 0; e < expandCount; e++) {
        ts += randomInt(2000, 8000);
        const ticker = randomItem(ETF_TICKERS);
        events.push({ session_id: sessionId, event_type: 'etf_expanded', event_data: { ticker, sector: randomItem(SECTORS) }, page: 'etf-finder', user_id: userId, ts });
        
        ts += randomInt(3000, 15000);
        events.push({ session_id: sessionId, event_type: 'etf_collapsed', event_data: { ticker }, page: 'etf-finder', user_id: userId, ts });
      }

      // Add to package
      const addCount = randomInt(0, 4);
      const addedTickers = [];
      for (let a = 0; a < addCount; a++) {
        ts += randomInt(1000, 5000);
        const ticker = randomItem(ETF_TICKERS);
        if (!addedTickers.includes(ticker)) {
          addedTickers.push(ticker);
          events.push({ session_id: sessionId, event_type: 'etf_added_to_package', event_data: { ticker, sector: randomItem(SECTORS) }, page: 'etf-finder', user_id: userId, ts });
        }
      }

      // Remove from package
      if (addedTickers.length > 0 && Math.random() < 0.3) {
        ts += randomInt(5000, 15000);
        const ticker = randomItem(addedTickers);
        events.push({ session_id: sessionId, event_type: 'etf_removed_from_package', event_data: { ticker }, page: 'etf-finder', user_id: userId, ts });
      }

      // Sort
      if (Math.random() < 0.5) {
        ts += randomInt(2000, 5000);
        events.push({ session_id: sessionId, event_type: 'sort_changed', event_data: { column: randomItem(SORT_COLUMNS) }, page: 'etf-finder', user_id: userId, ts });
      }

      // Sidebar toggle
      if (Math.random() < 0.3) {
        ts += randomInt(1000, 3000);
        events.push({ session_id: sessionId, event_type: 'sidebar_toggled', event_data: { action: 'close' }, page: 'etf-finder', user_id: userId, ts });
      }

      // Disclosure
      if (Math.random() < 0.15) {
        ts += randomInt(2000, 8000);
        events.push({ session_id: sessionId, event_type: 'disclosure_opened', event_data: {}, page: 'etf-finder', user_id: userId, ts });
      }
    }
  }

  // Generate 30 days of Car Finder sessions
  for (let day = 0; day < 30; day++) {
    const sessionsPerDay = randomInt(1, 5);
    const dayOffset = day * 24 * 60 * 60 * 1000;

    for (let s = 0; s < sessionsPerDay; s++) {
      const sessionId = uuid();
      const hourOffset = randomInt(8, 21) * 60 * 60 * 1000;
      let ts = now - dayOffset + hourOffset;
      const isLoggedIn = Math.random() < 0.2;
      const userId = isLoggedIn ? uuid() : null;

      // Page view
      events.push({ session_id: sessionId, event_type: 'page_view', event_data: { url: '/car-finder', referrer: '' }, page: 'car-finder', user_id: userId, ts });
      ts += randomInt(3000, 10000);

      // Heartbeats
      const heartbeats = randomInt(2, 8);
      for (let h = 0; h < heartbeats; h++) {
        ts += 30000;
        events.push({ session_id: sessionId, event_type: 'session_heartbeat', event_data: {}, page: 'car-finder', user_id: userId, ts });
      }

      // Questions answered
      const questionsAnswered = randomInt(3, 25);
      let currentStage = 0;
      for (let q = 0; q < questionsAnswered; q++) {
        ts += randomInt(3000, 12000);
        const stage = CAR_STAGES[Math.min(currentStage, CAR_STAGES.length - 1)];
        events.push({ session_id: sessionId, event_type: 'question_answered', event_data: { question: q + 1, stage, type: randomItem(['single_select', 'slider', 'scale', 'multi_select']) }, page: 'car-finder', user_id: userId, ts });
        
        if (Math.random() < 0.2) currentStage++;
      }

      // Stage completions
      const stagesCompleted = randomInt(1, Math.min(4, Math.ceil(questionsAnswered / 5)));
      for (let sc = 0; sc < stagesCompleted; sc++) {
        ts += randomInt(1000, 3000);
        events.push({ session_id: sessionId, event_type: 'stage_completed', event_data: { stage: CAR_STAGES[sc] }, page: 'car-finder', user_id: userId, ts });
      }

      // Completed questionnaire
      if (questionsAnswered >= 10 && Math.random() < 0.6) {
        ts += randomInt(2000, 5000);
        events.push({ session_id: sessionId, event_type: 'questionnaire_completed', event_data: { questionsAnswered, timeElapsedMs: randomInt(120000, 600000) }, page: 'car-finder', user_id: userId, ts });

        // View recommendations
        const recsViewed = randomInt(1, 5);
        for (let r = 0; r < recsViewed; r++) {
          ts += randomInt(3000, 15000);
          const make = randomItem(CAR_MAKES);
          events.push({ session_id: sessionId, event_type: 'recommendation_viewed', event_data: { make, model: 'Model', year: randomInt(2018, 2025) }, page: 'car-finder', user_id: userId, ts });
        }

        // Deep link clicks
        if (Math.random() < 0.4) {
          ts += randomInt(5000, 20000);
          events.push({ session_id: sessionId, event_type: 'deep_link_clicked', event_data: { marketplace: randomItem(['cars.com', 'autotrader', 'cargurus']), make: randomItem(CAR_MAKES) }, page: 'car-finder', user_id: userId, ts });
        }
      }
    }
  }

  // Insert all events
  try {
    let inserted = 0;
    for (const event of events) {
      const createdAt = new Date(event.ts).toISOString();
      await sql`
        INSERT INTO events (session_id, event_type, event_data, page, user_id, created_at)
        VALUES (${event.session_id}, ${event.event_type}, ${JSON.stringify(event.event_data)}, ${event.page}, ${event.user_id}, ${createdAt})
      `;
      inserted++;
    }

    return res.status(200).json({
      success: true,
      events_inserted: inserted,
      message: 'Seed data inserted. Delete api/seed-data.js now.',
    });
  } catch (error) {
    console.error('Seed error:', error);
    return res.status(500).json({ error: error.message });
  }
}
