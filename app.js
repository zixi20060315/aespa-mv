import { getDb, getFirestoreHelpers, hasFirebaseConfig } from "./firebase.js";

function escapeHtml(value) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function getYouTubeEmbedUrl(url) {
  if (!url) return "";

  try {
    const parsed = new URL(url);
    let videoId = "";

    if (parsed.hostname.includes("youtu.be")) {
      videoId = parsed.pathname.replace("/", "");
    } else if (parsed.pathname.startsWith("/embed/")) {
      videoId = parsed.pathname.split("/embed/")[1];
    } else if (parsed.pathname.startsWith("/shorts/")) {
      videoId = parsed.pathname.split("/shorts/")[1];
    } else {
      videoId = parsed.searchParams.get("v") || "";
    }

    videoId = videoId.split(/[?&/]/)[0];
    return videoId ? `https://www.youtube.com/embed/${videoId}` : "";
  } catch (error) {
    return "";
  }
}

function setStatus(element, message, isError = false) {
  if (!element) return;
  element.textContent = message;
  element.classList.toggle("error", isError);
  element.hidden = !message;
}

function renderSongCard(song) {
  const title = escapeHtml(song.title || "Untitled");
  const year = escapeHtml(song.year || "Unknown year");

  return `
    <a class="song-card" href="song.html?id=${encodeURIComponent(song.id)}" aria-label="Open ${title}">
      <div>
        <p class="eyebrow">aespa</p>
        <h2>${title}</h2>
      </div>
      <div class="song-card-meta">
        <span>${year}</span>
        <span class="watch-pill">Watch MV</span>
      </div>
    </a>
  `;
}

async function loadHomepage() {
  const songsGrid = document.querySelector("#songsGrid");
  const searchInput = document.querySelector("#searchInput");
  const statusMessage = document.querySelector("#statusMessage");
  const songCount = document.querySelector("#songCount");

  if (!songsGrid) return;

  let songs = [];

  if (!hasFirebaseConfig) {
    songCount.textContent = "Firebase setup needed";
    setStatus(statusMessage, "Add your Firebase project config in firebase.js to load songs from Firestore.", true);
    return;
  }

  function renderSongs(filter = "") {
    const normalizedFilter = filter.trim().toLowerCase();
    const visibleSongs = songs.filter((song) =>
      `${song.title ?? ""} ${song.year ?? ""}`.toLowerCase().includes(normalizedFilter)
    );

    songsGrid.innerHTML = visibleSongs.map(renderSongCard).join("");

    const label = visibleSongs.length === 1 ? "song" : "songs";
    songCount.textContent = `${visibleSongs.length} ${label}`;

    if (songs.length && !visibleSongs.length) {
      setStatus(statusMessage, "No songs match your search.");
    } else {
      setStatus(statusMessage, "");
    }
  }

  try {
    const db = await getDb();
    const { collection, getDocs, orderBy, query } = await getFirestoreHelpers();
    const songsCollection = collection(db, "songs");
    const songsQuery = query(songsCollection, orderBy("year", "desc"));
    const snapshot = await getDocs(songsQuery);

    songs = snapshot.docs.map((songDoc) => ({
      id: songDoc.id,
      ...songDoc.data()
    }));

    if (!songs.length) {
      songCount.textContent = "0 songs";
      setStatus(statusMessage, "No songs found. Add documents to the Firestore songs collection.");
      return;
    }

    renderSongs();
    searchInput.addEventListener("input", (event) => renderSongs(event.target.value));
  } catch (error) {
    console.error(error);
    songCount.textContent = "Archive unavailable";
    setStatus(statusMessage, "Could not load songs. Check your Firebase config and Firestore rules.", true);
  }
}

async function loadSongDetail() {
  const detailStatus = document.querySelector("#detailStatus");
  const songDetail = document.querySelector("#songDetail");
  const songTitle = document.querySelector("#songTitle");
  const songYear = document.querySelector("#songYear");
  const videoFrame = document.querySelector("#videoFrame");

  if (!songDetail) return;

  const songId = new URLSearchParams(window.location.search).get("id");

  if (!hasFirebaseConfig) {
    setStatus(detailStatus, "Add your Firebase project config in firebase.js to load this song.", true);
    return;
  }

  if (!songId) {
    setStatus(detailStatus, "Missing song id. Return to the archive and choose a song.", true);
    return;
  }

  try {
    const db = await getDb();
    const { doc, getDoc } = await getFirestoreHelpers();
    const songSnapshot = await getDoc(doc(db, "songs", songId));

    if (!songSnapshot.exists()) {
      setStatus(detailStatus, "Song not found.", true);
      return;
    }

    const song = songSnapshot.data();
    const title = song.title || "Untitled";
    const year = song.year || "Unknown year";
    const embedUrl = getYouTubeEmbedUrl(song.youtube);

    document.title = `${title} | AESPA MV ARCHIVE`;
    songTitle.textContent = title;
    songYear.textContent = `Released ${year}`;

    if (embedUrl) {
      videoFrame.innerHTML = `
        <iframe
          src="${embedUrl}"
          title="${escapeHtml(title)} music video"
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
          allowfullscreen>
        </iframe>
      `;
    } else {
      videoFrame.innerHTML = '<div class="status-message">This song does not have a valid YouTube URL.</div>';
    }

    setStatus(detailStatus, "");
    songDetail.hidden = false;
  } catch (error) {
    console.error(error);
    setStatus(detailStatus, "Could not load this song. Check your Firebase config and Firestore rules.", true);
  }
}

loadHomepage();
loadSongDetail();
