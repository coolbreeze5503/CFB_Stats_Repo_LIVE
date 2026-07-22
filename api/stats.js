export default async function handler(req, res) {
  const { year, team, conference, endpoint } = req.query;

  if (!year || !endpoint || (!team && !conference)) {
    return res.status(400).json({ error: "Missing year, endpoint, and either team or conference" });
  }
  if (!["stats", "ppa"].includes(endpoint)) {
    return res.status(400).json({ error: "endpoint must be 'stats' or 'ppa'" });
  }

  const path = endpoint === "stats" ? "/stats/player/season" : "/ppa/players/season";
  let url = `https://api.collegefootballdata.com${path}?year=${encodeURIComponent(year)}`;
  if (team) url += `&team=${encodeURIComponent(team)}`;
  if (conference) url += `&conference=${encodeURIComponent(conference)}`;

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
