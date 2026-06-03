// ...existing code...
require("dotenv").config();
const cors = require("cors");
const express = require("express");
const jwt = require("jsonwebtoken");
const { createPublicKey } = require("crypto");
const { MongoClient, ObjectId } = require("mongodb");
const Stripe = require("stripe");
const { sendEmail, ADMIN_EMAIL } = require("./services/emailService.js");


const app = express();

// Test endpoints removed to prevent automatic email sending during development

const port = Number(process.env.PORT || 5000);
const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/vrbites";
// ADMIN_EMAIL now loaded from .env and emailService.js
const REQUIRED_ENV_VARS = ["CLIENT_URL", "MONGODB_URI", "ADMIN_EMAIL", "CLERK_SECRET_KEY"];
for (const name of REQUIRED_ENV_VARS) {
  if (!process.env[name]) {
    console.warn(`[ENV_WARNING] Missing ${name}. Some production features may be limited until it is configured.`);
  }
}
if (!process.env.JWT_SECRET) {
  console.warn("[ENV_WARNING] Missing JWT_SECRET. Clerk authentication is used for dashboard/API access.");
}
const VALID_ORDER_STATUSES = ["PLACED", "CONFIRMED", "IN PROGRESS", "DELIVERED", "CANCELLED"];
const RESTAURANT_TABLE_COUNT = Math.max(1, Number(process.env.RESTAURANT_TABLE_COUNT || 10));
const BLOCKING_RESERVATION_STATUSES = new Set(["pending", "confirmed", "reserved", "in progress"]);
const ORDER_STATUS_FLOW = {
  PLACED: ["PLACED", "CONFIRMED"],
  CONFIRMED: ["CONFIRMED", "IN PROGRESS"],
  "IN PROGRESS": ["IN PROGRESS", "DELIVERED"],
  DELIVERED: ["DELIVERED"],
  CANCELLED: ["CANCELLED"],
};

// Delivery person names for random assignment
const DELIVERY_PERSONS = [
  "Sanjay Gupta",
  "Priya Sharma",
  "Rahul Verma",
  "Sneha Reddy",
  "Arjun Patel",
  "Kavya Rao",
];

function getRandomDeliveryPerson() {
  const randomIndex = Math.floor(Math.random() * DELIVERY_PERSONS.length);
  return DELIVERY_PERSONS[randomIndex];
}

const stripeSecretKey = process.env.STRIPE_SECRET_KEY;
if (!stripeSecretKey) {
  console.warn("[ENV_WARNING] Missing STRIPE_SECRET_KEY. Payment routes will return 503 instead of crashing the API.");
}

const stripe = stripeSecretKey ? new Stripe(stripeSecretKey) : null;

function normalizeOrigin(origin = "") {
  return String(origin || "").replace(/\/+$/, "");
}

app.use(
  cors({
    origin: function (origin, callback) {
      // Allow requests with no origin (mobile apps, curl, server-to-server)
      if (!origin) return callback(null, true);
      const allowed = [
        process.env.CLIENT_URL,
        process.env.FRONTEND_URL,
        "https://vr-bites-restaurant-management-edxy-5p9mnhp99.vercel.app",
        "http://localhost:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
      ].filter(Boolean).map(normalizeOrigin);
      // Allow any vercel.app subdomain for preview deployments
      if (allowed.includes(normalizeOrigin(origin)) || /^https:\/\/[a-z0-9-]+\.vercel\.app$/i.test(origin)) {
        return callback(null, true);
      }
      return callback(null, false);
    },
    credentials: true,
  })
);
app.use(express.json());

const client = new MongoClient(mongoUri);
let db;
let dbConnectPromise = null;

const FORBIDDEN_BODY = { success: false, message: "Access denied" };
const jwksCache = new Map();
const clerkUserEmailCache = new Map();

function getAuthPublicKey() {
  const key = process.env.CLERK_JWT_KEY || process.env.CLERK_PEM_PUBLIC_KEY || process.env.JWT_PUBLIC_KEY || "";
  return key.replace(/\\n/g, "\n").trim();
}

function getJwtHeader(token) {
  try {
    const [header] = String(token || "").split(".");
    return JSON.parse(Buffer.from(header, "base64url").toString("utf8"));
  } catch (_error) {
    return {};
  }
}

function getJwtPayload(token) {
  try {
    const [, payload] = String(token || "").split(".");
    return JSON.parse(Buffer.from(payload, "base64url").toString("utf8"));
  } catch (_error) {
    return {};
  }
}

async function getClerkJwks(issuer) {
  const normalizedIssuer = String(issuer || "").replace(/\/+$/, "");
  let issuerHost = "";
  try {
    issuerHost = new URL(normalizedIssuer).hostname;
  } catch (_error) {
    issuerHost = "";
  }

  if (
    !issuerHost ||
    (
      !issuerHost.endsWith(".clerk.accounts.dev") &&
      !issuerHost.startsWith("clerk.") &&
      !issuerHost.includes(".clerk.")
    )
  ) {
    throw new Error("Unsupported token issuer.");
  }

  const cached = jwksCache.get(normalizedIssuer);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.keys;
  }

  const response = await fetch(`${normalizedIssuer}/.well-known/jwks.json`);
  if (!response.ok) {
    throw new Error("Unable to load Clerk JWKS.");
  }

  const data = await response.json();
  const keys = Array.isArray(data.keys) ? data.keys : [];
  jwksCache.set(normalizedIssuer, { keys, expiresAt: Date.now() + 60 * 60 * 1000 });
  return keys;
}

async function resolveVerificationKey(token) {
  const configuredKey = getAuthPublicKey();
  if (configuredKey) {
    return configuredKey;
  }

  const header = getJwtHeader(token);
  const payload = getJwtPayload(token);
  const keys = await getClerkJwks(payload.iss);
  const jwk = keys.find((key) => key.kid === header.kid);

  if (!jwk) {
    throw new Error("No matching Clerk signing key.");
  }

  return createPublicKey({ key: jwk, format: "jwk" }).export({ type: "spki", format: "pem" });
}

