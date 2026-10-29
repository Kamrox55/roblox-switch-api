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
        `https://www.roblox.com/users/favorites/list-json?assetTypeId=9&itemsPerPage=50&pageNumber=1&userId=${userId}`,
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
      const items = data?.Data?.Items || [];

      const games = items.map(item => ({
        name: item.Item?.Name || "Unknown Game",
        placeId: item.Item?.AssetId,
        thumbnail: item.Thumbnail?.Url || ""
      })).filter(game => game.placeId);

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
