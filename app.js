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

async function loadData() {
  const res = await fetch("data.json", { cache: "no-store" });
  if (!res.ok) {
    throw new Error(`Failed to load data.json: ${res.status}`);
  }
  return res.json();
}

function pickRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function renderBoard(data) {
  boardEl.innerHTML = "";
  boardEl.style.gridTemplateColumns = `repeat(${data.topics.length}, 1fr)`;

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
        cell.addEventListener("click", () =>
          openClue(topic.name, level, cell)
        );
      }
      boardEl.appendChild(cell);
    });
  }

  boardEl.classList.remove("hidden");
  statusEl.classList.add("hidden");
}

function openClue(topicName, level, cellEl) {
  if (cellEl.classList.contains("used")) return;

  const clue = pickRandom(level.clues);
  activeCell = cellEl;

  clueTopicEl.textContent = `${topicName} - $${level.value}`;
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
  init();
});

async function init() {
  statusEl.textContent = "Loading board...";
  statusEl.classList.remove("hidden");
  boardEl.classList.add("hidden");
  try {
    boardData = await loadData();
    if (!boardData.topics || boardData.topics.length === 0) {
      statusEl.textContent =
        "No topics found. Add folders to the Answers directory.";
      return;
    }
    renderBoard(boardData);
  } catch (err) {
    statusEl.textContent = `Error loading board: ${err.message}`;
  }
}

init();
