// backend/routes/api/session.js
const express = require("express");

const {
  setTokenCookie,
  requireAuth,
  restoreUser,
  requireSpotOwner,
} = require("../../utils/auth");
const { Spot, SpotImage, User, Review } = require("../../db/models");
const { Sequelize } = require("sequelize");
const { check } = require("express-validator");
const { handleValidationErrors } = require("../../utils/validation");

const router = express.Router();

const validateSpot = [
  // check("ownerId").exists({ checkFalsy: true }).withMessage("Invalid owner"),
  check("address")
    .exists({ checkFalsy: true })
    .withMessage("Street address is required"),
  check("city").exists({ checkFalsy: true }).withMessage("City is required"),
  check("state").exists({ checkFalsy: true }).withMessage("State is required"),
  check("country")
    .exists({ checkFalsy: true })
    .withMessage("Country is required"),
  check("lat")
    .exists({ checkFalsy: true })
    .toFloat()
    .isDecimal()
    .withMessage("Latitude is not valid"),
  check("lng")
    .exists({ checkFalsy: true })
    .toFloat()
    .isDecimal()
    .withMessage("Longitude is not valid"),
  check("name")
    .isLength({ max: 50 })
    .withMessage("Name must be less than 50 characters"),
  check("description")
    .exists({ checkFalsy: true })
    .withMessage("Description is required"),
  check("price")
    .exists({ checkFalsy: true })
    .withMessage("Price per day is required"),
  handleValidationErrors,
];

//add image to spot by spot id
router.post(
  "/:spotId/images",
  requireAuth,
  requireSpotOwner,
  async (req, res, next) => {
    const { url, preview } = req.body;

    const newSpotImage = await SpotImage.create({
      spotId: parseInt(req.params.spotId),
      url,
      preview,
    });

    if (newSpotImage) {
      return res.status(200).json({
        id: newSpotImage.id,
        url: newSpotImage.url,
        preview: newSpotImage.preview,
      });
    }
  }
);

//get current users spots
router.get("/current", restoreUser, async (req, res, next) => {
  const Spots = await Spot.findAll({
    where: {
      ownerId: req.user.id,
    },
    attributes: [
      "id",
      "ownerId",
      "address",
      "city",
      "state",
      "country",
      "lat",
      "lng",
      "name",
      "description",
      "price",
      "createdAt",
      "updatedAt",
      [
        Sequelize.literal(
          "(SELECT AVG(stars) FROM Reviews WHERE Reviews.spotId = Spot.id)"
        ),
        "avgRating",
      ],
      [
        Sequelize.literal(
          "(SELECT url FROM SpotImages WHERE SpotImages.spotId = Spot.id AND SpotImages.preview = true LIMIT 1)"
        ),
        "previewImage",
      ],
    ],
  });

  if (Spots) {
    return res.status(200).json({
      Spots,
    });
  }
});

//create spot
router.post("/", validateSpot, requireAuth, async (req, res, next) => {
  if (req.user) {
    const {
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    } = req.body;

    const ownerId = req.user.id;

    const spot = await Spot.create({
      ownerId,
      address,
      city,
      state,
      country,
      lat,
      lng,
      name,
      description,
      price,
    });

    if (spot) return res.status(201).json(spot);
  }
});

// get all spots
router.get("/", async (req, res, next) => {
  const Spots = await Spot.findAll({
    attributes: [
      "id",
      "ownerId",
      "address",
      "city",
      "state",
      "country",
      "lat",
      "lng",
      "name",
      "description",
      "price",
      "createdAt",
      "updatedAt",
      [
        Sequelize.literal(
          "(SELECT AVG(stars) FROM Reviews WHERE Reviews.spotId = Spot.id)"
        ),
        "avgRating",
      ],
      [
        Sequelize.literal(
          "(SELECT url FROM SpotImages WHERE SpotImages.spotId = Spot.id AND SpotImages.preview = true LIMIT 1)"
        ),
        "previewImage",
      ],
    ],
  });

  if (Spots) {
    return res.status(200).json({
      Spots,
    });
  }

  res.status(400).json({ message: "Could not find Spots" });
  next(err);
});

module.exports = router;
