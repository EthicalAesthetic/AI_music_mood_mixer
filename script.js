// ======== References ========
const searchInput = document.getElementById("searchInput");
const searchResults = document.getElementById("searchResults");

const fileInput = document.getElementById("fileInput");
const audioEl = document.getElementById("audioElement");

const floatingPlayer = document.getElementById("floatingPlayer");
const expandedSongNameCenter = floatingPlayer.querySelector("#expandedSongNameCenter");
const playPauseBtn = document.getElementById("playPause");
let isPlaying = false;

// ======== Player Icon Logic ========
function updatePlayPauseIcon() {
    playPauseBtn.innerHTML = isPlaying
        ? '<i class="fa-solid fa-pause"></i>'
        : '<i class="fa-solid fa-play"></i>';
    playPauseBtn.title = isPlaying ? "Pause" : "Play";
}
updatePlayPauseIcon();

playPauseBtn.onclick = () => {
    if (!audioEl.src) return;
    isPlaying = !isPlaying;
    if (isPlaying) audioEl.play().catch(() => { isPlaying = false; updatePlayPauseIcon(); });
    else audioEl.pause();
    updatePlayPauseIcon();
};

// ======== Floating Player Close ========
document.getElementById("closePlayerBtn").onclick = () => {
    floatingPlayer.style.display = "none";
};

// ======== Upload Button ========
document.getElementById("uploadBtn").onclick = () => fileInput.click();

fileInput.addEventListener("change", (e) => {
    const file = e.target.files[0];
    if (!file) return;

    audioEl.src = URL.createObjectURL(file);
    audioEl.load();

    floatingPlayer.style.display = "block";
    expandedSongNameCenter.textContent = file.name;

    isPlaying = false;
    updatePlayPauseIcon();
});

// ======== Search Dropdown Logic ========
searchInput.addEventListener("keyup", async (e) => {
    const query = searchInput.value.trim();
    if (!query) {
        searchResults.style.display = "none";
        return;
    }

    // Press Enter: play first result automatically
    if (e.key === "Enter") {
        const firstLi = searchResults.querySelector("li[data-preview]");
        if (firstLi) firstLi.click();
        return;
    }

    try {
        const res = await fetch(`http://localhost:3000/api/search?q=${encodeURIComponent(query)}`);
        const data = await res.json();

        if (!data.tracks || data.tracks.length === 0) {
            searchResults.innerHTML = `<li>No results for "${query}"</li>`;
            searchResults.style.display = "block";
            return;
        }

        searchResults.innerHTML = data.tracks.map(track => `
            <li data-preview="${track.preview_url || ''}">
                <img src="${track.image || ''}" alt="album cover">
                <span>${track.name} - ${track.artist}</span>
            </li>
        `).join("");
        searchResults.style.display = "block";
    } catch (err) {
        console.error(err);
        searchResults.innerHTML = `<li>Error fetching data</li>`;
        searchResults.style.display = "block";
    }
});

// ======== Click on Search Result ========
searchResults.addEventListener("click", (e) => {
    const li = e.target.closest("li");
    if (!li) return;

    const previewUrl = li.dataset.preview;
    const trackName = li.querySelector("span").textContent;

    if (!previewUrl || previewUrl === "null") {
        alert("No preview available for this track. Try another one.");
        return;
    }

    audioEl.src = previewUrl;
    audioEl.load();
    audioEl.play().catch(err => {
        console.error("Playback failed", err);
        alert("Playback failed. This track cannot be played.");
    });

    expandedSongNameCenter.textContent = trackName;
    floatingPlayer.style.display = "block";

    isPlaying = true;
    updatePlayPauseIcon();

    searchResults.style.display = "none";
});

// ======== Hide Dropdown if Click Outside ========
document.addEventListener("click", (e) => {
    if (!searchInput.contains(e.target) && !searchResults.contains(e.target)) {
        searchResults.style.display = "none";
    }
});

// ======== Audio Ended ========
audioEl.addEventListener("ended", () => {
    isPlaying = false;
    updatePlayPauseIcon();
});
