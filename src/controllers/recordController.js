// src/controllers/recordController.js
// Handles HTTP layer for financial record endpoints.
// Parses query parameters and delegates to RecordService.

const RecordService = require("../services/recordService");

const RecordController = {
  /**
   * GET /api/records
   * Returns a paginated, filtered list of records.
   * Supports query params: type, category, startDate, endDate, limit, offset
   */
  getRecords(req, res, next) {
    try {
      const { type, category, startDate, endDate, limit, offset } = req.query;

      const filters = {
        type,
        category,
        startDate,
        endDate,
        limit:  limit  ? parseInt(limit, 10)  : 50,
        offset: offset ? parseInt(offset, 10) : 0,
      };

      const result = RecordService.getRecords(req.user, filters);
      res.status(200).json({ success: true, data: result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/records/:id
   * Returns a single financial record by ID.
   */
  getRecordById(req, res, next) {
    try {
      const record = RecordService.getRecordById(req.user, Number(req.params.id));
      res.status(200).json({ success: true, data: { record } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/records
   * Creates a new financial record linked to the authenticated user.
   * Restricted to analysts and admins.
   */
  createRecord(req, res, next) {
    try {
      const record = RecordService.createRecord(req.user, req.body);
      res.status(201).json({
        success: true,
        message: "Record created successfully.",
        data: { record },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/records/:id
   * Partially updates an existing record.
   * Admins can update any; analysts can update only their own.
   */
  updateRecord(req, res, next) {
    try {
      const record = RecordService.updateRecord(
        req.user,
        Number(req.params.id),
        req.body
      );
      res.status(200).json({
        success: true,
        message: "Record updated successfully.",
        data: { record },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/records/:id
   * Soft-deletes a record (marks is_deleted = 1).
   * Admins can delete any; analysts can delete only their own.
   */
  deleteRecord(req, res, next) {
    try {
      const result = RecordService.deleteRecord(req.user, Number(req.params.id));
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/records/dashboard/summary
   * Returns aggregated analytics data for the finance dashboard.
   */
  getDashboardSummary(req, res, next) {
    try {
      const summary = RecordService.getDashboardSummary(req.user);
      res.status(200).json({ success: true, data: summary });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = RecordController;