async function getClerkUserEmail(clerkId) {
  const id = String(clerkId || "").trim();
  if (!id || !process.env.CLERK_SECRET_KEY) {
    return "";
  }

  const cached = clerkUserEmailCache.get(id);
  if (cached && cached.expiresAt > Date.now()) {
    return cached.email;
  }

  const response = await fetch(`https://api.clerk.com/v1/users/${encodeURIComponent(id)}`, {
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    return "";
  }

  const data = await response.json();
  const primaryId = data.primary_email_address_id;
  const primaryEmail = Array.isArray(data.email_addresses)
    ? data.email_addresses.find((item) => item.id === primaryId)?.email_address || data.email_addresses[0]?.email_address
    : "";
  const email = normalizeEmail(primaryEmail);

  if (email) {
    clerkUserEmailCache.set(id, { email, expiresAt: Date.now() + 10 * 60 * 1000 });
  }

  return email;
}

function getBearerToken(req) {
  const header = String(req.headers.authorization || "");
  const [scheme, token] = header.split(" ");
  return /^Bearer$/i.test(scheme) && token ? token.trim() : "";
}

function getEmailFromClaims(claims = {}) {
  const candidates = [
    claims.email,
    claims.email_address,
    claims.primary_email_address,
    claims.primaryEmailAddress,
    claims["https://clerk.com/email"],
  ];
  return normalizeEmail(candidates.find(Boolean));
}

function getRoleForEmail(email) {
  return normalizeEmail(email) === normalizeEmail(ADMIN_EMAIL) ? "ADMIN" : "USER";
}

function accessDenied(res) {
  res.status(403).json(FORBIDDEN_BODY);
}

async function authenticate(req, res, next) {
  const token = getBearerToken(req);

  if (!token) {
    accessDenied(res);
    return;
  }

  try {
    const publicKey = await resolveVerificationKey(token);
    const claims = jwt.verify(token, publicKey, { algorithms: ["RS256"] });
    let email = getEmailFromClaims(claims);

    if (!email && claims.sub) {
      email = await getClerkUserEmail(claims.sub);
    }

    if (!email && claims.sub && db) {
      const { users } = await getCollections();
      const user = await users.findOne({ clerkId: claims.sub });
      email = normalizeEmail(user?.email);
    }

    if (!email && claims.sub && req.body?.clerkId === claims.sub) {
      email = normalizeEmail(req.body?.email);
    }

    if (!email) {
      accessDenied(res);
      return;
    }

    req.auth = {
      claims,
      email,
      role: getRoleForEmail(email),
    };
    next();
  } catch (_error) {
    accessDenied(res);
  }
}

function requireAdmin(req, res, next) {
  authenticate(req, res, () => {
    if (req.auth?.role !== "ADMIN") {
      accessDenied(res);
      return;
    }
    next();
  });
}

function requireUser(req, res, next) {
  authenticate(req, res, () => {
    if (req.auth?.role !== "USER") {
      accessDenied(res);
      return;
    }
    next();
  });
}

function ensureSameUserEmail(req, res, email) {
  if (normalizeEmail(req.auth?.email) !== normalizeEmail(email)) {
    accessDenied(res);
    return false;
  }
  return true;
}

function getRecordOwnerEmail(record = {}, type = "order") {
  return type === "reservation" ? normalizeEmail(record.email) : normalizeEmail(record.userEmail);
}

function formatUSD(value) {
  return new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }).format(Number(value || 0));
}

async function fireAndForgetEmail(payload) {
  console.log("[EMAIL_DEBUG] sendEmail requested:", {
    to: payload?.to,
    subject: payload?.subject,
    template: payload?.template,
    source: payload?.source || "unknown",
  });
  try {
    const sent = await sendEmail(payload);
    if (sent) {
      console.log("[EMAIL_SUCCESS] Email sent", payload.subject, payload.to);
      return { emailStatus: "success", emailMessage: "Email sent successfully." };
    }
    console.error("[EMAIL_ERROR] sendEmail returned false", payload.subject, payload.to);
    return { emailStatus: "error", emailMessage: "Email delivery failed. Check server logs." };
  } catch (error) {
    console.error("[EMAIL_ERROR] Email send failed:", error.message || error);
    return { emailStatus: "error", emailMessage: error.message || "Email delivery failed." };
  }
}

function mergeEmailResults(results = []) {
  const attempted = results.filter(Boolean);
  if (!attempted.length) return { emailStatus: "skipped", emailMessage: "No recipient email available." };
  const failed = attempted.find((result) => result.emailStatus === "error");
  if (failed) return failed;
  return { emailStatus: "success", emailMessage: "Email sent successfully." };
}

async function notifyAdminNewOrder(order = {}) {
  return fireAndForgetEmail({
    to: ADMIN_EMAIL,
    subject: "[VR BITES] New Order Received",
    template: "adminNotificationTemplate",
    source: "order-admin-alert",
    data: {
      eventType: "New Order",
      message: `Order #${order.orderId} placed by ${order.customerName}`,
      orderId: order.orderId,
      customerName: order.customerName,
      totalPrice: order.totalPrice
    },
  });
}

async function notifyReservationCreated(reservation = {}) {
  console.log("[RESERVATION_DEBUG] notifyReservationCreated:", {
    reservationId: reservation.reservationId,
    email: reservation.email,
  });
  const results = [];
  if (reservation.email) {
    results.push(await fireAndForgetEmail({
      to: reservation.email,
      subject: "Reservation Request Received – VR BITES",
      template: "reservationTemplate",
      source: "reservation-pending-notification",
      data: { ...reservation, status: "PENDING" },
    }));
  }
  results.push(await fireAndForgetEmail({
    to: ADMIN_EMAIL,
    subject: "[VR BITES] New Reservation Request - Action Required",
    template: "adminNotificationTemplate",
    source: "reservation-admin-alert",
    data: {
      eventType: "New Reservation",
      message: `Reservation #${reservation.reservationId} submitted by ${reservation.customerName}`,
      reservationId: reservation.reservationId,
      customerName: reservation.customerName,
      email: reservation.email,
      phone: reservation.phone,
      date: reservation.date,
      time: reservation.time,
      guests: reservation.guests,
      tableNumber: reservation.tableNumber,
      depositAmount: formatUSD(reservation.depositAmount),
      paymentStatus: reservation.paymentStatus || (reservation.depositPaid ? "Paid" : "Pending"),
      paymentIntentId: reservation.paymentIntentId,
    },
  }));
  return mergeEmailResults(results);
}

async function notifyReservationPaymentReceipt(reservation = {}) {
  if (!reservation.email || !reservation.paymentIntentId) {
    return { emailStatus: "skipped", emailMessage: "No reservation payment receipt required." };
  }
  return fireAndForgetEmail({
    to: reservation.email,
    subject: "VR BITES Payment Receipt",
    template: "paymentReceiptTemplate",
    source: "reservation-payment-receipt",
    data: {
      receiptType: "reservation",
      customerName: reservation.customerName,
      reservationId: reservation.reservationId,
      depositAmount: reservation.depositAmount,
      paymentStatus: reservation.paymentStatus || "Paid",
      paymentId: reservation.paymentIntentId,
      date: reservation.date,
      time: reservation.time,
      tableNumber: reservation.tableNumber,
      guests: reservation.guests,
      orderDate: new Date(reservation.createdAt || Date.now()).toLocaleDateString("en-US"),
      total: reservation.depositAmount,
      subtotal: reservation.depositAmount,
      tax: 0,
      deliveryFee: 0,
    },
  });
}

