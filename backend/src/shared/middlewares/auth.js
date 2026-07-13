const { verify } = require("jsonwebtoken");
const { AppError } = require("../errors/AppError");

function ensureAuthenticated(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    throw new AppError("JWT token is missing", 401);
  }

  const [, token] = authHeader.split(" ");

  try {
    const secret = process.env.JWT_SECRET || "df_secret_key_2026_jwt_token_sign";
    const decoded = verify(token, secret);

    const { sub, role, schoolId } = decoded;

    req.user = {
      id: sub,
      role,
      schoolId,
    };

    const { contextStorage } = require("../utils/context");
    const store = contextStorage.getStore();
    if (store) {
      store.schoolId = schoolId;
      store.userId = sub;
    }

    return next();
  } catch (err) {
    throw new AppError("Invalid JWT token", 401);
  }
}

module.exports = { ensureAuthenticated };
