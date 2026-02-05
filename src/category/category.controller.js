const categoryService = require("./category.service");

class CategoryController {
  async list(req, res) {
    try {
      const tree = req.query.tree === "true";
      const parentId = req.query.parentId;
      const categories = await categoryService.getAll({ tree, parentId });
      res.json({ success: true, data: categories });
    } catch (e) {
      console.error("💥 List categories error", e);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch categories" });
    }
  }

  async tree(req, res) {
    try {
      const data = await categoryService.getTree();
      res.json({ success: true, data });
    } catch (e) {
      console.error("💥 Tree categories error", e);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch category tree" });
    }
  }

  async get(req, res) {
    try {
      const category = await categoryService.getById(req.params.id);
      if (!category)
        return res
          .status(404)
          .json({ success: false, message: "Category not found" });
      res.json({ success: true, data: category });
    } catch (e) {
      console.error("💥 Get category error", e);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch category" });
    }
  }

  async children(req, res) {
    try {
      const data = await categoryService.getChildren(req.params.id);
      res.json({ success: true, data });
    } catch (e) {
      console.error("💥 Children categories error", e);
      res
        .status(500)
        .json({ success: false, message: "Failed to fetch children" });
    }
  }

  async create(req, res) {
    try {
      const { name, description, parentId } = req.body;
      if (!name)
        return res
          .status(400)
          .json({ success: false, message: "Name is required" });
      const category = await categoryService.create({
        name,
        description,
        parentId,
      });
      res.status(201).json({ success: true, data: category });
    } catch (e) {
      console.error("💥 Create category error", e);
      res
        .status(500)
        .json({
          success: false,
          message: e.message || "Failed to create category",
        });
    }
  }

  async update(req, res) {
    try {
      const { name, description, parentId } = req.body;
      const category = await categoryService.update(req.params.id, {
        name,
        description,
        parentId,
      });
      res.json({ success: true, data: category });
    } catch (e) {
      console.error("💥 Update category error", e);
      res
        .status(500)
        .json({
          success: false,
          message: e.message || "Failed to update category",
        });
    }
  }
}

module.exports = new CategoryController();
