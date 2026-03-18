// backend/database/db.js

const path = require("path");
const Database = require("better-sqlite3");

// Resolve correct SQLite database path
const dbPath = path.resolve(__dirname, "../prisma.dev.db");

// Connect to SQLite
const db = new Database(dbPath, { verbose: console.log });

module.exports = db;
