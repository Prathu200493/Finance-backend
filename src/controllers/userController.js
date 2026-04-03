// src/controllers/userController.js
// Handles HTTP layer for user management endpoints.

const UserService = require("../services/userService");

const UserController = {
  /**
   * GET /api/users
   * Admin only: list all users in the system.
   */
  getAllUsers(req, res, next) {
    try {
      const users = UserService.getAllUsers();
      res.status(200).json({
        success: true,
        data: { users, count: users.length },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * GET /api/users/:id
   * Admins can fetch any user. Others can only fetch themselves.
   */
  getUserById(req, res, next) {
    try {
      const user = UserService.getUserById(req.user, Number(req.params.id));
      res.status(200).json({ success: true, data: { user } });
    } catch (err) {
      next(err);
    }
  },

  /**
   * PATCH /api/users/:id
   * Admins can update any user. Others can only update themselves.
   */
  async updateUser(req, res, next) {
    try {
      const user = await UserService.updateUser(
        req.user,
        Number(req.params.id),
        req.body
      );
      res.status(200).json({
        success: true,
        message: "User updated successfully.",
        data: { user },
      });
    } catch (err) {
      next(err);
    }
  },

  /**
   * DELETE /api/users/:id
   * Admin only: permanently remove a user and their records.
   */
  deleteUser(req, res, next) {
    try {
      const result = UserService.deleteUser(Number(req.params.id));
      res.status(200).json({ success: true, ...result });
    } catch (err) {
      next(err);
    }
  },
};

module.exports = UserController;
