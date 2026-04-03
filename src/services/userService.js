// src/services/userService.js
const UserModel = require("../models/userModel");
const bcrypt    = require("bcryptjs");

const UserService = {
  getAllUsers() {
    return UserModel.findAll();
  },

  async getUserById(requestingUser, targetId) {
    const targetUser = await UserModel.findById(targetId);
    if (!targetUser) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      throw err;
    }
    if (requestingUser.role !== "admin" && requestingUser.id !== targetId) {
      const err = new Error("You can only view your own profile.");
      err.statusCode = 403;
      throw err;
    }
    return targetUser;
  },

  async updateUser(requestingUser, targetId, fields) {
    const targetUser = await UserModel.findById(targetId);
    if (!targetUser) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      throw err;
    }
    if (requestingUser.role !== "admin") {
      if (requestingUser.id !== targetId) {
        const err = new Error("You can only update your own profile.");
        err.statusCode = 403;
        throw err;
      }
      delete fields.role;
      delete fields.status;
    }
    if (fields.email && fields.email !== targetUser.email) {
      const conflict = await UserModel.findByEmail(fields.email);
      if (conflict) {
        const err = new Error("That email address is already in use.");
        err.statusCode = 409;
        throw err;
      }
    }
    if (fields.password) {
      fields.password = await bcrypt.hash(fields.password, 10);
    }
    return UserModel.update(targetId, fields);
  },

  async deleteUser(targetId) {
    const user = await UserModel.findById(targetId);
    if (!user) {
      const err = new Error("User not found.");
      err.statusCode = 404;
      throw err;
    }
    await UserModel.delete(targetId);
    return { message: `User "${user.name}" deleted successfully.` };
  },
};

module.exports = UserService;
