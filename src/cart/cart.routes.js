const express = require("express");
const {
  addToCart,
  getCartByBuyer,
  updateCartItem,
  removeCartItem,
  clearCart,
} = require("./cart.service");
const { authenticate } = require("../auth/middleware/auth.middleware");

const router = express.Router();

// get cart
router.get("/:buyerId", authenticate, async (req, res) => {
  try {
    const cart = await getCartByBuyer(req.params.buyerId);
    res.json({ success: true, data: cart });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// add item
router.post("/item", authenticate, async (req, res) => {
  try {
    const item = req.body;
    const result = await addToCart(item);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// update quantity
router.put("/item", authenticate, async (req, res) => {
  try {
    const { buyerId, productId, sellerId, quantity } = req.body;
    const result = await updateCartItem(buyerId, productId, sellerId, quantity);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// remove
router.delete("/item", authenticate, async (req, res) => {
  try {
    const { buyerId, productId, sellerId } = req.body;
    const result = await removeCartItem(buyerId, productId, sellerId);
    res.json({ success: true, data: result });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

// clear
router.delete("/:buyerId", authenticate, async (req, res) => {
  try {
    await clearCart(req.params.buyerId);
    res.json({ success: true });
  } catch (e) {
    res.status(400).json({ success: false, message: e.message });
  }
});

module.exports = router;
