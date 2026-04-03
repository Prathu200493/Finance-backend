// src/controllers/authController.js
// Thin controllers: delegate all logic to services, format HTTP responses.

const AuthService = require("../services/authService");

const AuthController = {
  /**
   * POST /api/auth/register
   * Public endpoint to create a new viewer account.
   * Admin role assignment is allowed only via admin-authenticated requests
   * (enforced at the route level).
   */
  async register(req, res, next) {
    try {
      const { user, token } = await AuthService.register(req.body);
      res.status(201).json({
        success: true,
        message: "Account created successfully.",
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * POST /api/auth/login
   * Returns a signed JWT for valid credentials.
   */
  async login(req, res, next) {
    try {
      const { user, token } = await AuthService.login(req.body);
      res.status(200).json({
        success: true,
        message: "Login successful.",
        data: { user, token },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/auth/me
   * Returns the profile of the currently authenticated user.
   */
  getMe(req, res) {
    res.status(200).json({
      success: true,
      data: { user: req.user },
    });
  },
};

module.exports = AuthController;
