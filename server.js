// server.js
import express from "express";
import fetch from "node-fetch";
import cors from "cors";
import dotenv from "dotenv";

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static(".")); // Serve frontend files too

let accessToken = "";

// ========== SPOTIFY AUTH FLOW ==========
const CLIENT_ID = process.env.SPOTIFY_CLIENT_ID;
const CLIENT_SECRET = process.env.SPOTIFY_CLIENT_SECRET;
const REDIRECT_URI = process.env.SPOTIFY_REDIRECT_URI;

// Login route (Step 1)
app.get("/login", (req, res) => {
  const scope =
    "streaming user-read-email user-read-private user-modify-playback-state user-read-playback-state";
  const authUrl = `https://accounts.spotify.com/authorize?response_type=code&client_id=${CLIENT_ID}&scope=${encodeURIComponent(
    scope
  )}&redirect_uri=${encodeURIComponent(REDIRECT_URI)}`;
  res.redirect(authUrl);
});

// Callback route (Step 2)
app.get("/callback", async (req, res) => {
  const code = req.query.code || null;
  if (!code) return res.status(400).send("Missing code");

  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    redirect_uri: REDIRECT_URI,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json();
  if (data.error) return res.status(400).json(data);

  res.redirect(
    `/index.html#access_token=${data.access_token}&refresh_token=${data.refresh_token}`
  );
});

// Token refresh route
app.get("/refresh_token", async (req, res) => {
  const refresh_token = req.query.refresh_token;
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token,
    client_id: CLIENT_ID,
    client_secret: CLIENT_SECRET,
  });

  const response = await fetch("https://accounts.spotify.com/api/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });

  const data = await response.json();
  res.json(data);
});

// ========== EXISTING BACKEND FEATURES ==========
async function getAccessToken() {
  const auth = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64");
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
await getAccessToken();

// Search endpoint (unchanged)
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
    if (response.status === 401) {
      await getAccessToken();
      response = await fetch(
        `https://api.spotify.com/v1/search?q=${encodeURIComponent(
          query
        )}&type=track&limit=5`,
        { headers: { Authorization: `Bearer ${accessToken}` } }
      );
    }
    const data = await response.json();
    const tracks =
      data.tracks?.items?.map((t) => ({
        name: t.name,
        artist: t.artists[0].name,
        album: t.album.name,
        image: t.album.images[0]?.url,
        preview_url: t.preview_url,
        uri: t.uri,
      })) || [];
    res.json({ tracks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching from Spotify" });
  }
});
// --- Add this after your /api/search endpoint ---

import multer from "multer";
import fs from "fs";

// Set up multer for file uploads
const upload = multer({ dest: "uploads/" });

// Mock Mood Analysis (You can later replace with real AI model)
function predictMoodFromAudio(filePath) {
  const moods = [
    "happy",
    "sad",
    "angry",
    "joyful",
    "sarcastic",
    "emotional",
    "depressed",
    "calm",
  ];
  return moods[Math.floor(Math.random() * moods.length)];
}
app.post("/api/analyze", upload.single("song"), async (req, res) => {
  if (!req.file) return res.status(400).json({ error: "No file uploaded" });
  try {
    const mood = predictMoodFromAudio(req.file.path);
    fs.unlink(req.file.path, () => {});
    res.json({ mood });
  } catch (err) {
    res.status(500).json({ error: "Error analyzing song mood" });
  }
});

// Mood-based recommendations (unchanged)
app.get("/api/recommendations", async (req, res) => {
  const { mood } = req.query;
  if (!mood) return res.status(400).json({ error: "Missing mood" });
  try {
    let response = await fetch(
      `https://api.spotify.com/v1/search?q=${encodeURIComponent(
        mood
      )}&type=track&limit=6`,
      { headers: { Authorization: `Bearer ${accessToken}` } }
    );
    const data = await response.json();
    const tracks =
      data.tracks?.items?.map((t) => ({
        name: t.name,
        artist: t.artists[0].name,
        image: t.album.images[0]?.url,
        preview_url: t.preview_url,
        uri: t.uri,
      })) || [];
    res.json({ tracks });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Error fetching recommendations" });
  }
});

app.get("/", (req, res) => {
  res.send("✅ Backend running successfully on http://localhost:3000");
});

app.listen(process.env.PORT || 3000, () =>
  console.log("✅ Backend running on http://localhost:3000")
);
