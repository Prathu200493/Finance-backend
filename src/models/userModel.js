// src/models/userModel.js
// All database interactions related to users — fully async using sqlite3.

const { run, get, all } = require("./database");

const UserModel = {
  findByEmail(email) {
    return get("SELECT * FROM users WHERE email = ?", [email]);
  },

  findById(id) {
    return get(
      "SELECT id, name, email, role, status, created_at FROM users WHERE id = ?",
      [id]
    );
  },

  findAll() {
    return all(
      "SELECT id, name, email, role, status, created_at FROM users ORDER BY created_at DESC"
    );
  },

  async create({ name, email, password, role = "viewer" }) {
    const result = await run(
      "INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)",
      [name, email, password, role]
    );
    return this.findById(result.lastID);
  },

  async update(id, fields) {
    const allowed = ["name", "email", "role", "status"];
    const keys    = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return this.findById(id);

    const setClauses = [...keys.map((k) => `${k} = ?`), "updated_at = datetime('now')"];
    const values     = keys.map((k) => fields[k]);

    await run(
      `UPDATE users SET ${setClauses.join(", ")} WHERE id = ?`,
      [...values, id]
    );
    return this.findById(id);
  },

  delete(id) {
    return run("DELETE FROM users WHERE id = ?", [id]);
  },
};

module.exports = UserModel;
