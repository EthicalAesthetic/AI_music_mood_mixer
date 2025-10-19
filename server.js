// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

let accessToken = "";

// Function to get Spotify access token
async function getAccessToken() {
  const auth = Buffer.from(
    `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
  ).toString("base64");

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: {
      Authorization: `Basic ${auth}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
  });

  const data = await response.json();
  if (!data.access_token) throw new Error("Failed to get Spotify token");
  accessToken = data.access_token;
  console.log("🎟️ Got Spotify token");
}

// Call it once at startup
await getAccessToken();

// Search endpoint
app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) return res.status(400).json({ error: "Missing query" });

  try {
    let response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        query
      )}&type=track&limit=5`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );

    // If token expired, refresh token and retry once
    if (response.status === 401) {
      console.log("⚠️ Token expired, fetching new one...");
      await getAccessToken();
      response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=track&limit=5`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }

    const data = await response.json();

    if (!data.tracks || !data.tracks.items) {
      return res.json({ tracks: [] });
    }

    const tracks = data.tracks.items.map((t) => ({
      name: t.name,
      artist: t.artists[0].name,
      album: t.album.name,
      image: t.album.images[0]?.url,
      preview_url: t.preview_url,
    }));

    res.json({ tracks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching from Spotify" });
  }
});

app.listen(3000, () => console.log("✅ Backend running on http://localhost:3000"));
