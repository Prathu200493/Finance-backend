// src/services/recordService.js
const RecordModel = require("../models/recordModel");

const RecordService = {
  getRecords(user, filters = {}) {
    const scopedFilters = { ...filters };
    if (user.role === "viewer") scopedFilters.userId = user.id;
    return RecordModel.findAll(scopedFilters);
  },

  async getRecordById(user, recordId) {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      const err = new Error("Record not found.");
      err.statusCode = 404;
      throw err;
    }
    if (user.role === "viewer" && record.user_id !== user.id) {
      const err = new Error("You do not have permission to view this record.");
      err.statusCode = 403;
      throw err;
    }
    return record;
  },

  createRecord(user, data) {
    return RecordModel.create({ userId: user.id, ...data });
  },

  async updateRecord(user, recordId, data) {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      const err = new Error("Record not found.");
      err.statusCode = 404;
      throw err;
    }
    if (user.role === "analyst" && record.user_id !== user.id) {
      const err = new Error("Analysts can only update their own records.");
      err.statusCode = 403;
      throw err;
    }
    return RecordModel.update(recordId, data);
  },

  async deleteRecord(user, recordId) {
    const record = await RecordModel.findById(recordId);
    if (!record) {
      const err = new Error("Record not found.");
      err.statusCode = 404;
      throw err;
    }
    if (user.role === "analyst" && record.user_id !== user.id) {
      const err = new Error("Analysts can only delete their own records.");
      err.statusCode = 403;
      throw err;
    }
    await RecordModel.softDelete(recordId);
    return { message: "Record deleted successfully." };
  },

  async getDashboardSummary(user) {
    const filters = {};
    if (user.role === "viewer") filters.userId = user.id;
    const summary = await RecordModel.getSummary(filters);
    const netBalance = (summary.totals.total_income || 0) - (summary.totals.total_expenses || 0);
    return {
      overview: {
        total_income:   summary.totals.total_income   || 0,
        total_expenses: summary.totals.total_expenses || 0,
        net_balance:    netBalance,
        total_records:  summary.totals.total_records  || 0,
      },
      category_breakdown: summary.byCategory,
      recent_activity:    summary.recentActivity,
      monthly_trends:     summary.monthlyTrends,
    };
  },
};

module.exports = RecordService;
