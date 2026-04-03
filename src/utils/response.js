// src/utils/response.js
// Utility helpers for consistent API responses.
// Not used internally (controllers build responses directly),
// but exported for any future use or testing.

function success(res, data = {}, message = "Success", statusCode = 200) {
  return res.status(statusCode).json({ success: true, message, data });
}

function error(res, message = "An error occurred", statusCode = 500) {
  return res.status(statusCode).json({ success: false, message });
}

module.exports = { success, error };
