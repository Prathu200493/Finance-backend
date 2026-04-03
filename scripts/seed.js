// scripts/seed.js
// Populates the database with sample users and financial records.
// Run with: node scripts/seed.js

require("dotenv").config();
const bcrypt = require("bcryptjs");
const { run, exec, initializeSchema } = require("../src/models/database");

async function seed() {
  await initializeSchema();
  console.log("🌱 Seeding database...\n");

  // Clear existing data
  await exec("DELETE FROM financial_records; DELETE FROM users;");

  const password = await bcrypt.hash("password123", 10);

  const alice   = await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ["Alice Admin",  "alice@finance.com",  password, "admin"]);
  const bob     = await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ["Bob Analyst",  "bob@finance.com",    password, "analyst"]);
  await run("INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)", ["Carol Viewer", "carol@finance.com", password, "viewer"]);

  console.log("✅ Users created:");
  console.log("   alice@finance.com  — admin    (password: password123)");
  console.log("   bob@finance.com    — analyst  (password: password123)");
  console.log("   carol@finance.com  — viewer   (password: password123)");

  const records = [
    [alice.lastID, 85000, "income",  "Salary",     "2024-01-01", "January salary"],
    [alice.lastID,  1200, "expense", "Rent",        "2024-01-05", "Office rent"],
    [alice.lastID,   350, "expense", "Utilities",   "2024-01-10", "Electricity"],
    [bob.lastID,   12000, "income",  "Consulting",  "2024-01-15", "Client project"],
    [bob.lastID,     500, "expense", "Food",        "2024-01-18", "Team lunch"],
    [bob.lastID,    3000, "income",  "Freelance",   "2024-02-01", "Website redesign"],
    [bob.lastID,     800, "expense", "Travel",      "2024-02-05", "Client visit"],
    [alice.lastID, 90000, "income",  "Salary",      "2024-02-01", "February salary"],
    [alice.lastID,  1200, "expense", "Rent",        "2024-02-05", "Office rent"],
    [bob.lastID,    5000, "income",  "Bonus",       "2024-03-01", "Q1 bonus"],
    [alice.lastID, 90000, "income",  "Salary",      "2024-03-01", "March salary"],
    [bob.lastID,    1500, "expense", "Software",    "2024-03-10", "Subscriptions"],
  ];

  for (const r of records) {
    await run(
      "INSERT INTO financial_records (user_id, amount, type, category, date, notes) VALUES (?, ?, ?, ?, ?, ?)",
      r
    );
  }

  console.log(`\n✅ ${records.length} financial records created.`);
  console.log("\n🎉 Seed complete! Run: npm start\n");
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err.message);
  process.exit(1);
});
