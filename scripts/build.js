#!/usr/bin/env node
// Scans Answers/<Topic>/<level>.txt and writes data.json for the board.
// Each topic folder must contain exactly 5 files (one per difficulty level),
// sorted alphabetically/numerically to assign point values low -> high.

const fs = require("fs");
const path = require("path");

const ANSWERS_DIR = path.join(__dirname, "..", "Answers");
const OUTPUT_FILE = path.join(__dirname, "..", "data.json");
const POINT_VALUES = [200, 400, 600, 800, 1000];

function parseClueFile(content) {
  const blocks = content.split(/^-+\s*$/m);
  const clues = [];

  for (const block of blocks) {
    const aMatch = block.match(/^A:\s*([\s\S]*?)(?=^Q:)/m);
    const qMatch = block.match(/^Q:\s*([\s\S]*)/m);
    if (aMatch && qMatch) {
      clues.push({
        answer: aMatch[1].trim(),
        question: qMatch[1].trim(),
      });
    }
  }
  return clues;
}

function build() {
  if (!fs.existsSync(ANSWERS_DIR)) {
    throw new Error(`Answers directory not found at ${ANSWERS_DIR}`);
  }

  const topicDirs = fs
    .readdirSync(ANSWERS_DIR, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => entry.name)
    .sort();

  const topics = [];

  for (const topicName of topicDirs) {
    const topicPath = path.join(ANSWERS_DIR, topicName);
    const files = fs
      .readdirSync(topicPath)
      .filter((f) => f.endsWith(".txt"))
      .sort((a, b) => {
        const na = parseInt(a, 10);
        const nb = parseInt(b, 10);
        if (!isNaN(na) && !isNaN(nb)) return na - nb;
        return a.localeCompare(b);
      });

    if (files.length !== 5) {
      console.warn(
        `Warning: topic "${topicName}" has ${files.length} files, expected 5. Skipping.`
      );
      continue;
    }

    const levels = files.map((file, i) => {
      const content = fs.readFileSync(path.join(topicPath, file), "utf8");
      const clues = parseClueFile(content);
      if (clues.length === 0) {
        console.warn(
          `Warning: no valid clues found in ${topicName}/${file}`
        );
      }
      return {
        value: POINT_VALUES[i],
        clues,
      };
    });

    topics.push({ name: topicName, levels });
  }

  fs.writeFileSync(OUTPUT_FILE, JSON.stringify({ topics }, null, 2));
  console.log(`Wrote ${OUTPUT_FILE} with ${topics.length} topic(s).`);
}

build();
