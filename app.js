const boardEl = document.getElementById("board");
const statusEl = document.getElementById("status-message");
const resetBtn = document.getElementById("reset-btn");

const modal = document.getElementById("clue-modal");
const clueTopicEl = document.getElementById("clue-topic");
const clueTextEl = document.getElementById("clue-text");
const clueQuestionEl = document.getElementById("clue-question");
const revealBtn = document.getElementById("reveal-btn");
const closeBtn = document.getElementById("close-btn");

let boardData = null;
let activeCell = null;

function getSeedFromUrl() {
  return new URLSearchParams(location.search).get("seed");
}

function generateSeed() {
  return Math.random().toString(36).slice(2, 10);
}

function setSeedInUrl(seed) {
  const url = new URL(location.href);
  url.searchParams.set("seed", seed);
  history.replaceState(null, "", url);
}

// Hashes a string into a 32-bit int to use as a PRNG seed.
function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return hash >>> 0;
}

// mulberry32: small, fast, deterministic PRNG from a 32-bit seed.
function mulberry32(seed) {
  let a = seed;
  return function () {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// Picks deterministically from arr using a seed string unique to this cell,
// so the same board seed always reproduces the same set of clues.
function pickSeeded(arr, seedKey) {
  const rng = mulberry32(hashString(seedKey));
  return arr[Math.floor(rng() * arr.length)];
}

async function loadData() {
  const res = await fetch("data.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load data.json: ${res.status}`);
  }
  return res.json();
}

function renderBoard(data, seed) {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${data.topics.length}, 1fr)`;
  const numLevelsForLayout = Math.max(
    ...data.topics.map((t) => t.levels.length)
  );
  boardEl.style.setProperty("--num-levels", numLevelsForLayout);

  data.topics.forEach((topic) => {
    const header = document.createElement("div");
    header.className = "topic-header";
    header.textContent = topic.name;
    boardEl.appendChild(header);
  });

  const numLevels = Math.max(...data.topics.map((t) => t.levels.length));

  for (let row = 0; row < numLevels; row++) {
    data.topics.forEach((topic) => {
      const level = topic.levels[row];
      const cell = document.createElement("div");
      cell.className = "cell";
      cell.textContent = `$${level.value}`;

      if (!level.clues || level.clues.length === 0) {
        cell.classList.add("used");
      } else {
        const clue = pickSeeded(
          level.clues,
          `${seed}|${topic.name}|${level.value}`
        );
        cell.addEventListener("click", () =>
          openClue(topic.name, level.value, clue, cell)
        );
      }
      boardEl.appendChild(cell);
    });
  }

  boardEl.classList.remove("hidden");
  statusEl.classList.add("hidden");
}

function openClue(topicName, value, clue, cellEl) {
  if (cellEl.classList.contains("used")) return;

  activeCell = cellEl;

  clueTopicEl.textContent = `${topicName} - $${value}`;
  clueTextEl.textContent = clue.answer;
  clueQuestionEl.textContent = clue.question;
  clueQuestionEl.classList.add("hidden");
  revealBtn.classList.remove("hidden");
  closeBtn.classList.add("hidden");

  modal.classList.remove("hidden");
}

revealBtn.addEventListener("click", () => {
  clueQuestionEl.classList.remove("hidden");
  revealBtn.classList.add("hidden");
  closeBtn.classList.remove("hidden");
});

closeBtn.addEventListener("click", () => {
  modal.classList.add("hidden");
  if (activeCell) {
    activeCell.classList.add("used");
    activeCell = null;
  }
});

resetBtn.addEventListener("click", () => {
  setSeedInUrl(generateSeed());
  init();
});

async function init() {
  statusEl.textContent = "Loading board...";
  statusEl.classList.remove("hidden");
  boardEl.classList.add("hidden");

  let seed = getSeedFromUrl();
  if (!seed) {
    seed = generateSeed();
    setSeedInUrl(seed);
  }

  try {
    boardData = await loadData();
    if (!boardData.topics || boardData.topics.length === 0) {
      statusEl.textContent =
        "No topics found. Add folders to the Answers directory.";
      return;
    }
    renderBoard(boardData, seed);
  } catch (err) {
    statusEl.textContent = `Error loading board: ${err.message}`;
  }
}

init();
