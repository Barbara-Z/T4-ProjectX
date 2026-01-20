const express = require("express");
const sqlite3 = require("sqlite3").verbose();
const bodyParser = require("body-parser");
const bcrypt = require("bcrypt");
const session = require("express-session");

const app = express();
const db = new sqlite3.Database("users.db");

/* ========== MIDDLEWARE ========== */
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

app.use(express.static(path.join(__dirname, "../Frontend")));

app.use(
  session({
    secret: "sehrGeheimesPasswort",
    resave: false,
    saveUninitialized: false,
    cookie: { secure: false } // true nur bei HTTPS
  })
);

/* ========== DATENBANK ========== */
db.run(`
  CREATE TABLE IF NOT EXISTS users (
    UserID INTEGER PRIMARY KEY AUTOINCREMENT,
    Username TEXT UNIQUE,
    Email TEXT UNIQUE,
    Passwort TEXT,
    Alter INTEGER,
    Erstelldatum TEXT
  )
`);

/* ========== REGISTRIERUNG ========== */
app.post("/register", async (req, res) => {
  const { Username, Email, Passwort, Alter } = req.body;

  const hashedPasswort = await bcrypt.hash(Passwort, 10);
  const ErstellDatum = new Date().toISOString();

  db.run(
    `INSERT INTO users (Username, Email, Passwort, Alter, Erstelldatum)
     VALUES (?, ?, ?, ?, ?)`,
    [Username, Email, hashedPasswort, Alter, ErstellDatum],
    function (err) {
      if (err) return res.send("Username oder Email existiert bereits");

      // Automatisch einloggen
      req.session.user = {
        id: this.lastID,
        username: Username
      };

      res.redirect("/");
    }
  );
});

/* ========== LOGIN ========== */
app.post("/login", (req, res) => {
  const { Username, Passwort } = req.body;

  db.get(
    "SELECT * FROM users WHERE username = ?",
    [Username],
    async (err, user) => {
      if (!user) return res.send("Benutzer nicht gefunden");

      const match = await bcrypt.compare(Passwort, user.Passwort);
      if (!match) return res.send("Falsches Passwort");

      req.session.user = {
        id: user.id,
        Username: user.Username
      };

      res.redirect("/");
    }
  );
});

/* ========== LOGOUT ========== */
app.get("/logout", (req, res) => {
  req.session.destroy(() => {
    res.redirect("/");
  });
});

/* ========== SESSION CHECK ========== */
app.get("/session", (req, res) => {
  res.json(req.session.user || null);
});

/* ========== SERVER START ========== */
app.listen(3000, () => {
  console.log("Server läuft auf http://localhost:3000");
});