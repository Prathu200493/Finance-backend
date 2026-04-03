// src/middleware/validate.js
// Zod-based request validation middleware.
// Keeps validation logic separate from controllers.

const { z } = require("zod");

// ─── Schemas ────────────────────────────────────────────────────────────────

const schemas = {
  // Auth
  register: z.object({
    name:     z.string().min(2, "Name must be at least 2 characters"),
    email:    z.string().email("Invalid email address"),
    password: z.string().min(6, "Password must be at least 6 characters"),
    role:     z.enum(["admin", "analyst", "viewer"]).optional(),
  }),

  login: z.object({
    email:    z.string().email("Invalid email address"),
    password: z.string().min(1, "Password is required"),
  }),

  // Users
  updateUser: z.object({
    name:   z.string().min(2).optional(),
    email:  z.string().email().optional(),
    role:   z.enum(["admin", "analyst", "viewer"]).optional(),
    status: z.enum(["active", "inactive"]).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),

  // Financial Records
  createRecord: z.object({
    amount:   z.number().positive("Amount must be a positive number"),
    type:     z.enum(["income", "expense"], { errorMap: () => ({ message: 'Type must be "income" or "expense"' }) }),
    category: z.string().min(1, "Category is required").max(100),
    date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Date must be in YYYY-MM-DD format"),
    notes:    z.string().max(500).optional(),
  }),

  updateRecord: z.object({
    amount:   z.number().positive().optional(),
    type:     z.enum(["income", "expense"]).optional(),
    category: z.string().min(1).max(100).optional(),
    date:     z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    notes:    z.string().max(500).optional(),
  }).refine((data) => Object.keys(data).length > 0, {
    message: "At least one field must be provided for update",
  }),
};

// ─── Middleware Factory ──────────────────────────────────────────────────────

/**
 * validate
 * Returns an Express middleware that validates req.body against a Zod schema.
 * On failure, responds with 400 and a list of field-level errors.
 */
function validate(schemaName) {
  return (req, res, next) => {
    const schema = schemas[schemaName];
    if (!schema) {
      return next(new Error(`Validation schema "${schemaName}" not found`));
    }

    const result = schema.safeParse(req.body);

    if (!result.success) {
      const errors = result.error.errors.map((e) => ({
        field:   e.path.join("."),
        message: e.message,
      }));

      return res.status(400).json({
        success: false,
        message: "Validation failed",
        errors,
      });
    }

    req.body = result.data; // Use the parsed (and coerced) data
    next();
  };
}

module.exports = { validate };
