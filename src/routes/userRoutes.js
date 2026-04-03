// src/routes/userRoutes.js
// All user management routes. All routes require authentication.

const express = require("express");
const UserController = require("../controllers/userController");
const { authenticate, authorize } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// All routes below require a valid JWT
router.use(authenticate);

// GET /api/users         — Admin only: list all users
router.get("/", authorize("admin"), UserController.getAllUsers);

// GET /api/users/:id     — Admin can view any; others can view only themselves
router.get("/:id", UserController.getUserById);

// PATCH /api/users/:id   — Admin can update any; others can update only themselves
router.patch("/:id", validate("updateUser"), UserController.updateUser);

// DELETE /api/users/:id  — Admin only: hard delete a user
router.delete("/:id", authorize("admin"), UserController.deleteUser);

module.exports = router;
