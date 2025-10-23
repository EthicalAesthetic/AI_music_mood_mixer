// ======== References ========
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");
const fileInput = document.getElementById("fileInput");
const audioEl = document.getElementById("audioElement");
const floatingPlayer = document.getElementById("floatingPlayer");
const expandedSongNameCenter = document.getElementById("expandedSongNameCenter");
const playPauseBtn = document.getElementById("playPause");
const songDisplay = document.getElementById("songDisplay");
const expandedSongDisplay = document.getElementById("expandedSongDisplay");
const homeSongTitle = document.getElementById("homeSongTitle");
const analyzeBtn = document.getElementById("analyzeBtn");

let isPlaying = false;

// ======== Player Icon Logic ========
function updatePlayPauseIcon() {
  playPauseBtn.innerHTML = isPlaying
    ? '<i class="fa-solid fa-pause"></i>'
    : '<i class="fa-solid fa-play"></i>';
  playPauseBtn.title = isPlaying ? "Pause" : "Play";
}
updatePlayPauseIcon();

// ======== Play / Pause Button ========
playPauseBtn.onclick = () => {
  if (!audioEl.src) return;
  isPlaying = !isPlaying;
  if (isPlaying)
    audioEl.play().catch(() => {
      isPlaying = false;
      updatePlayPauseIcon();
    });
  else audioEl.pause();
  updatePlayPauseIcon();
};

// ======== Close Floating Player ========
document.getElementById("closePlayerBtn").onclick = () => {
  floatingPlayer.style.display = "none";
  audioEl.pause();
  isPlaying = false;
  updatePlayPauseIcon();
};

// ======== Upload Button ========
document.getElementById("uploadBtn").onclick = () => fileInput.click();

fileInput.addEventListener("change", (e) => {
  const file = e.target.files[0];
  if (!file) return;

  audioEl.src = URL.createObjectURL(file);
  audioEl.load();

  // Don't autoplay here — let the user press play
  floatingPlayer.style.display = "block";
  expandedSongNameCenter.textContent = file.name;
  document.getElementById("songDisplay").innerHTML = `<p>${file.name}</p>`;
  document.getElementById("expandedSongDisplay").style.display = "block";
  document.getElementById("homeSongTitle").textContent = file.name;

  isPlaying = false;
  updatePlayPauseIcon();
});


// ======== Analyze Mood ========
analyzeBtn.addEventListener("click", async () => {
  const file = fileInput.files[0];
  if (!file) {
    alert("Please upload a song first!");
    return;
  }

  analyzeBtn.textContent = "Analyzing...";
  analyzeBtn.disabled = true;

  try {
    const formData = new FormData();
    formData.append("song", file);

    const response = await fetch("https://ai-music-mood-mixer-1.onrender.com/api/analyze", {
      method: "POST",
      body: formData,
    });
    const data = await response.json();
    if (data.error) throw new Error(data.error);

    const mood = data.mood;
    homeSongTitle.textContent = `Mood: ${mood.toUpperCase()}`;

    const recRes = await fetch(
      `https://ai-music-mood-mixer-1.onrender.com/api/recommendations?mood=${mood}`
    );
    const recData = await recRes.json();

    if (recData.tracks && recData.tracks.length > 0) {
      const recHTML = `
        <h3 style="margin-top:1rem;color:#333;">Recommended Songs (${mood} mood)</h3>
        <ul style="list-style:none;padding:0;margin-top:10px;">
          ${recData.tracks
            .map(
              (t) => `
            <li style="margin:6px 0;cursor:pointer;display:flex;align-items:center;gap:10px;"
                data-preview="${t.preview_url || ""}">
                <img src="${t.image}" style="width:40px;height:40px;border-radius:6px;">
                <span>${t.name} - ${t.artist}</span>
            </li>`
            )
            .join("")}
        </ul>`;
      expandedSongDisplay.innerHTML = `
        <div id="homeSongTitle">Mood: ${mood.toUpperCase()}</div>
        ${recHTML}`;
    } else {
      expandedSongDisplay.innerHTML = `<div id="homeSongTitle">Mood: ${mood.toUpperCase()}</div><p>No recommendations found.</p>`;
    }

    expandedSongDisplay
      .querySelectorAll("li[data-preview]")
      .forEach((li) => {
        li.addEventListener("click", () => {
          const url = li.dataset.preview;
          if (!url || url === "null") {
            alert("No preview available for this song.");
            return;
          }
          audioEl.src = url;
          audioEl.load();
          audioEl.play();
          expandedSongNameCenter.textContent =
            li.querySelector("span").textContent;
          floatingPlayer.style.display = "block";
          isPlaying = true;
          updatePlayPauseIcon();
        });
      });
  } catch (err) {
    console.error(err);
    alert("Error analyzing mood. Try again.");
  }

  analyzeBtn.textContent = "Analyze Mood";
  analyzeBtn.disabled = false;
});

// ======== Search Dropdown ========
searchInput.addEventListener("keyup", async (e) => {
  const query = searchInput.value.trim();
  if (!query) {
    searchResults.style.display = "none";
    return;
  }

  if (e.key === "Enter") {
    const firstLi = searchResults.querySelector("li[data-preview]");
    if (firstLi) firstLi.click();
    return;
  }

  try {
    const res = await fetch(
      `https://ai-music-mood-mixer-1.onrender.com/api/search?q=${encodeURIComponent(query)}`
    );
    const data = await res.json();

    if (!data.tracks || data.tracks.length === 0) {
      searchResults.innerHTML = `<li>No results for "${query}"</li>`;
      searchResults.style.display = "block";
      return;
    }

    searchResults.innerHTML = data.tracks
      .map(
        (track) => `
        <li data-preview="${track.preview_url || ""}">
          <img src="${track.image || ""}" alt="album cover">
          <span>${track.name} - ${track.artist}</span>
        </li>`
      )
      .join("");
    searchResults.style.display = "block";
  } catch (err) {
    console.error(err);
    searchResults.innerHTML = `<li>Error fetching data</li>`;
    searchResults.style.display = "block";
  }
});

// ======== Play from Search ========
searchResults.addEventListener("click", (e) => {
  const li = e.target.closest("li");
  if (!li) return;

  const previewUrl = li.dataset.preview;
  const trackName = li.querySelector("span").textContent;

  if (!previewUrl || previewUrl === "null") {
    alert("No preview available for this track.");
    return;
  }

  audioEl.src = previewUrl;
  audioEl.load();
  audioEl.play().catch((err) => {
    console.error("Playback failed", err);
    alert("Playback failed. This track cannot be played.");
  });

  expandedSongNameCenter.textContent = trackName;
  floatingPlayer.style.display = "block";
  isPlaying = true;
  updatePlayPauseIcon();
  searchResults.style.display = "none";
});

// ======== Hide Dropdown on Outside Click ========
document.addEventListener("click", (e) => {
  if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
    searchResults.style.display = "none";
  }
});

// ======== When Audio Ends ========
audioEl.addEventListener("ended", () => {
  isPlaying = false;
  updatePlayPauseIcon();
});
