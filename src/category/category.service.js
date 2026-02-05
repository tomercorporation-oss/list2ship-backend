const prisma = require("../shared/database/prisma.service");

function slugify(name) {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, "and")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

class CategoryService {
  async getAll({ tree = false, parentId = null } = {}) {
    if (tree) {
      return this.getTree();
    }

    return prisma.category.findMany({
      where: parentId === undefined ? {} : { parentId },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, parentId: true, depth: true },
    });
  }

  async getTree() {
    const categories = await prisma.category.findMany({
      orderBy: { name: "asc" }, // Sort alphabetically by name
      select: { id: true, name: true, slug: true, parentId: true, depth: true },
    });

    const byId = new Map();
    categories.forEach((c) => byId.set(c.id, { ...c, children: [] }));

    const roots = [];
    categories.forEach((c) => {
      const node = byId.get(c.id);
      if (c.parentId) {
        const parent = byId.get(c.parentId);
        if (parent) parent.children.push(node);
      } else {
        roots.push(node);
      }
    });

    // Sort children alphabetically for each parent
    roots.forEach((root) => {
      if (root.children && root.children.length > 0) {
        root.children.sort((a, b) => a.name.localeCompare(b.name));
      }
    });

    return roots;
  }

  async getById(id) {
    return prisma.category.findUnique({
      where: { id },
      select: { id: true, name: true, slug: true, parentId: true, depth: true },
    });
  }

  async getChildren(id) {
    return prisma.category.findMany({
      where: { parentId: id },
      orderBy: { name: "asc" },
      select: { id: true, name: true, slug: true, parentId: true, depth: true },
    });
  }

  async create({ name, description, parentId }) {
    const parent = parentId
      ? await prisma.category.findUnique({ where: { id: parentId } })
      : null;
    const depth = parent ? parent.depth + 1 : 0;
    const slug = slugify(name);

    return prisma.category.create({
      data: { name, description, parentId, depth, slug },
      select: { id: true, name: true, slug: true, parentId: true, depth: true },
    });
  }

  async update(id, { name, description, parentId }) {
    let depth;
    if (parentId) {
      const parent = await prisma.category.findUnique({
        where: { id: parentId },
      });
      if (!parent) throw new Error("Parent category not found");
      depth = parent.depth + 1;
    }
    const data = {};
    if (name) {
      data.name = name;
      data.slug = slugify(name);
    }
    if (description !== undefined) data.description = description;
    if (parentId !== undefined) {
      data.parentId = parentId;
      data.depth = depth;
    }
    return prisma.category.update({
      where: { id },
      data,
      select: { id: true, name: true, slug: true, parentId: true, depth: true },
    });
  }
}

module.exports = new CategoryService();
