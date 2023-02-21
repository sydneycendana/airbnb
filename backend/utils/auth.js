const jwt = require("jsonwebtoken");
const { jwtConfig } = require("../config");
const { User, Spot } = require("../db/models");

const { secret, expiresIn } = jwtConfig;

const setTokenCookie = (res, user) => {
  // Create the token.
  const token = jwt.sign(
    { data: user.toSafeObject() },
    secret,
    { expiresIn: parseInt(expiresIn) } // 604,800 seconds = 1 week
  );

  const isProduction = process.env.NODE_ENV === "production";

  // Set the token cookie
  res.cookie("token", token, {
    maxAge: expiresIn * 1000, // maxAge in milliseconds
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction && "Lax",
  });

  return token;
};

const restoreUser = (req, res, next) => {
  // token parsed from cookies
  const { token } = req.cookies;
  req.user = null;

  return jwt.verify(token, secret, null, async (err, jwtPayload) => {
    if (err) {
      return next();
    }

    try {
      const { id } = jwtPayload.data;
      req.user = await User.scope("currentUser").findByPk(id);
    } catch (e) {
      res.clearCookie("token");
      return next();
    }

    if (!req.user) res.clearCookie("token");

    return next();
  });
};

const requireAuth = function (req, _res, next) {
  if (req.user) return next();

  const err = new Error("Unauthorized");
  err.title = "Unauthorized";
  err.errors = ["Unauthorized"];
  err.status = 401;
  return next(err);
};

const requireSpotOwner = async (req, res, next) => {
  const spot = await Spot.findOne({
    where: { id: req.params.spotId },
  });

  if (!spot) {
    return res.status(404).json({
      message: "Spot couldn't be found",
      statusCode: 404,
    });
  }

  if (spot.ownerId !== req.user.id) {
    return res.status(403).json({
      message: "You are not authorized to create an image for this spot",
      statusCode: 403,
    });
  }

  next();
};

module.exports = { setTokenCookie, restoreUser, requireAuth, requireSpotOwner };
