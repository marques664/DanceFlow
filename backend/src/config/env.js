require("dotenv").config();

const env = {
  port: process.env.PORT || 3333,
  nodeEnv: process.env.NODE_ENV || "development",
  jwtSecret: process.env.JWT_SECRET || "df_secret_key_2026_jwt_token_sign",
  corsOrigin: process.env.CORS_ORIGIN || "",
  databaseUrl: process.env.DATABASE_URL || "",
  directUrl: process.env.DIRECT_URL || "",
};

module.exports = { env };
