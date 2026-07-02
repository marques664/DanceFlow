const { AppError } = require("../errors/AppError");

function ensureRole(allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      throw new AppError("Authentication required", 401);
    }

    if (!allowedRoles.includes(req.user.role)) {
      throw new AppError("Insufficient permissions", 403);
    }

    return next();
  };
}

module.exports = { ensureRole };
