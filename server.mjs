import http from "node:http";

const PORT = process.env.PORT || 3000;

const server = http.createServer(async (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const url = new URL(req.url, `http://${req.headers.host}`);

  if (url.pathname === "/") {
    res.writeHead(200);
    res.end(JSON.stringify({
      status: "online",
      message: "Roblox Switch API is running!"
    }));
    return;
  }

  if (url.pathname === "/favorites") {
    const userId = url.searchParams.get("userId");

    if (!userId || !/^\d+$/.test(userId)) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: "Invalid userId" }));
      return;
    }

    try {
      const response = await fetch(
        `https://games.roblox.com/v2/users/${userId}/favorite/games?limit=50`,
        {
          headers: {
            "User-Agent": "Mozilla/5.0",
            "Accept": "application/json"
          },
          signal: AbortSignal.timeout(10000)
        }
      );

      if (!response.ok) {
        throw new Error(`Roblox returned ${response.status}`);
      }

      const data = await response.json();

      // FIX: Roblox returns "data", not "Data.Items"
      const items = Array.isArray(data.data) ? data.data : [];

      const games = items
        .map(item => ({
          name: item.name || "Unknown Game",
          placeId: item.rootPlace?.id,
          universeId: item.id,
          thumbnail: ""
        }))
        .filter(game => game.placeId);

      res.writeHead(200);
      res.end(JSON.stringify({ games }));

    } catch (error) {
      console.error("Favorites error:", error.message);

      res.writeHead(502);
      res.end(JSON.stringify({
        error: "Could not retrieve Roblox favorites",
        details: error.message
      }));
    }

    return;
  }

  res.writeHead(404);
  res.end(JSON.stringify({ error: "Not found" }));
});

server.listen(PORT, "0.0.0.0", () => {
  console.log(`Roblox Switch API running on port ${PORT}`);
});
