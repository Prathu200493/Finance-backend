// src/app.js
// Application entry point — initializes DB schema, then starts the server.

require("dotenv").config();

const express  = require("express");
const { initializeSchema } = require("./models/database");

const authRoutes   = require("./routes/authRoutes");
const userRoutes   = require("./routes/userRoutes");
const recordRoutes = require("./routes/recordRoutes");
const errorHandler = require("./middleware/errorHandler");

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`);
  next();
});

app.use("/api/auth",    authRoutes);
app.use("/api/users",   userRoutes);
app.use("/api/records", recordRoutes);

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok", timestamp: new Date().toISOString() });
});

app.use((_req, res) => {
  res.status(404).json({ success: false, message: "Route not found." });
});

app.use(errorHandler);

// Initialize DB schema first, then start listening
initializeSchema()
  .then(() => {
    app.listen(PORT, () => {
      console.log(`\n🚀 Finance Backend running on http://localhost:${PORT}`);
      console.log(`   Environment : ${process.env.NODE_ENV || "development"}`);
      console.log(`   Health check: http://localhost:${PORT}/health\n`);
    });
  })
  .catch((err) => {
    console.error("❌ Failed to initialize database:", err.message);
    process.exit(1);
  });

module.exports = app;
