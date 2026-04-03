// src/routes/authRoutes.js
// Public and protected authentication routes.

const express = require("express");
const AuthController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const { validate } = require("../middleware/validate");

const router = express.Router();

// Public: register a new account (default role: viewer)
router.post("/register", validate("register"), AuthController.register);

// Public: log in and receive a JWT
router.post("/login", validate("login"), AuthController.login);

// Protected: get the currently authenticated user's profile
router.get("/me", authenticate, AuthController.getMe);

module.exports = router;
