// src/middleware/errorHandler.js
// Centralized error handling middleware.
// Catches all errors thrown or passed via next(err) in the application.

function errorHandler(err, req, res, next) {
  console.error(`[${new Date().toISOString()}] ERROR:`, err.message);

  // SQLite unique constraint violation
  if (err.code === "SQLITE_CONSTRAINT_UNIQUE") {
    return res.status(409).json({
      success: false,
      message: "A record with that value already exists.",
    });
  }

  // JWT errors (also caught in middleware, but just in case)
  if (err.name === "JsonWebTokenError") {
    return res.status(401).json({
      success: false,
      message: "Invalid authentication token.",
    });
  }

  // Default: Internal Server Error
  const statusCode = err.statusCode || 500;
  const message =
    process.env.NODE_ENV === "production"
      ? "An internal server error occurred."
      : err.message || "An internal server error occurred.";

  res.status(statusCode).json({ success: false, message });
}

module.exports = errorHandler;
