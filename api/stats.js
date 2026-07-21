export default async function handler(req, res) {
  const { year, team, endpoint } = req.query;

  if (!year || !team || !endpoint) {
    return res.status(400).json({ error: "Missing year, team, or endpoint" });
  }
  if (!["stats", "ppa"].includes(endpoint)) {
    return res.status(400).json({ error: "endpoint must be 'stats' or 'ppa'" });
  }

  const path = endpoint === "stats" ? "/stats/player/season" : "/ppa/players/season";
  const url = `https://api.collegefootballdata.com${path}?year=${encodeURIComponent(year)}&team=${encodeURIComponent(team)}`;

  res.setHeader("Access-Control-Allow-Origin", "*");

  try {
    const r = await fetch(url, {
      headers: { Authorization: `Bearer ${process.env.CFBD_API_KEY}` },
    });
    const data = await r.json();
    res.status(r.status).json(data);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
}
