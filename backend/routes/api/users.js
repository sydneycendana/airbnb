// backend/routes/api/users.js
const express = require("express");

const { setTokenCookie, requireAuth } = require("../../utils/auth");
const { User } = require("../../db/models");

const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

const validateSignup = [
  check("email")
    .exists({ checkFalsy: true })
    .isEmail()
    .withMessage("Please provide a valid email."),
  check("username")
    .exists({ checkFalsy: true })
    .isLength({ min: 4 })
    .withMessage("Please provide a username with at least 4 characters."),
  check("username").not().isEmail().withMessage("Username cannot be an email."),
  check("password")
    .exists({ checkFalsy: true })
    .isLength({ min: 6 })
    .withMessage("Password must be 6 characters or more."),
  check("firstName")
    .exists({ checkFalsy: true })
    .withMessage("First name is required."),
  check("lastName")
    .exists({ checkFalsy: true })
    .withMessage("Last name is required."),
  handleValidationErrors,
];

router.post("/", validateSignup, async (req, res) => {
  const { email, username, password, firstName, lastName } = req.body;

  const emailExists = await User.findOne({ where: { email } });

  if (emailExists) {
    const err = new Error("Email already exists.");
    err.status = 403;
    err.title = "Email already exists";
    err.errors = ["The provided credentials were invalid."];
    return next(err);
  }

  const user = await User.signup({
    email,
    username,
    password,
    firstName,
    lastName,
  });

  await setTokenCookie(res, user);

  return res.json({
    user,
  });
});

module.exports = router;