async function notifyReservationStatusChanged(reservation = {}) {
  if (!reservation.email) return { emailStatus: "skipped", emailMessage: "No reservation email available." };
  console.log("[RESERVATION_DEBUG] notifyReservationStatusChanged:", {
    reservationId: reservation.reservationId,
    email: reservation.email,
    status: reservation.status,
  });
  const statusSubjects = {
    PENDING: "Reservation Request Received \u2013 VR BITES",
    CONFIRMED: "Reservation Confirmed \u2013 VR BITES",
    DECLINED: "Reservation Update from VR Bites",
    CANCELLED: "Reservation Update from VR Bites",
    COMPLETED: "Thank You for Dining with VR Bites",
  };
  const normalizedStatus = String(reservation.status || "PENDING").toUpperCase();
  const subject = statusSubjects[normalizedStatus] || `Your Reservation Update â€” ${reservation.status}`;
  console.log("[RESERVATION_STATUS] Sending status email:", { reservationId: reservation.reservationId, status: normalizedStatus, subject });
  return fireAndForgetEmail({
    to: reservation.email,
    subject,
    template: "reservationTemplate",
    source: "reservation-status-update",
    data: { ...reservation, status: normalizedStatus },
  });
}

async function notifyOrderPlaced(order = {}) {
  if (!order.userEmail) return { emailStatus: "skipped", emailMessage: "No order email available." };
  const appUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://vrbites.com";
  const orderDetailId = order._id?.toString?.() || order.id || "";
  const orderData = {
    customerName: order.customerName,
    orderId: order.orderId,
    items: [{ name: order.foodName || order.foodItem, qty: order.quantity, price: order.price }],
    total: order.totalPrice,
    status: order.orderStatus || order.status,
    orderLink: orderDetailId ? `${appUrl}/order-details/${orderDetailId}` : `${appUrl}/my-orders`,
  };
  console.log("[ORDER_STATUS] notifyOrderPlaced:", { orderId: order.orderId, email: order.userEmail });
  const customerResult = await fireAndForgetEmail({
    to: order.userEmail,
    subject: "Your Order Has Been Placed Successfully - VR BITES",
    template: "orderSuccessTemplate",
    source: "order-placed-customer",
    data: orderData,
  });
  // Notify admin
  await fireAndForgetEmail({
    to: ADMIN_EMAIL,
    subject: "[VR BITES] New Order #" + (order.orderId || ""),
    template: "adminNotificationTemplate",
    source: "order-placed-admin",
    data: {
      eventType: "New Order Received",
      message: "Order #" + (order.orderId || "") + " placed by " + (order.customerName || ""),
      customerName: order.customerName,
      email: order.userEmail,
      orderId: order.orderId,
      totalPrice: order.totalPrice,
    },
  });
  return customerResult;
}

async function notifyPaymentReceipt(order = {}, paymentIntentId = "") {
  if (!order.userEmail) return { emailStatus: "skipped", emailMessage: "No order email available." };
  console.log("[PAYMENT_RECEIPT] notifyPaymentReceipt:", { orderId: order.orderId, paymentIntentId, email: order.userEmail });
  return fireAndForgetEmail({
    to: order.userEmail,
    subject: "VR BITES Payment Receipt",
    template: "paymentReceiptTemplate",
    source: "payment-receipt",
    data: {
      orderId: order.orderId,
      customerName: order.customerName,
      items: [{ name: order.foodName || order.foodItem, qty: order.quantity, price: order.price }],
      subtotal: order.price * order.quantity,
      tax: 0,
      deliveryFee: 0,
      total: order.totalPrice,
      paymentStatus: order.paymentStatus || "Paid",
      orderDate: new Date(order.createdAt || Date.now()).toLocaleDateString(),
      paymentId: paymentIntentId || order.paymentIntentId,
      estimatedDelivery: "30-45 min",
    },
  });
}

async function notifyOrderStatusChanged(order = {}, status = "") {
  if (!order.userEmail) return { emailStatus: "skipped", emailMessage: "No order email available." };
  const templateByStatus = {
    PLACED: "orderSuccessTemplate",
    CONFIRMED: "orderConfirmedTemplate",
    "IN PROGRESS": "orderPreparingTemplate",
    DELIVERED: "deliveredTemplate",
    CANCELLED: "cancelledTemplate",
  };
  const subjectByStatus = {
    PLACED: "Your Order Has Been Placed - VR BITES",
    CONFIRMED: "Your Order Has Been Confirmed - VR BITES",
    "IN PROGRESS": "Your Food Is Being Prepared - VR BITES",
    DELIVERED: "Order Delivered Successfully - VR BITES",
    CANCELLED: "Your Order Has Been Cancelled - VR BITES",
  };
  const template = templateByStatus[status] || "orderSuccessTemplate";
  const orderDetailId = order._id?.toString?.() || order.id || "";
  const orderData = {
    customerName: order.customerName,
    orderId: order.orderId,
    items: [{ name: order.foodName || order.foodItem, qty: order.quantity, price: order.price }],
    total: order.totalPrice,
    status,
    orderLink: orderDetailId
      ? `${process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://vrbites.com"}/order-details/${orderDetailId}`
      : `${process.env.CLIENT_URL || process.env.FRONTEND_URL || "https://vrbites.com"}/my-orders`,
  };
  console.log("[ORDER_STATUS] notifyOrderStatusChanged:", { orderId: order.orderId, email: order.userEmail, status, template });
  return fireAndForgetEmail({
    to: order.userEmail,
    subject: subjectByStatus[status] || "Order Status Updated",
    template,
    source: "order-status-update",
    data: orderData,
  });
}

function normalizeEmail(email) {
  return String(email || "").trim().toLowerCase();
}

function toPositiveNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0;
}

function normalizeReservationStatus(status) {
  return String(status || "Pending").trim().toLowerCase();
}

function isBlockingReservation(reservation = {}) {
  const status = normalizeReservationStatus(reservation.reservationStatus || reservation.status);
  return BLOCKING_RESERVATION_STATUSES.has(status);
}

function normalizeTableNumber(value) {
  return String(value || "").replace(/^table\s*/i, "").trim();
}

function normalizeReservationDateValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^\d{4}-\d{2}-\d{2}$/.test(raw)) return raw;
  const parsed = new Date(raw);
  if (Number.isNaN(parsed.getTime())) return raw;
  return parsed.toISOString().slice(0, 10);
}

function normalizeReservationTimeValue(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";

  const compact = raw.toLowerCase().replace(/\s+/g, " ");
  const meridiemMatch = compact.match(/^(\d{1,2})(?::(\d{2}))?\s*(am|pm)$/);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2] || 0);
    const meridiem = meridiemMatch[3];
    if (meridiem === "pm" && hours < 12) hours += 12;
    if (meridiem === "am" && hours === 12) hours = 0;
    return `${String(hours).padStart(2, "0")}:${String(minutes).padStart(2, "0")}`;
  }

  const twentyFourHourMatch = compact.match(/^(\d{1,2}):(\d{2})/);
  if (twentyFourHourMatch) {
    return `${String(Number(twentyFourHourMatch[1])).padStart(2, "0")}:${twentyFourHourMatch[2]}`;
  }

  return compact;
}

