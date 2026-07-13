require("dotenv").config();
const express = require("express");
const cors = require("cors");
const helmet = require("helmet");
const rateLimit = require("express-rate-limit");
const { AppError } = require("./shared/errors/AppError");
const { contextMiddleware } = require("./shared/middlewares/context");
const { logger } = require("./shared/utils/logger");

const { authRouter } = require("./modules/auth/auth.routes");
const { tenantRouter } = require("./modules/tenants/tenant.routes");
const { modalityRouter } = require("./modules/modalities/modality.routes");
const { studentRouter } = require("./modules/students/student.routes");
const { classRouter } = require("./modules/classes/class.routes");
const { userRouter } = require("./modules/users/user.routes");
const { teacherRouter } = require("./modules/teachers/teacher.routes");
const { lessonRouter } = require("./modules/lessons/lesson.routes");
const { dashboardRouter } = require("./modules/dashboard/dashboard.routes");

const app = express();

// Security Headers (Helmet)
app.use(helmet());

// CORS config (supporting tenant subdomains in production, localhost in development)
const allowedOrigins = process.env.NODE_ENV === 'production' 
  ? [/\.danceflow\.com$/] 
  : [/^http:\/\/localhost:/, /^http:\/\/127\.0\.0\.1:/];
app.use(cors({
  origin: allowedOrigins,
  credentials: true
}));

app.use(express.json());

// Request context middleware
app.use(contextMiddleware);

// Global Rate Limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  message: { status: "error", message: "Too many requests from this IP, please try again after 15 minutes." },
  standardHeaders: true,
  legacyHeaders: false
});
app.use(globalLimiter);

// Login Specific Rate Limiting
const loginLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // Limit each IP to 10 failed login attempts per hour
  message: { status: "error", message: "Too many login attempts, please try again after an hour." },
  standardHeaders: true,
  legacyHeaders: false
});

// Routes
app.use("/auth", loginLimiter, authRouter);
app.use("/tenants", tenantRouter);
app.use("/modalities", modalityRouter);
app.use("/students", studentRouter);
app.use("/classes", classRouter);
app.use("/users", userRouter);
app.use("/teachers", teacherRouter);
app.use("/lessons", lessonRouter);
app.use("/dashboard", dashboardRouter);

// Global Error Handler
app.use((err, req, res, next) => {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      status: "error",
      message: err.message,
    });
  }

  logger.error("Unexpected error", { error: err.message, stack: err.stack });

  return res.status(500).json({
    status: "error",
    message: "Internal server error",
  });
});

module.exports = { app };
