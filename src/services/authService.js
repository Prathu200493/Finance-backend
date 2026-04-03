// src/services/authService.js
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const UserModel = require("../models/userModel");

const JWT_SECRET    = process.env.JWT_SECRET    || "dev_secret_change_in_production";
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || "7d";
const SALT_ROUNDS   = 10;

const AuthService = {
  async register({ name, email, password, role = "viewer" }) {
    const existing = await UserModel.findByEmail(email);
    if (existing) {
      const err = new Error("An account with this email already exists.");
      err.statusCode = 409;
      throw err;
    }
    const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);
    const user = await UserModel.create({ name, email, password: hashedPassword, role });
    return { user, token: this._generateToken(user) };
  },

  async login({ email, password }) {
    const user = await UserModel.findByEmail(email);
    if (!user) {
      const err = new Error("Invalid email or password.");
      err.statusCode = 401;
      throw err;
    }
    if (user.status === "inactive") {
      const err = new Error("Your account has been deactivated.");
      err.statusCode = 403;
      throw err;
    }
    const passwordMatches = await bcrypt.compare(password, user.password);
    if (!passwordMatches) {
      const err = new Error("Invalid email or password.");
      err.statusCode = 401;
      throw err;
    }
    const { password: _omit, ...safeUser } = user;
    return { user: safeUser, token: this._generateToken(user) };
  },

  _generateToken(user) {
    return jwt.sign({ id: user.id, role: user.role }, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN });
  },
};

module.exports = AuthService;