function buildRestaurantTables() {
  return Array.from({ length: RESTAURANT_TABLE_COUNT }, (_item, index) => String(index + 1));
}

async function getReservedTablesForSlot(reservations, date, time) {
  const selectedDate = normalizeReservationDateValue(date);
  const selectedTime = normalizeReservationTimeValue(time);
  const records = await reservations.find({
    tableNumber: { $exists: true, $ne: "" },
  }).toArray();

  return new Set(
    records
      .filter((reservation) => {
        const recordDate = normalizeReservationDateValue(reservation.date || reservation.reservationDate);
        const recordTime = normalizeReservationTimeValue(reservation.time || reservation.reservationTime);
        return recordDate === selectedDate && recordTime === selectedTime && isBlockingReservation(reservation);
      })
      .map((reservation) => normalizeTableNumber(reservation.tableNumber))
      .filter(Boolean)
  );
}

function withObjectId(id) {
  return ObjectId.isValid(id) ? new ObjectId(id) : null;
}

function dayRange(date = new Date()) {
  const start = new Date(date);
  start.setHours(0, 0, 0, 0);
  const end = new Date(date);
  end.setHours(23, 59, 59, 999);
  return { start, end };
}

function makePublicDoc(doc) {
  if (!doc) {
    return doc;
  }

  const { _id, ...rest } = doc;

  return {
    id: _id?.toString(),
    ...rest,
  };
}

function makeCode(prefix) {
  const randomPart = Math.floor(Math.random() * 9000 + 1000);
  return `${prefix}${Date.now()}${randomPart}`;
}

function parseItemPrice(priceValue) {
  if (typeof priceValue === "number") {
    return toPositiveNumber(priceValue);
  }

  return toPositiveNumber(String(priceValue || "").replace(/[^\d.]/g, ""));
}

function sanitizeOrderStatus(status) {
  const cleanStatus = String(status || "").trim().toUpperCase();

  return VALID_ORDER_STATUSES.includes(cleanStatus) ? cleanStatus : "PLACED";
}

function canMoveOrderStatus(currentStatus, nextStatus) {
  const current = sanitizeOrderStatus(currentStatus);
  const next = sanitizeOrderStatus(nextStatus);
  return (ORDER_STATUS_FLOW[current] || ["PLACED"]).includes(next);
}

function buildOrderDocument(payload = {}) {
  const quantity = toPositiveNumber(payload.quantity) || 1;
  const price = parseItemPrice(payload.price);
  const totalPrice = Number((price * quantity).toFixed(2));

  const orderStatus = sanitizeOrderStatus(payload.orderStatus || payload.status || "PLACED");
  const paymentStatus = payload.paymentStatus || "Paid";
  const userEmail = normalizeEmail(payload.userEmail || payload.customerEmail);
  const deliveryAddress = String(payload.deliveryAddress || payload.address || "").trim();
  const phone = String(payload.phone || payload.customerPhone || "").trim();

  return {
    orderId: payload.orderId || makeCode("ORD-"),
    foodName: payload.foodName || payload.foodItem || "",
    foodItem: payload.foodName || payload.foodItem || "",
    foodImage: payload.foodImage || payload.image || "",
    quantity,
    price,
    totalPrice,
    orderStatus,
    paymentStatus,
    paymentIntentId: payload.paymentIntentId || "",
    customerName: payload.customerName || "",
    userEmail,
    phone,
    deliveryAddress,
    deliveryPerson: getRandomDeliveryPerson(),
    placedAt: new Date(),
    confirmedAt: null,
    inProgressAt: null,
    deliveredAt: null,
    createdAt: payload.createdAt ? new Date(payload.createdAt) : new Date(),
    updatedAt: new Date(),
  };
}

function validateOrderInput(order) {
  if (!order.foodName) return "Food name is required.";
  if (!order.userEmail) return "User email is required.";
  if (!order.customerName || order.customerName.length < 3) return "Full name is required.";
  // Accept 10-15 digit phone numbers (with or without + prefix, spaces, dashes)
  const cleanPhone = String(order.phone || "").replace(/[\s\-\+]/g, "");
  if (!/^\d{10,15}$/.test(cleanPhone)) return "Please enter a valid phone number (10-15 digits).";
  if (!order.deliveryAddress || order.deliveryAddress.length < 5) return "Delivery address is required.";
  if (order.quantity < 1) return "Quantity must be at least 1.";
  if (order.price <= 0 || order.totalPrice <= 0) return "Price must be greater than 0.";
  if (order.userEmail === ADMIN_EMAIL) return "Admin accounts cannot place food orders.";
  return "";
}

async function ensureDatabase() {
  if (db) {
    return db;
  }

  if (!dbConnectPromise) {
    dbConnectPromise = client.connect()
      .then(() => {
        db = client.db();
        return db;
      })
      .catch((error) => {
        dbConnectPromise = null;
        throw error;
      });
  }

  return dbConnectPromise;
}

async function getCollections() {
  await ensureDatabase();

  return {
    users: db.collection("users"),
    orders: db.collection("orders"),
    menuitems: db.collection("menuitems"),
    reservations: db.collection("reservations"),
    newsletterSubscribers: db.collection("newsletterSubscribers"),
  };
}

