const express = require('express');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// DATABASE CONNECTION
const db = require('./db');

// STATIC FILES
app.use(express.static('public'));

// helper to load HTML files
function loadView(fileName) {
  return fs.readFileSync(
    path.join(__dirname, 'views', fileName),
    'utf-8'
  );
}

//
// HOME ROUTE (UI SEARCH ENABLED)
//
app.get('/', async (req, res) => {
  const { genre } = req.query;

  let query = 'SELECT * FROM games';
  let values = [];

  if (genre) {
    query += ' WHERE LOWER(genre) LIKE $1';
    values.push(`%${genre.toLowerCase()}%`);
  }

  const result = await db.query(query, values);
  const games = result.rows;

  let html = loadView('index.html');

  const gameCards = games.map(game => `
    <article>
      <img src="${game.image}" alt="${game.title}" style="border-radius:12px; max-height:180px; object-fit:cover; width:100%;" />
      <h3>${game.title}</h3>
      <p><strong>Genre:</strong> ${game.genre}</p>
      <p><strong>Platform:</strong> ${game.platform}</p>
      <p style="opacity:0.8">${game.description}</p>
      <a href="/games/${game.slug}" role="button">View Details →</a>
    </article>
  `).join('');

  html = html.replace("{{GAMES}}", gameCards);

  res.send(html);
});

//
// OPTIONAL API ROUTE (kept but NOT used for UI search)
//
app.get('/games', async (req, res) => {
  const result = await db.query('SELECT * FROM games');
  res.json(result.rows);
});

//
// DETAIL ROUTE
//
app.get('/games/:slug', async (req, res) => {
  const result = await db.query(
    'SELECT * FROM games WHERE slug = $1',
    [req.params.slug]
  );

  const game = result.rows[0];

  if (!game) {
    return res.status(404).sendFile(
      path.join(__dirname, 'views', '404.html')
    );
  }

  const getGenreClass = (genre) => {
    if (genre.toLowerCase().includes("farming")) return "farming";
    if (genre.toLowerCase().includes("life")) return "life";
    return "default";
  };

  let html = loadView('game.html');

  html = html
    .replaceAll("{{TITLE}}", game.title)
    .replaceAll("{{IMAGE}}", game.image)
    .replaceAll("{{GENRE}}", game.genre)
    .replaceAll("{{GENRE_CLASS}}", getGenreClass(game.genre))
    .replaceAll("{{PLATFORM}}", game.platform)
    .replaceAll("{{DESCRIPTION}}", game.description);

  res.send(html);
});

//
// 404 HANDLER
//
app.use((req, res) => {
  res.status(404).sendFile(
    path.join(__dirname, 'views', '404.html')
  );
});

//
// START SERVER
//
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});