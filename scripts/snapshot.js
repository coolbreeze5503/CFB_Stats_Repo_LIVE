const CFBD_KEY = process.env.CFBD_API_KEY;
const SUPABASE_URL = process.env.SUPABASE_URL;
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY;

function seasonYear() {
  const now = new Date();
  const month = now.getUTCMonth() + 1;
  return month === 1 ? now.getUTCFullYear() - 1 : now.getUTCFullYear();
}

async function fetchCFBD(path, year) {
  const res = await fetch(`https://api.collegefootballdata.com${path}?year=${year}`, {
    headers: { Authorization: `Bearer ${CFBD_KEY}` },
  });
  if (!res.ok) throw new Error(`${path} failed: ${res.status}`);
  return res.json();
}

async function insertBatch(table, rows) {
  const chunkSize = 500;
  for (let i = 0; i < rows.length; i += chunkSize) {
    const chunk = rows.slice(i, i + chunkSize);
    const res = await fetch(`${SUPABASE_URL}/rest/v1/${table}`, {
      method: "POST",
      headers: {
        apikey: SUPABASE_KEY,
        Authorization: `Bearer ${SUPABASE_KEY}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(chunk),
    });
    if (!res.ok) throw new Error(`Insert into ${table} failed: ${res.status} ${await res.text()}`);
  }
}

async function main() {
  const year = seasonYear();
  const snapshot_date = new Date().toISOString().slice(0, 10);
  console.log(`Snapshotting season ${year} on ${snapshot_date}`);

  const stats = await fetchCFBD("/stats/player/season", year);
  await insertBatch(
    "weekly_player_stats",
    stats.map((r) => ({
      season: year, snapshot_date,
      player_id: r.playerId, player: r.player, team: r.team,
      conference: r.conference, category: r.category,
      stat_type: r.statType, stat_value: String(r.stat),
    }))
  );

  const ppa = await fetchCFBD("/ppa/players/season", year);
  await insertBatch(
    "weekly_player_ppa",
    ppa.map((r) => ({
      season: year, snapshot_date,
      player_id: r.id, player: r.name, position: r.position,
      team: r.team, conference: r.conference,
      average_ppa_all: r.averagePPA ? r.averagePPA.all : null,
    }))
  );

  console.log("Snapshot complete.");
}

main().catch((e) => { console.error(e); process.exit(1); });
