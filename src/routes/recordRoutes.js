// src/routes/recordRoutes.js
// Financial record and dashboard summary routes.
// Role-based access is enforced per endpoint.

const express = require("express");
const RecordController = require("../controllers/recordController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// All record routes require authentication
router.use(authenticate);

// ─── Dashboard ───────────────────────────────────────────────────────────────
// All roles can access the dashboard (data is scoped by role in the service)
router.get("/dashboard/summary", RecordController.getDashboardSummary);

// ─── CRUD ────────────────────────────────────────────────────────────────────

// GET /api/records        — All roles; viewers see only their own records
router.get("/", RecordController.getRecords);

// GET /api/records/:id    — All roles; viewers see only their own records
router.get("/:id", RecordController.getRecordById);

// POST /api/records       — Analysts and Admins only
router.post(
  "/",
  authorize("admin", "analyst"),
  validate("createRecord"),
  RecordController.createRecord
);

// PATCH /api/records/:id  — Analysts (own) and Admins (any)
router.patch(
  "/:id",
  authorize("admin", "analyst"),
  validate("updateRecord"),
  RecordController.updateRecord
);

// DELETE /api/records/:id — Analysts (own) and Admins (any)
router.delete(
  "/:id",
  authorize("admin", "analyst"),
  RecordController.deleteRecord
);

module.exports = router;
