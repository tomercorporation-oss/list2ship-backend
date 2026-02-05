const express = require("express");
const CategoryController = require("./category.controller");
// TODO: attach auth + admin middleware for write operations when ready

const router = express.Router();

router.get("/", CategoryController.list);
router.get("/tree", CategoryController.tree);
router.get("/:id", CategoryController.get);
router.get("/:id/children", CategoryController.children);
router.post("/", CategoryController.create);
router.patch("/:id", CategoryController.update);

module.exports = router;
