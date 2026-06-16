# Jeopardy Board

A static, GitHub Pages-hosted Jeopardy board. Topics and clues are defined entirely as text files — no code changes needed to update the game.

## Adding questions

Create a folder per topic inside `Answers/`. Each topic folder must contain exactly 5 files, one per difficulty level. Files are sorted numerically/alphabetically by filename to assign point values ($200, $400, $600, $800, $1000) — naming them `100.txt`, `200.txt`, ... `500.txt` works well.

Each file can contain one or more clues, separated by a line of dashes:

```
A: This classic villain can be distinguished from sound alone -- a few mechanical deep breathes.
Q: Who is Darth Vader?
------
A: This bounty hunter froze Han Solo in carbonite.
Q: Who is Boba Fett?
------
```

`A:` is the Jeopardy "answer" (the clue shown on the board), and `Q:` is the Jeopardy "question" (what the player must respond with). If a file has multiple clues, one is picked at random each time the board is generated/played.

## How it works

- `Answers/` holds the source content.
- `scripts/build.js` parses `Answers/` into `data.json`.
- `index.html` / `style.css` / `app.js` render the board and read `data.json` at runtime, picking a random clue per cell each game.
- `.github/workflows/deploy.yml` runs the build script and deploys the site to GitHub Pages on every push to `main`.

## Local preview

```
node scripts/build.js
python3 -m http.server 8000
```

Then open http://localhost:8000.

## Enabling GitHub Pages

In the repository settings, under **Pages**, set the source to **GitHub Actions**. The included workflow will handle building and deploying.
