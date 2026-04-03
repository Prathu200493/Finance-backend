// src/models/recordModel.js
// All database interactions for financial records — fully async using sqlite3.

const { run, get, all } = require("./database");

const RecordModel = {
  findById(id) {
    return get(
      "SELECT * FROM financial_records WHERE id = ? AND is_deleted = 0",
      [id]
    );
  },

  async findAll({ userId, type, category, startDate, endDate, limit = 50, offset = 0 } = {}) {
    const conditions = ["is_deleted = 0"];
    const params     = [];

    if (userId !== null && userId !== undefined) {
      conditions.push("user_id = ?");
      params.push(userId);
    }
    if (type)      { conditions.push("type = ?");      params.push(type); }
    if (category)  { conditions.push("category = ?");  params.push(category); }
    if (startDate) { conditions.push("date >= ?");     params.push(startDate); }
    if (endDate)   { conditions.push("date <= ?");     params.push(endDate); }

    const where = conditions.join(" AND ");

    const rows = await all(
      `SELECT * FROM financial_records
       WHERE ${where}
       ORDER BY date DESC, created_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    );

    const countRow = await get(
      `SELECT COUNT(*) as count FROM financial_records WHERE ${where}`,
      params
    );

    return { rows, total: countRow.count, limit, offset };
  },

  async create({ userId, amount, type, category, date, notes }) {
    const result = await run(
      `INSERT INTO financial_records (user_id, amount, type, category, date, notes)
       VALUES (?, ?, ?, ?, ?, ?)`,
      [userId, amount, type, category, date, notes || null]
    );
    return this.findById(result.lastID);
  },

  async update(id, fields) {
    const allowed = ["amount", "type", "category", "date", "notes"];
    const keys    = Object.keys(fields).filter((k) => allowed.includes(k));
    if (keys.length === 0) return this.findById(id);

    const setClauses = [...keys.map((k) => `${k} = ?`), "updated_at = datetime('now')"];
    const values     = keys.map((k) => fields[k]);

    await run(
      `UPDATE financial_records SET ${setClauses.join(", ")} WHERE id = ?`,
      [...values, id]
    );
    return this.findById(id);
  },

  softDelete(id) {
    return run(
      "UPDATE financial_records SET is_deleted = 1, updated_at = datetime('now') WHERE id = ?",
      [id]
    );
  },

  async getSummary(filters = {}) {
    const conditions = ["is_deleted = 0"];
    const params     = [];

    if (filters.userId) {
      conditions.push("user_id = ?");
      params.push(filters.userId);
    }

    const where = conditions.join(" AND ");

    const totals = await get(
      `SELECT
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS total_income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS total_expenses,
         COUNT(*) AS total_records
       FROM financial_records WHERE ${where}`,
      params
    );

    const byCategory = await all(
      `SELECT category, type, SUM(amount) AS total
       FROM financial_records
       WHERE ${where}
       GROUP BY category, type
       ORDER BY total DESC`,
      params
    );

    const recentActivity = await all(
      `SELECT * FROM financial_records
       WHERE ${where}
       ORDER BY date DESC, created_at DESC
       LIMIT 5`,
      params
    );

    const monthlyTrends = await all(
      `SELECT
         strftime('%Y-%m', date) AS month,
         SUM(CASE WHEN type = 'income'  THEN amount ELSE 0 END) AS income,
         SUM(CASE WHEN type = 'expense' THEN amount ELSE 0 END) AS expenses
       FROM financial_records
       WHERE ${where}
       GROUP BY month
       ORDER BY month DESC
       LIMIT 12`,
      params
    );

    return { totals, byCategory, recentActivity, monthlyTrends };
  },
};

module.exports = RecordModel;
