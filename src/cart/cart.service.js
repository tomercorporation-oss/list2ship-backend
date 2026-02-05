// In-memory cart store for MVP
// Each buyerId maps to array of cart items
const carts = new Map();

function ensureCart(buyerId) {
  if (!carts.has(buyerId)) carts.set(buyerId, []);
  return carts.get(buyerId);
}

async function getCartByBuyer(buyerId) {
  return { buyerId, items: ensureCart(buyerId) };
}

async function addToCart(item) {
  const required = [
    "buyerId",
    "productId",
    "sellerId",
    "name",
    "price",
    "moq",
    "quantity",
  ];
  for (const k of required) {
    if (item[k] == null) throw new Error(`Missing field: ${k}`);
  }
  if (item.moq <= 0) throw new Error("Invalid MOQ");
  if (item.quantity < item.moq)
    throw new Error(`Minimum order quantity is ${item.moq}`);
  if (typeof item.stock === "number" && item.moq > item.stock) {
    throw new Error("MOQ is higher than available stock — cannot add to cart.");
  }
  const cart = ensureCart(item.buyerId);
  const idx = cart.findIndex(
    (i) => i.productId === item.productId && i.sellerId === item.sellerId
  );
  if (idx >= 0) {
    const existing = cart[idx];
    const quantity = Math.max(existing.quantity + item.quantity, existing.moq);
    cart[idx] = { ...existing, quantity, total: quantity * existing.price };
  } else {
    const quantity = Math.max(item.quantity, item.moq);
    cart.push({ ...item, quantity, total: quantity * item.price });
  }
  return { buyerId: item.buyerId, items: cart };
}

async function updateCartItem(buyerId, productId, sellerId, quantity) {
  const cart = ensureCart(buyerId);
  const idx = cart.findIndex(
    (i) => i.productId === productId && i.sellerId === sellerId
  );
  if (idx < 0) throw new Error("Item not found");
  const item = cart[idx];
  const nextQty = Math.max(quantity, item.moq);
  cart[idx] = { ...item, quantity: nextQty, total: nextQty * item.price };
  return { buyerId, items: cart };
}

async function removeCartItem(buyerId, productId, sellerId) {
  const cart = ensureCart(buyerId);
  const next = cart.filter(
    (i) => !(i.productId === productId && i.sellerId === sellerId)
  );
  carts.set(buyerId, next);
  return { buyerId, items: next };
}

async function clearCart(buyerId) {
  carts.set(buyerId, []);
}

module.exports = {
  getCartByBuyer,
  addToCart,
  updateCartItem,
  removeCartItem,
  clearCart,
};
