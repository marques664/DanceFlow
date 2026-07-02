require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { AppError } = require("./shared/errors/AppError");
const { authRouter } = require("./modules/auth/auth.routes");
const { modalityRouter } = require("./modules/modalities/modality.routes");

const app = express();

app.use(cors());
app.use(express.json());

// Routes
app.use("/auth", authRouter);
app.use("/modalities", modalityRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  console.error("Unexpected error:", err);

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

module.exports = { app };