app.get("/api/newsletter/status/:email", async (req, res) => {
  const email = normalizeEmail(req.params.email);

  if (!email) {
    res.status(400).json({ error: "Valid email is required." });
    return;
  }

  try {
    const { newsletterSubscribers } = await getCollections();
    const existing = await newsletterSubscribers.findOne({ email });
    res.json({ subscribed: Boolean(existing) });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/newsletter/subscribe", async (req, res) => {
  const email = normalizeEmail(req.body?.email);
  const customerName = String(req.body?.customerName || "").trim() || "Customer";
  console.log("[EMAIL_DEBUG] newsletter subscribe route hit:", { email, customerName });

  if (!email) {
    res.status(400).json({ error: "Valid email is required." });
    return;
  }

  if (email === ADMIN_EMAIL) {
    res.status(403).json({ error: "Admin account does not require newsletter subscription." });
    return;
  }

  try {
    const { newsletterSubscribers } = await getCollections();
    const existing = await newsletterSubscribers.findOne({ email });

    if (existing) {
      res.json({
        subscribed: true,
        alreadySubscribed: true,
        message: "You are already subscribed to VR BITES updates.",
        emailStatus: "skipped",
      });
      return;
    }

    const subscribedAt = new Date();
    await newsletterSubscribers.insertOne({ email, subscribedAt });

    const emailResult = await fireAndForgetEmail({
      to: email,
      subject: "Welcome to VR BITES Exclusive Updates",
      template: "subscriptionTemplate",
      source: "newsletter-subscribe",
      data: { customerName, email }
    });

    // Admin notification for new subscriber
    await fireAndForgetEmail({
      to: ADMIN_EMAIL,
      subject: "[VR BITES] New Newsletter Subscriber",
      template: "adminNotificationTemplate",
      source: "newsletter-admin-alert",
      data: {
        eventType: "New Subscriber",
        message: email + " just subscribed to the VR Bites newsletter.",
        customerName,
        email,
      },
    });

    console.log("[EMAIL_SUCCESS] Newsletter subscription email sent to:", email);
    res.status(201).json({ subscribed: true, message: "Thank you for subscribing to our newsletter!", ...emailResult });
  } catch (error) {
    console.error("[EMAIL_ERROR] newsletter subscribe failed:", error.message);
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/health", (_req, res) => {
  res.json({ ok: true });
});

app.use(/^\/api\/admin(\/.*)?$/, requireAdmin, (_req, res) => {
  res.status(404).json({ success: false, message: "Admin API route not found" });
});

app.use(/^\/admin(\/.*)?$/, requireAdmin, (_req, res) => {
  res.status(404).json({ success: false, message: "Admin route not found" });
});

app.use(/^\/dashboard(\/.*)?$/, requireAdmin, (_req, res) => {
  res.status(404).json({ success: false, message: "Admin route not found" });
});

app.post("/api/users/sync", authenticate, async (req, res) => {
  const { clerkId, email, fullName, avatar } = req.body || {};
  const normalizedEmail = normalizeEmail(email);

  if (!normalizedEmail) {
    res.status(400).json({ error: "Email is required." });
    return;
  }

  if (!ensureSameUserEmail(req, res, normalizedEmail)) {
    return;
  }

  try {
    const { users } = await getCollections();
    const payload = {
      clerkId: clerkId || null,
      email: normalizedEmail,
      fullName: fullName || "Guest",
      avatar: avatar || "",
      lastLoginAt: new Date(),
    };

    await users.updateOne(
      { email: normalizedEmail },
      {
        $set: payload,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );

    const user = await users.findOne({ email: normalizedEmail });
    res.json(makePublicDoc(user));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/users", requireAdmin, async (_req, res) => {
  try {
    const { users } = await getCollections();
    const records = await users.find().sort({ createdAt: -1 }).toArray();
    res.json(records.map(makePublicDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/payments/create-intent", requireUser, async (req, res) => {
  const payload = req.body || {};
  const order = buildOrderDocument(payload);
  const validationError = validateOrderInput(order);

  if (validationError) {
    console.error("[PAYMENT_ERROR] Validation failed:", validationError);
    res.status(400).json({ error: validationError });
    return;
  }

  if (!ensureSameUserEmail(req, res, order.userEmail)) {
    return;
  }

  if (!stripe) {
    res.status(503).json({ error: "Payment service is not configured. Please add STRIPE_SECRET_KEY to server .env." });
    return;
  }

  try {
    const amountInCents = Math.round(order.totalPrice * 100);
    console.log("[PAYMENT_DEBUG] Creating payment intent:", { amount: amountInCents, currency: "usd" });

    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        foodName: order.foodName,
        userEmail: order.userEmail,
        quantity: String(order.quantity),
      },
    });

    console.log("[PAYMENT_SUCCESS] Payment intent created:", { id: paymentIntent.id });
    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      orderDraft: {
        ...order,
        paymentIntentId: paymentIntent.id,
      },
    });
  } catch (error) {
    console.error("[PAYMENT_ERROR] Stripe error:", error.type, error.message);
    console.error("[PAYMENT_ERROR] Full error:", error);
    res.status(500).json({ error: error.message || "Unable to create payment intent." });
  }
});

app.post("/api/orders/complete-payment", requireUser, async (req, res) => {
  const payload = req.body || {};
  const paymentIntentId = String(payload.paymentIntentId || "").trim();
  console.log("[PAYMENT_DEBUG] complete-payment route hit:", {
    paymentIntentId,
    userEmail: payload.userEmail || payload.customerEmail,
    foodName: payload.foodName || payload.foodItem,
  });

  if (!paymentIntentId) {
    res.status(400).json({ error: "paymentIntentId is required." });
    return;
  }

  if (!stripe) {
    res.status(503).json({ error: "Payment service is not configured. Please add STRIPE_SECRET_KEY to server .env." });
    return;
  }

  try {
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== "succeeded") {
      res.status(400).json({ error: "Payment has not succeeded yet." });
      return;
    }

    const order = buildOrderDocument({
      ...payload,
      paymentIntentId,
      paymentStatus: "Paid",
      orderStatus: "PLACED",
    });

    const validationError = validateOrderInput(order);
    if (validationError) {
      res.status(400).json({ error: validationError });
      return;
    }

    if (!ensureSameUserEmail(req, res, order.userEmail)) {
      return;
    }

    const { orders } = await getCollections();
    const existing = await orders.findOne({ paymentIntentId });

    if (existing) {
      res.json({ ...makePublicDoc(existing), emailStatus: "skipped", emailMessage: "Order already completed earlier." });
      return;
    }

    const result = await orders.insertOne(order);
    const inserted = await orders.findOne({ _id: result.insertedId });

    const emailResult = mergeEmailResults([
      await notifyOrderPlaced(inserted),
      await notifyPaymentReceipt(inserted, paymentIntentId),
    ]);

    res.status(201).json({ ...makePublicDoc(inserted), ...emailResult });
  } catch (error) {
    res.status(500).json({ error: error.message || "Unable to complete order." });
  }
});

app.get("/api/orders", requireAdmin, async (req, res) => {
  const limit = Number(req.query.limit || 0);

  try {
    const { orders } = await getCollections();
    const query = orders.find().sort({ createdAt: -1 });

    if (limit > 0) {
      query.limit(limit);
    }

    const records = await query.toArray();
    res.json(records.map(makePublicDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders/all", requireAdmin, async (_req, res) => {
  try {
    const { orders } = await getCollections();
    const records = await orders.find().sort({ createdAt: -1 }).toArray();
    res.json(records.map(makePublicDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders/user/:email", requireUser, async (req, res) => {
  try {
    const { orders } = await getCollections();
    const email = normalizeEmail(req.params.email);
    if (!ensureSameUserEmail(req, res, email)) {
      return;
    }
    const records = await orders.find({ userEmail: email }).sort({ createdAt: -1 }).toArray();
    res.json(records.map(makePublicDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/orders/:id", authenticate, async (req, res) => {
  const id = withObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid order id." });
    return;
  }

  try {
    const { orders } = await getCollections();
    const order = await orders.findOne({ _id: id });

    if (!order) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    if (req.auth.role !== "ADMIN" && getRecordOwnerEmail(order) !== req.auth.email) {
      accessDenied(res);
      return;
    }

    res.json(makePublicDoc(order));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/orders", requireUser, async (req, res) => {
  const order = buildOrderDocument(req.body || {});
  console.log("[ORDER_DEBUG] create order route hit:", {
    orderId: order.orderId,
    userEmail: order.userEmail,
    foodName: order.foodName,
  });
  const validationError = validateOrderInput(order);

  if (validationError) {
    res.status(400).json({ error: validationError });
    return;
  }

  if (!ensureSameUserEmail(req, res, order.userEmail)) {
    return;
  }

  try {
    const { orders } = await getCollections();
    const result = await orders.insertOne(order);
    const inserted = await orders.findOne({ _id: result.insertedId });

    const emailResult = mergeEmailResults([
      await notifyOrderPlaced(inserted),
    ]);

    res.status(201).json({ ...makePublicDoc(inserted), ...emailResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/orders/:id", requireAdmin, async (req, res) => {
  const id = withObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid order id." });
    return;
  }

  const payload = req.body || {};
  console.log("[ORDER_DEBUG] update order route hit:", { id: req.params.id, payload });
  const updateFields = { updatedAt: new Date() };

  if (payload.customerName) updateFields.customerName = payload.customerName;
  if (payload.foodName || payload.foodItem) {
    const foodName = payload.foodName || payload.foodItem;
    updateFields.foodName = foodName;
    updateFields.foodItem = foodName;
  }
  if (payload.userEmail) updateFields.userEmail = normalizeEmail(payload.userEmail);
  if (payload.deliveryAddress) updateFields.deliveryAddress = payload.deliveryAddress;
  if (payload.phone) updateFields.phone = payload.phone;
  if (payload.specialNotes !== undefined) updateFields.specialNotes = String(payload.specialNotes || "").trim();
  if (payload.quantity !== undefined) updateFields.quantity = toPositiveNumber(payload.quantity) || 1;
  if (payload.price !== undefined) {
    const price = parseItemPrice(payload.price);
    updateFields.price = price;
    const quantity = updateFields.quantity || undefined;
    if (quantity) {
      updateFields.totalPrice = Number((price * quantity).toFixed(2));
    }
  }

  try {
    const { orders } = await getCollections();
    const existingOrder = await orders.findOne({ _id: id });

    if (!existingOrder) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    if (payload.orderStatus || payload.status) {
      const previousStatusForUpdate = sanitizeOrderStatus(existingOrder.orderStatus || existingOrder.status);
      const nextStatus = sanitizeOrderStatus(payload.orderStatus || payload.status);

      if (!canMoveOrderStatus(previousStatusForUpdate, nextStatus)) {
        res.status(400).json({
          error: `Invalid order status transition from ${previousStatusForUpdate} to ${nextStatus}.`,
        });
        return;
      }

      updateFields.orderStatus = nextStatus;
      updateFields.status = nextStatus;
    }

    await orders.updateOne({ _id: id }, { $set: updateFields });
    let updated = await orders.findOne({ _id: id });

    if (!updated) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    // Recalculate total price when quantity changes without price update.
    if (payload.quantity !== undefined && payload.price === undefined) {
      const recalculated = Number((toPositiveNumber(updated.price) * toPositiveNumber(updated.quantity)).toFixed(2));
      await orders.updateOne({ _id: id }, { $set: { totalPrice: recalculated } });
      updated = await orders.findOne({ _id: id });
    }

    const previousStatus = sanitizeOrderStatus(existingOrder.orderStatus || existingOrder.status);
    const currentStatus = sanitizeOrderStatus(updated.orderStatus || updated.status);

    // Set appropriate timestamp based on status change
    const timestampUpdates = {};
    if (currentStatus === "CONFIRMED" && previousStatus !== "CONFIRMED") {
      timestampUpdates.confirmedAt = new Date();
    } else if (currentStatus === "IN PROGRESS" && previousStatus !== "IN PROGRESS") {
      timestampUpdates.inProgressAt = new Date();
    } else if (currentStatus === "DELIVERED" && previousStatus !== "DELIVERED") {
      timestampUpdates.deliveredAt = new Date();
    }

    if (Object.keys(timestampUpdates).length > 0) {
      await orders.updateOne({ _id: id }, { $set: timestampUpdates });
      updated = await orders.findOne({ _id: id });
    }

    let emailResult = { emailStatus: "skipped", emailMessage: "Order status was not changed." };
    if ((payload.orderStatus || payload.status) && previousStatus !== currentStatus) {
      console.log("[EMAIL_DEBUG] Status changed from", previousStatus, "to", currentStatus, "- sending email");
      emailResult = await notifyOrderStatusChanged(updated, currentStatus);
    } else {
      console.log("[EMAIL_DEBUG] Status not changed or no status update requested - skipping email");
    }

    res.json({ ...makePublicDoc(updated), ...emailResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/orders/:id", authenticate, async (req, res) => {
  const id = withObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid order id." });
    return;
  }

  try {
    const { orders } = await getCollections();
    const existing = await orders.findOne({ _id: id });

    if (!existing) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    if (req.auth.role !== "ADMIN") {
      const status = sanitizeOrderStatus(existing.orderStatus || existing.status);
      if (getRecordOwnerEmail(existing) !== req.auth.email || status !== "PLACED") {
        accessDenied(res);
        return;
      }
    }

    const result = await orders.deleteOne({ _id: id });

    if (!result.deletedCount) {
      res.status(404).json({ error: "Order not found." });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/menu", async (_req, res) => {
  try {
    const { menuitems } = await getCollections();
    const records = await menuitems.find().sort({ createdAt: -1 }).toArray();
    res.json(records.map(makePublicDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/menu", requireAdmin, async (req, res) => {
  const payload = req.body || {};
  const document = {
    itemId: payload.itemId || makeCode("ITEM-"),
    name: payload.name || "",
    description: payload.description || "",
    price: toPositiveNumber(payload.price),
    image: payload.image || "",
    category: payload.category || "General",
    availability: Boolean(payload.availability),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!document.name) {
    res.status(400).json({ error: "name is required." });
    return;
  }

  try {
    const { menuitems } = await getCollections();
    const result = await menuitems.insertOne(document);
    const inserted = await menuitems.findOne({ _id: result.insertedId });
    res.status(201).json(makePublicDoc(inserted));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/menu/:id", requireAdmin, async (req, res) => {
  const id = withObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid menu id." });
    return;
  }

  const payload = req.body || {};
  const updateFields = { updatedAt: new Date() };

  if (payload.name !== undefined) updateFields.name = payload.name;
  if (payload.description !== undefined) updateFields.description = payload.description;
  if (payload.price !== undefined) updateFields.price = toPositiveNumber(payload.price);
  if (payload.image !== undefined) updateFields.image = payload.image;
  if (payload.category !== undefined) updateFields.category = payload.category;
  if (payload.availability !== undefined) updateFields.availability = Boolean(payload.availability);

  try {
    const { menuitems } = await getCollections();
    await menuitems.updateOne({ _id: id }, { $set: updateFields });
    const updated = await menuitems.findOne({ _id: id });

    if (!updated) {
      res.status(404).json({ error: "Menu item not found." });
      return;
    }

    res.json(makePublicDoc(updated));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/menu/:id", requireAdmin, async (req, res) => {
  const id = withObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid menu id." });
    return;
  }

  try {
    const { menuitems } = await getCollections();
    const result = await menuitems.deleteOne({ _id: id });

    if (!result.deletedCount) {
      res.status(404).json({ error: "Menu item not found." });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Get available tables for a given date and time (real-time)
// IMPORTANT: This route must be defined BEFORE /api/reservations/:id to avoid param conflict
app.get("/api/reservations/available-tables", async (req, res) => {
  try {
    const { date, time } = req.query;
    if (!date || !time) {
      res.status(400).json({ error: "Missing date or time." });
      return;
    }
    const { reservations } = await getCollections();
    const allTables = buildRestaurantTables();
    const reservedTables = await getReservedTablesForSlot(reservations, date, time);
    const available = allTables.filter((table) => !reservedTables.has(table));
    res.json({
      tables: available,
      reservedTables: Array.from(reservedTables),
      totalTables: allTables.length,
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Reservation deposit payment intent
app.post("/api/reservations/create-intent", requireUser, async (req, res) => {
  const payload = req.body || {};
  const guests = Math.max(1, Number(payload.guests) || 1);
  const DEPOSIT_PER_GUEST = 25; // $25 per guest
  const depositAmount = Number(payload.depositAmount) || guests * DEPOSIT_PER_GUEST;

  if (!payload.email || !payload.customerName) {
    res.status(400).json({ error: "customerName and email are required." });
    return;
  }

  if (!ensureSameUserEmail(req, res, payload.email)) {
    return;
  }

  if (!stripe) {
    res.status(503).json({ error: "Payment service is not configured. Please add STRIPE_SECRET_KEY to server .env." });
    return;
  }

  try {
    const amountInCents = Math.round(depositAmount * 100);
    console.log("[RESERVATION_PAYMENT] Creating payment intent:", { amount: depositAmount, guests });
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amountInCents,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        type: "reservation_deposit",
        customerName: String(payload.customerName || ""),
        email: String(payload.email || ""),
        guests: String(guests),
        depositPerGuest: String(DEPOSIT_PER_GUEST),
      },
    });
    console.log("[RESERVATION_PAYMENT] Payment intent created:", { id: paymentIntent.id });
    res.status(201).json({
      clientSecret: paymentIntent.client_secret,
      paymentIntentId: paymentIntent.id,
      depositAmount,
    });
  } catch (error) {
    console.error("[RESERVATION_PAYMENT] Stripe error:", error.type, error.message);
    res.status(500).json({ error: error.message || "Unable to create reservation payment intent." });
  }
});

app.get("/api/reservations", requireAdmin, async (_req, res) => {
  try {
    const { reservations } = await getCollections();
    const records = await reservations.find().sort({ createdAt: -1, date: -1, time: -1 }).toArray();
    res.json(records.map(makePublicDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reservations/all", requireAdmin, async (_req, res) => {
  try {
    const { reservations } = await getCollections();
    const records = await reservations.find().sort({ createdAt: -1, date: -1, time: -1 }).toArray();
    res.json(records.map(makePublicDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reservations/user/:email", requireUser, async (req, res) => {
  try {
    const { reservations } = await getCollections();
    const email = normalizeEmail(req.params.email);
    if (!ensureSameUserEmail(req, res, email)) {
      return;
    }
    const records = await reservations.find({ email }).sort({ createdAt: -1, date: -1, time: -1 }).toArray();
    res.json(records.map(makePublicDoc));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post("/api/reservations", requireUser, async (req, res) => {
  const payload = req.body || {};
  console.log("[RESERVATION_DEBUG] create reservation route hit:", {
    email: payload.email,
    customerName: payload.customerName,
    date: payload.date,
    time: payload.time,
    tableNumber: payload.tableNumber,
  });
  const document = {
    reservationId: payload.reservationId || makeCode("RSV-"),
    customerName: payload.customerName || "",
    email: normalizeEmail(payload.email),
    phone: payload.phone || "",
    guests: toPositiveNumber(payload.guests) || 1,
    specialRequest: String(payload.specialRequest || payload.notes || "").trim(),
    tableNumber: payload.tableNumber || "",
    date: payload.date || "",
    time: payload.time || "",
    status: payload.status || "Pending",
    reservationStatus: payload.reservationStatus || payload.status || "Pending",
    depositAmount: Number(payload.depositAmount) || 0,
    depositPaid: Boolean(payload.depositPaid) || false,
    paymentStatus: payload.paymentStatus || (payload.depositPaid || payload.paymentIntentId ? "Paid" : "Pending"),
    paymentIntentId: String(payload.paymentIntentId || "").trim(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  if (!document.email || !document.customerName || !document.date || !document.time) {
    res.status(400).json({ error: "customerName, email, date and time are required." });
    return;
  }

  if (!document.tableNumber) {
    res.status(400).json({ error: "Table number is required." });
    return;
  }

  if (!ensureSameUserEmail(req, res, document.email)) {
    return;
  }

  try {
    const { reservations } = await getCollections();
    const selectedTable = normalizeTableNumber(document.tableNumber);
    const allTables = buildRestaurantTables();

    if (!allTables.includes(selectedTable)) {
      res.status(400).json({ error: "Invalid table number." });
      return;
    }

    const reservedTables = await getReservedTablesForSlot(reservations, document.date, document.time);
    if (reservedTables.has(selectedTable)) {
      res.status(409).json({ error: "Selected table is already reserved. Please choose another table." });
      return;
    }

    document.tableNumber = selectedTable;

    if (document.paymentIntentId) {
      if (!stripe) {
        res.status(503).json({ error: "Payment service is not configured. Please add STRIPE_SECRET_KEY to server .env." });
        return;
      }
      const paymentIntent = await stripe.paymentIntents.retrieve(document.paymentIntentId);
      if (paymentIntent.status !== "succeeded") {
        res.status(400).json({ error: "Reservation payment has not succeeded yet." });
        return;
      }
      document.paymentStatus = "Paid";
      document.depositPaid = true;
      document.depositAmount = Number((paymentIntent.amount_received || paymentIntent.amount || document.depositAmount * 100) / 100);
    }
    const result = await reservations.insertOne(document);
    const inserted = await reservations.findOne({ _id: result.insertedId });

    const emailResult = mergeEmailResults([
      await notifyReservationCreated(inserted),
      await notifyReservationPaymentReceipt(inserted),
    ]);

    res.status(201).json({ ...makePublicDoc(inserted), ...emailResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/reservations/:id", authenticate, async (req, res) => {
  const id = withObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid reservation id." });
    return;
  }

  try {
    const { reservations } = await getCollections();
    const reservation = await reservations.findOne({ _id: id });

    if (!reservation) {
      res.status(404).json({ error: "Reservation not found." });
      return;
    }

    if (req.auth.role !== "ADMIN" && getRecordOwnerEmail(reservation, "reservation") !== req.auth.email) {
      accessDenied(res);
      return;
    }

    res.json(makePublicDoc(reservation));
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put("/api/reservations/:id", requireAdmin, async (req, res) => {
  const id = withObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid reservation id." });
    return;
  }

  const payload = req.body || {};
  console.log("[RESERVATION_DEBUG] update reservation route hit:", { id: req.params.id, payload });
  const updateFields = { updatedAt: new Date() };

  if (payload.status !== undefined) {
    updateFields.status = payload.status;
    updateFields.reservationStatus = payload.status;
  }
  if (payload.reservationStatus !== undefined) {
    updateFields.reservationStatus = payload.reservationStatus;
    updateFields.status = payload.reservationStatus;
  }
  if (payload.paymentStatus !== undefined) updateFields.paymentStatus = payload.paymentStatus;
  if (payload.paymentIntentId !== undefined) updateFields.paymentIntentId = String(payload.paymentIntentId || "").trim();
  if (payload.depositAmount !== undefined) updateFields.depositAmount = Number(payload.depositAmount) || 0;
  if (payload.customerName !== undefined) updateFields.customerName = payload.customerName;
  if (payload.phone !== undefined) updateFields.phone = payload.phone;
  if (payload.tableNumber !== undefined) updateFields.tableNumber = payload.tableNumber;
  if (payload.guests !== undefined) updateFields.guests = toPositiveNumber(payload.guests) || 1;
  if (payload.specialRequest !== undefined) updateFields.specialRequest = String(payload.specialRequest || "").trim();
  if (payload.date !== undefined) updateFields.date = payload.date;
  if (payload.time !== undefined) updateFields.time = payload.time;

  try {
    const { reservations } = await getCollections();
    const existing = await reservations.findOne({ _id: id });

    if (!existing) {
      res.status(404).json({ error: "Reservation not found." });
      return;
    }

    await reservations.updateOne({ _id: id }, { $set: updateFields });
    const updated = await reservations.findOne({ _id: id });

    if (!updated) {
      res.status(404).json({ error: "Reservation not found." });
      return;
    }

    let emailResult = { emailStatus: "skipped", emailMessage: "Reservation status was not changed." };
    if (updated && updated.email && payload.status !== undefined && String(existing.status) !== String(updated.status)) {
      emailResult = await notifyReservationStatusChanged(updated, updated.status);
    }

    res.json({ ...makePublicDoc(updated), ...emailResult });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete("/api/reservations/:id", requireAdmin, async (req, res) => {
  const id = withObjectId(req.params.id);
  if (!id) {
    res.status(400).json({ error: "Invalid reservation id." });
    return;
  }

  try {
    const { reservations } = await getCollections();
    const result = await reservations.deleteOne({ _id: id });

    if (!result.deletedCount) {
      res.status(404).json({ error: "Reservation not found." });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.get("/api/dashboard/admin/stats", requireAdmin, async (_req, res) => {
  try {
    const { orders, users, reservations } = await getCollections();
    const { start, end } = dayRange();

    const [totalOrders, todaysOrders, totalCustomers, todayRevenueRows, totalRevenueRows, paidReservations, pendingReservations, confirmedReservations, cancelledReservations] = await Promise.all([
      orders.countDocuments(),
      orders.countDocuments({ createdAt: { $gte: start, $lte: end } }),
      // Exclude admin accounts from the customer count. Admins can be identified
      // by explicit `role: 'admin'`, `isAdmin: true`, `userType: 'admin'`, or
      // a specific admin email used by the app.
      users.countDocuments({
        $and: [
          { $or: [{ role: { $exists: false } }, { role: { $ne: "admin" } }] },
          { $or: [{ isAdmin: { $exists: false } }, { isAdmin: { $ne: true } }] },
          { $or: [{ userType: { $exists: false } }, { userType: { $ne: "admin" } }] },
          { email: { $ne: "vrbitesrestaurant@gmail.com" } },
        ],
      }),
      orders
        .aggregate([
          { $match: { createdAt: { $gte: start, $lte: end }, paymentStatus: "Paid" } },
          { $group: { _id: null, revenue: { $sum: "$totalPrice" } } },
        ])
        .toArray(),
      orders
        .aggregate([
          { $match: { paymentStatus: "Paid" } },
          { $group: { _id: null, revenue: { $sum: "$totalPrice" } } },
        ])
        .toArray(),
      reservations.countDocuments({ paymentStatus: "Paid" }),
      reservations.countDocuments({ $or: [{ reservationStatus: { $in: ["Pending", "PENDING"] } }, { status: { $in: ["Pending", "PENDING"] } }] }),
      reservations.countDocuments({ $or: [{ reservationStatus: { $in: ["Confirmed", "CONFIRMED"] } }, { status: { $in: ["Confirmed", "CONFIRMED"] } }] }),
      reservations.countDocuments({ $or: [{ reservationStatus: { $in: ["Cancelled", "Canceled", "DECLINED"] } }, { status: { $in: ["Cancelled", "Canceled", "DECLINED"] } }] }),
    ]);

    res.json({
      totalOrders,
      todaysOrders,
      totalCustomers,
      revenueToday: todayRevenueRows[0]?.revenue || 0,
      totalRevenue: totalRevenueRows[0]?.revenue || 0,
      reservations: {
        paid: paidReservations,
        pending: pendingReservations,
        confirmed: confirmedReservations,
        cancelled: cancelledReservations,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.use((err, _req, res, _next) => {
  console.error("[SERVER_ERROR]", err?.message || err);
  if (res.headersSent) {
    return;
  }
  res.status(err?.status || 500).json({
    success: false,
    message: err?.message || "Internal server error",
  });
});

async function startServer() {
  try {
    await ensureDatabase();

    // Keep dashboard/order queries fast when traffic grows.
    const { orders, users, newsletterSubscribers } = await getCollections();
    await Promise.all([
      orders.createIndex({ userEmail: 1, createdAt: -1 }),
      orders.createIndex({ paymentIntentId: 1 }, { unique: true, sparse: true }),
      users.createIndex({ email: 1 }, { unique: true }),
      newsletterSubscribers.createIndex({ email: 1 }, { unique: true }),
    ]);
    
    if (process.env.NODE_ENV !== "production") {
  app.listen(port, () => {
    console.log(`VR BITES API running at http://localhost:${port}`);
  });
}
  } catch (error) {
    console.error("Failed to start server:", error);
    db = null;
  }
}

startServer();
module.exports = app;
