// const { validationResult } = require("express-validator");

// const handleValidationErrors = (req, _res, next) => {
//   const validationErrors = validationResult(req);

//   if (!validationErrors.isEmpty()) {
//     const errors = validationErrors.array().map((error) => `${error.msg}`);

//     const err = Error("Bad request.");
//     err.errors = errors;
//     err.status = 400;
//     err.title = "Bad request.";
//     next(err);
//   }
//   next();
// };

// module.exports = {
//   handleValidationErrors,
// };

// backend/utils/validation.js
const { validationResult } = require("express-validator");

// middleware for formatting errors from express-validator middleware
// (to customize, see express-validator's documentation)
const handleValidationErrors = (req, res, next) => {
  const validationErrors = validationResult(req);

  if (!validationErrors.isEmpty()) {
    const errors = {};
    validationErrors
      .array()
      .forEach((error) => (errors[error.param] = error.msg));

    // const err = Error("Bad request.");
    const err = Error("Validation error");
    err.errors = errors;
    err.status = 400;
    // err.title = "Bad request.";
    err.title = "Validation error";
    next(err);

    // return res.json({
    //   message: "Validation error",
    //   statusCode: 400,
    //   errors,
    // });
  }

  next();
};

module.exports = {
  handleValidationErrors,
};
