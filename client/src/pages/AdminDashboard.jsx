import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  ArrowUpDown,
  CheckCircle2,
  CircleDollarSign,
  CreditCard,
  Eye,
  LayoutDashboard,
  Settings,
  ShoppingBag,
  Soup,
  Trash2,
  Users,
  UtensilsCrossed,
  XCircle,
} from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import StatsCard from "../components/dashboard/StatsCard";
import { apiRequest } from "../apiClient";
import "../styles/dashboard.css";
import { format } from "date-fns";

const menuItems = [
  { key: "dashboard", label: "Dashboard", icon: LayoutDashboard },
  { key: "orders", label: "Orders", icon: ShoppingBag },
  { key: "menu", label: "Menu Items", icon: UtensilsCrossed },
  { key: "reservations", label: "Reservations", icon: Soup },
  { key: "customers", label: "Customers", icon: Users },
  { key: "settings", label: "Settings", icon: Settings },
];

const allowedTabs = new Set(menuItems.map((item) => item.key));
const adminPathByTab = {
  dashboard: "/admin-dashboard",
  orders: "/admin/orders",
  menu: "/admin/menu",
  reservations: "/admin/reservations",
  customers: "/admin/customers",
  settings: "/admin/settings",
};

function getAdminTabFromPath(pathname, fallback = "dashboard") {
  const segment = String(pathname || "").split("/").filter(Boolean).pop();
  if (allowedTabs.has(segment)) return segment;
  return allowedTabs.has(fallback) ? fallback : "dashboard";
}

/* ── Order status flow: only show statuses the admin can move TO ─ */
const ORDER_STATUSES = ["PLACED", "CONFIRMED", "IN PROGRESS", "DELIVERED"];
const ORDER_STATUS_FLOW = {
  PLACED:        ["CONFIRMED"],
  CONFIRMED:     ["IN PROGRESS"],
  "IN PROGRESS": ["DELIVERED"],
  DELIVERED:     [],
};

/* Get all statuses for dropdown, but disable future ones */
function getAllStatusesForDropdown(currentStatus) {
  const currentIndex = ORDER_STATUSES.indexOf(currentStatus);
  return ORDER_STATUSES.map((status, index) => ({
    value: status,
    label: status,
    disabled: index > currentIndex + 1, // Can only move to next status or stay current
  }));
}
const ORDER_FILTER_OPTIONS = [
  { key: "ALL",          label: "All Orders" },
  { key: "PLACED",       label: "Placed Orders" },
  { key: "CONFIRMED",    label: "Confirmed Orders" },
  { key: "IN PROGRESS",  label: "In Progress Orders" },
  { key: "DELIVERED",    label: "Delivered Orders" },
];


const RESERVATION_STATUS_FLOW = {
  Pending:   ["Confirmed", "Cancelled"],
  Confirmed: ["Completed", "Cancelled"],
  Completed: [],
  Cancelled: [],
};

const menuInitialState = {
  id: "",
  name: "",
  category: "",
  price: "",
  image: "",
  description: "",
  availability: true,
};

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function normalizeOrderStatus(status) {
  const normalized = String(status || "PLACED").trim().toUpperCase();
  if (normalized === "PREPARING") return "IN PROGRESS";
  if (normalized === "COMPLETED") return "DELIVERED";
  if (ORDER_STATUSES.includes(normalized)) return normalized;
  return "PLACED";
}

function getOrderStatus(order) {
  return normalizeOrderStatus(order?.orderStatus || order?.status);
}

function getStatusDisplayLabel(status) {
  const labels = {
    PLACED: "Placed",
    CONFIRMED: "Confirmed",
    "IN PROGRESS": "In Progress",
    DELIVERED: "Delivered",
    Pending: "Pending",
    Confirmed: "Confirmed",
    Completed: "Completed",
    Cancelled: "Cancelled",
    Paid: "Paid",
    Unpaid: "Unpaid",
  };
  return labels[status] || labels[normalizeOrderStatus(status)] || String(status || "Pending");
}

function statusToClassName(status) {
  return String(status || "pending").trim().toLowerCase().replace(/\s+/g, "-");
}

function getAvailableOrderActions(status) {
  return ORDER_STATUS_FLOW[normalizeOrderStatus(status)] || [];
}

function getReservationStatus(status) {
  const normalized = String(status || "Pending").trim().toLowerCase();
  if (normalized === "confirmed") return "Confirmed";
  if (normalized === "completed") return "Completed";
  if (normalized === "cancelled" || normalized === "canceled") return "Cancelled";
  return "Pending";
}

function getAvailableReservationActions(status) {
  return RESERVATION_STATUS_FLOW[getReservationStatus(status)] || [];
}

function getReservationPaymentStatus(reservation) {
  if (reservation?.paymentStatus) return reservation.paymentStatus;
  return reservation?.depositPaid || Number(reservation?.depositAmount || 0) > 0 ? "Paid" : "Unpaid";
}

function stripePaymentUrl(paymentIntentId) {
  return paymentIntentId ? `https://dashboard.stripe.com/payments/${paymentIntentId}` : "";
}

function splitOrderId(orderId) {
  const value = String(orderId || "-");
  const [prefix, ...rest] = value.split("-");
  const fullNumber = rest.length ? rest.join("-") : value;
  const displayPrefix = rest.length ? prefix : "ORD";
  // Show only last 5 digits so the number never wraps to a third line
  const displayNumber = fullNumber.length > 5 ? fullNumber.slice(-5) : fullNumber;
  return {
    prefix: displayPrefix,
    number: displayNumber,
  };
}

function AdminDashboard({ initialTab = "" }) {
  const { user } = useUser();
  const location = useLocation();
  const navigate = useNavigate();

  // Navigation handler for sidebar and programmatic tab changes
  const handleSetActiveItem = (item) => {
    if (!allowedTabs.has(item)) return;
    setActiveItem(item);
    navigate(adminPathByTab[item] || "/admin-dashboard", { replace: false });
  };

  // Navigation state for dashboard tabs
  const [activeItem, setActiveItem] = useState(() => getAdminTabFromPath(location.pathname, initialTab));

  // Sidebar open/close state
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);

  // Sidebar toggle handler
  const toggleSidebar = () => {
    setIsSidebarOpen((prev) => !prev);
  };

  const [orders, setOrders] = useState([]);
  const [menuItemsData, setMenuItemsData] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [customers, setCustomers] = useState([]);
  const [stats, setStats] = useState(null);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [orderStatusError, setOrderStatusError] = useState("");
  const [orderFilter, setOrderFilter] = useState("ALL");
  const [isOrderFilterOpen, setOrderFilterOpen] = useState(false);
  const [menuForm, setMenuForm] = useState(menuInitialState);
  const [menuErrors, setMenuErrors] = useState({});
  const [selectedReservation, setSelectedReservation] = useState(null);
  const orderFilterMenuRef = useRef(null);

  const fetchAllData = async () => {
    setLoading(true);
    setError("");
    try {
      const loadAdminData = (path, fallback) => apiRequest(path).catch((err) => {
        console.error(`Admin dashboard request failed: ${path}`, err);
        return fallback;
      });
      const [orderData, menuData, reservationData, userData, statsData] = await Promise.all([
        loadAdminData("/api/orders", []),
        loadAdminData("/api/menu", []),
        loadAdminData("/api/reservations", []),
        loadAdminData("/api/users", []),
        loadAdminData("/api/dashboard/admin/stats", null),
      ]);

      setOrders(Array.isArray(orderData) ? orderData : []);
      setMenuItemsData(Array.isArray(menuData) ? menuData : []);
      setReservations(Array.isArray(reservationData) ? reservationData : []);
      setCustomers(Array.isArray(userData) ? userData : []);
      setStats(statsData);
    } catch (err) {
      setError(err.message || "Unable to load admin dashboard data.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    const nextTab = getAdminTabFromPath(location.pathname, initialTab);
    if (nextTab !== activeItem) {
      setActiveItem(nextTab);
    }
  }, [activeItem, initialTab, location.pathname]);

  useEffect(() => {
    const handlePointerDown = (event) => {
      if (orderFilterMenuRef.current && !orderFilterMenuRef.current.contains(event.target)) {
        setOrderFilterOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown);
    return () => document.removeEventListener("pointerdown", handlePointerDown);
  }, []);

  const filteredOrders = useMemo(() => {
    if (orderFilter === "ALL") return orders;
    return orders.filter((order) => getOrderStatus(order) === orderFilter);
  }, [orders, orderFilter]);

  const customerRows = useMemo(() => {
    if (customers.length) return customers;
    const byEmail = new Map();
    [...orders, ...reservations].forEach((item) => {
      const email = String(item.email || item.userEmail || "").trim().toLowerCase();
      const key = email || item.customerName || item.id;
      if (!key || byEmail.has(key)) return;
      byEmail.set(key, {
        id: key,
        fullName: item.customerName || item.fullName || "Guest",
        email,
        phone: item.phone || "-",
      });
    });
    return Array.from(byEmail.values());
  }, [customers, orders, reservations]);

  const statsCards = useMemo(() => {
    const totalRevenue = orders.reduce((sum, order) => sum + Number(order.totalPrice || Number(order.price || 0) * Number(order.quantity || 1)), 0);
    const reservationStats = stats?.reservations;
    const reservationCount = typeof reservationStats === "object" && reservationStats !== null
      ? Number(reservationStats.paid || 0) + Number(reservationStats.pending || 0) + Number(reservationStats.confirmed || 0) + Number(reservationStats.cancelled || 0)
      : Number(reservationStats || reservations.length);
    return [
      { label: "Orders", value: stats?.totalOrders ?? orders.length, icon: <ShoppingBag size={20} />, tone: "amber" },
      { label: "Reservations", value: reservationCount, icon: <Soup size={20} />, tone: "peach" },
      { label: "Customers", value: stats?.totalCustomers ?? customerRows.length, icon: <Users size={20} />, tone: "sand" },
      { label: "Total Revenue", value: formatCurrency(totalRevenue), icon: <CircleDollarSign size={20} />, tone: "gold" },
    ];
  }, [stats, orders, reservations, customerRows]);

  const orderEmptyMessage = orderFilter === "ALL"
    ? "No orders have been placed yet."
    : `No ${getStatusDisplayLabel(orderFilter).toLowerCase()} orders found.`;

  // Handler functions (move all here)
  const updateOrderStatus = async (id, newStatus) => {
    setOrderStatusError("");
    try {
      const updatedOrder = await apiRequest(`/api/orders/${id}`, {
        method: "PUT",
        body: JSON.stringify({ orderStatus: newStatus }),
      });
      if (updatedOrder?.emailStatus === "success") toast.success("Status updated. Customer notified by email.");
      else if (updatedOrder?.emailStatus === "error") toast.error(updatedOrder.emailMessage || "Status email failed.");
      else toast.success(`Order moved to ${newStatus}.`);
      await fetchAllData();
    } catch (err) {
      toast.error(err.message || "Failed to update order status.");
    }
  };

  const deleteOrder = async (id) => {
    await apiRequest(`/api/orders/${id}`, { method: "DELETE" });
    await fetchAllData();
  };

  const editMenuItem = (item) => {
    setMenuForm({ id: item.id, name: item.name, description: item.description, price: item.price, image: item.image, category: item.category, availability: Boolean(item.availability) });
    setMenuErrors({});
    handleSetActiveItem("menu");
  };

  const saveMenuItem = async (event) => {
    event.preventDefault();
    const nextErrors = {};
    ["name", "category", "price", "image", "description"].forEach((field) => {
      if (!String(menuForm[field] || "").trim()) nextErrors[field] = "This field is required";
    });
    if (Object.keys(nextErrors).length) {
      setMenuErrors(nextErrors);
      return;
    }
    const payload = { name: menuForm.name.trim(), description: menuForm.description.trim(), price: Number(menuForm.price || 0), image: menuForm.image.trim(), category: menuForm.category.trim(), availability: Boolean(menuForm.availability) };
    if (menuForm.id) {
      await apiRequest(`/api/menu/${menuForm.id}`, { method: "PUT", body: JSON.stringify(payload) });
    } else {
      await apiRequest("/api/menu", { method: "POST", body: JSON.stringify(payload) });
    }
    setMenuForm(menuInitialState);
    setMenuErrors({});
    await fetchAllData();
  };

  const updateMenuField = (field, value) => {
    setMenuForm((p) => ({ ...p, [field]: value }));
    if (menuErrors[field]) setMenuErrors((p) => ({ ...p, [field]: "" }));
  };

  const deleteMenuItem = async (id) => {
    await apiRequest(`/api/menu/${id}`, { method: "DELETE" });
    if (menuForm.id === id) setMenuForm(menuInitialState);
    await fetchAllData();
  };

  const updateReservationStatus = async (id, status) => {
    try {
      const updatedReservation = await apiRequest(`/api/reservations/${id}`, {
        method: "PUT",
        body: JSON.stringify({ status }),
      });
      if (updatedReservation?.emailStatus === "success") toast.success("Reservation email sent successfully.");
      else if (updatedReservation?.emailStatus === "error") toast.error(updatedReservation.emailMessage || "Reservation email failed.");
      else toast.success(`Reservation moved to ${status}.`);
      await fetchAllData();
    } catch (err) {
      toast.error(err.message || "Failed to update reservation status.");
    }
  };

  const deleteReservation = async (id) => {
    await apiRequest(`/api/reservations/${id}`, { method: "DELETE" });
    await fetchAllData();
  };

  // ...rest of AdminDashboard code (renderAdminContent, return, etc)...

  /* ─────────────────── RENDER ─────────────────────────────────── */
  const renderAdminContent = () => {
    if (isLoading) return <section className="db-card db-loading-card"><div className="db-spinner" /><p>Loading dashboard data…</p></section>;
    if (error) return <section className="db-card"><p className="db-error-text">{error}</p></section>;

    /* DASHBOARD */
    if (activeItem === "dashboard") {
      return (
        <section className="db-stats-grid">
          {statsCards.map((stat) => (
            <StatsCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} tone={stat.tone} />
          ))}
        </section>
      );
    }

    /* ORDERS */
    if (activeItem === "orders") {
      return (
        <section className="db-card db-table-card">
          <div className="db-section-head db-orders-head">
            <h2>Order Management</h2>
            <div className="db-order-filters" ref={orderFilterMenuRef}>
              <button type="button" className="db-order-filter-toggle" onClick={() => setOrderFilterOpen((p) => !p)} aria-haspopup="menu" aria-expanded={isOrderFilterOpen}>
                <ArrowUpDown size={16} /> Filters
              </button>
              {isOrderFilterOpen && (
                <div className="db-order-filter-dropdown" role="menu">
                  {ORDER_FILTER_OPTIONS.map((opt) => (
                    <button key={opt.key} type="button" className={`db-order-filter-option ${orderFilter === opt.key ? "is-active" : ""}`}
                      onClick={() => { setOrderFilter(opt.key); setOrderFilterOpen(false); }} role="menuitem">
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

          {orderStatusError && <p className="db-error-text db-order-status-error">{orderStatusError}</p>}

          {/* ── DESKTOP TABLE ── */}
          <div className="db-table-wrap db-admin-orders-table" style={{ overflowX: "auto", overflowY: "visible", WebkitOverflowScrolling: "touch", paddingBottom: 8 }}>
            <table className="db-table db-orders-table" style={{ width: '100%', tableLayout: "fixed", minWidth: 1080 }}>
              <colgroup>
                <col style={{ width: '18%' }} />
                <col style={{ width: '20%' }} />
                <col style={{ width: '22%' }} />
                <col style={{ width: '8%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '10%' }} />
                <col style={{ width: '12%' }} />
              </colgroup>
              <thead>
                <tr>
                  <th>ORDER ID</th><th>CUSTOMER</th><th>FOOD ITEM</th>
                  <th>QTY</th><th>PRICE</th><th>STATUS</th><th>ACTIONS</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.length ? filteredOrders.map((order) => {
                  const status = getOrderStatus(order);
                  const nextSteps = getAvailableOrderActions(status);
                  const amount = formatCurrency(order.totalPrice || (order.price || 0) * (order.quantity || 0));
                  const orderIdParts = splitOrderId(order.orderId);
                  // Split customer name for 2-line display
                  const nameParts = (order.customerName || "").trim().split(/\s+/);
                  const firstName = nameParts[0] || "";
                  const lastName = nameParts.slice(1).join(" ") || "";
                  // Split food name for 2-line display
                  const foodParts = (order.foodName || order.foodItem || "").split(/\s+/);
                  const foodLine1 = foodParts.slice(0, 2).join(" ");
                  const foodLine2 = foodParts.slice(2).join(" ");
                  return (
                    <tr key={order.id} style={{ minHeight: 72, verticalAlign: 'middle' }}>
                      <td className="db-td-id" style={{ verticalAlign: 'middle', textAlign: 'center' }}>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", lineHeight: 1.2, width: 72 }}>
                          <span style={{ fontWeight: 900, letterSpacing: 0.2, fontSize: 11, color: "#9b642d", textTransform: "uppercase" }}>{orderIdParts.prefix}</span>
                          <span style={{ fontSize: 13, fontWeight: 700, color: "#2b1a10", whiteSpace: "nowrap" }}>{orderIdParts.number}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, wordBreak: 'break-word', whiteSpace: 'pre-line', fontWeight: 600, fontSize: 15 }}>
                          <span>{firstName}</span>
                          <span>{lastName}</span>
                        </div>
                      </td>
                      <td style={{ padding: '12px 10px', verticalAlign: 'middle' }}>
                        <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1.3, wordBreak: 'break-word', whiteSpace: 'pre-line', fontWeight: 600, fontSize: 15, maxHeight: 42, overflow: 'hidden' }}>
                          <span>{foodLine1}</span>
                          <span>{foodLine2}</span>
                        </div>
                      </td>
                      <td className="text-center" style={{ verticalAlign: 'middle' }}>{order.quantity || 1}</td>
                      <td style={{ verticalAlign: 'middle' }}>{amount}</td>
                      <td style={{ verticalAlign: 'middle' }}><span className={`db-badge ${statusToClassName(status)}`}>{getStatusDisplayLabel(status)}</span></td>
                      <td style={{ minWidth: 140, width: '12%', verticalAlign: 'middle' }}>
                        <div className="db-action-btns" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, flexWrap: "nowrap", minWidth: 80, overflow: "visible" }}>
                          {nextSteps.length > 0 ? nextSteps.map((next) => (
                            <button key={next} type="button" className={`db-next-btn db-next-${statusToClassName(next)}`}
                              onClick={() => updateOrderStatus(order.id, next)}>
                              {getStatusDisplayLabel(next)}
                            </button>
                          )) : (
                            <span className="db-final-badge">Final</span>
                          )}
                          <button type="button" className="db-table-action danger" style={{ minWidth: 42, display: "inline-flex", justifyContent: "center" }} onClick={() => deleteOrder(order.id)}>
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                }) : (
                  <tr><td colSpan={7} className="db-orders-empty"><div className="db-orders-empty-text">{orderEmptyMessage}</div></td></tr>
                )}
              </tbody>
            </table>
          </div>

          {/* ── MOBILE CARDS ── */}
          <div className="db-admin-orders-cards">
            {filteredOrders.length ? filteredOrders.map((order) => {
              const status = getOrderStatus(order);
              const nextSteps = getAvailableOrderActions(status);
              const amount = formatCurrency(order.totalPrice || (order.price || 0) * (order.quantity || 0));
              return (
                <article key={order.id} className="db-mobile-order-card">
                  <p><strong>Order ID:</strong> {order.orderId}</p>
                  <p><strong>Customer:</strong> {order.customerName}</p>
                  <p><strong>Food Item:</strong> {order.foodName || order.foodItem}</p>
                  <p><strong>Qty:</strong> {order.quantity || 1} &nbsp;·&nbsp; <strong>Price:</strong> {amount}</p>
                  <p><strong>Status:</strong> <span className={`db-badge ${statusToClassName(status)}`}>{getStatusDisplayLabel(status)}</span></p>
                  <div className="db-action-btns" style={{ flexWrap: "wrap", marginTop: 6 }}>
                    {nextSteps.length > 0 ? nextSteps.map((next) => (
                      <button key={next} type="button" className={`db-next-btn db-next-${statusToClassName(next)}`}
                        onClick={() => updateOrderStatus(order.id, next)}>
                        {getStatusDisplayLabel(next)}
                      </button>
                    )) : (
                      <span className="db-final-badge">Final</span>
                    )}
                  </div>
                  <button type="button" className="db-table-action danger mt-2" onClick={() => deleteOrder(order.id)}>
                    <Trash2 size={14} /> Delete
                  </button>
                </article>
              );
            }) : <div className="db-orders-empty-text">{orderEmptyMessage}</div>}
          </div>
        </section>
      );
    }

    /* MENU */
    if (activeItem === "menu") {
      return (
        <div className="db-split-grid">
          <section className="db-card">
            <div className="db-section-head"><h2>{menuForm.id ? "Edit Menu Item" : "Add New Menu Item"}</h2></div>
            <form className="db-form-grid" onSubmit={saveMenuItem}>
              <div className="db-field-wrap">
                <input className="db-input" placeholder="Name" value={menuForm.name} onChange={(e) => updateMenuField("name", e.target.value)} />
                {menuErrors.name ? <p className="db-field-error">{menuErrors.name}</p> : null}
              </div>
              <div className="db-field-wrap">
                <input className="db-input" placeholder="Category" value={menuForm.category} onChange={(e) => updateMenuField("category", e.target.value)} />
                {menuErrors.category ? <p className="db-field-error">{menuErrors.category}</p> : null}
              </div>
              <div className="db-field-wrap">
                <input className="db-input" type="number" min="0" step="0.01" placeholder="Price" value={menuForm.price} onChange={(e) => updateMenuField("price", e.target.value)} />
                {menuErrors.price ? <p className="db-field-error">{menuErrors.price}</p> : null}
              </div>
              <div className="db-field-wrap">
                <input className="db-input" placeholder="Image URL" value={menuForm.image} onChange={(e) => updateMenuField("image", e.target.value)} />
                {menuErrors.image ? <p className="db-field-error">{menuErrors.image}</p> : null}
              </div>
              <div className="db-field-wrap">
                <textarea className="db-input" placeholder="Description" rows="4" value={menuForm.description} onChange={(e) => updateMenuField("description", e.target.value)} />
                {menuErrors.description ? <p className="db-field-error">{menuErrors.description}</p> : null}
              </div>
              <label className="db-checkbox-row">
                <input type="checkbox" checked={menuForm.availability} onChange={(e) => setMenuForm((p) => ({ ...p, availability: e.target.checked }))} />
                <span>Available</span>
              </label>
              <div className="db-actions-row">
                <button type="submit" className="db-pill-btn">{menuForm.id ? "Update Item" : "Add Item"}</button>
                {menuForm.id && <button type="button" className="db-ghost-btn" onClick={() => { setMenuForm(menuInitialState); setMenuErrors({}); }}>Cancel Edit</button>}
              </div>
            </form>
          </section>
          <section className="db-card db-table-card">
            <div className="db-section-head"><h2>Menu Inventory</h2></div>
            <div className="db-table-wrap db-admin-menu-table">
              <table className="db-table">
                <thead><tr><th>Item ID</th><th>Name</th><th>Category</th><th>Price</th><th>Availability</th><th>Actions</th></tr></thead>
                <tbody>
                  {menuItemsData.map((item) => (
                    <tr key={item.id}>
                      <td>{item.itemId}</td><td>{item.name}</td><td>{item.category}</td>
                      <td>{formatCurrency(item.price)}</td>
                      <td><span className={`db-badge ${item.availability ? "delivered" : "pending"}`}>{item.availability ? "Available" : "Unavailable"}</span></td>
                      <td>
                        <div className="db-inline-actions">
                          <button type="button" className="db-table-action" onClick={() => editMenuItem(item)}>Edit</button>
                          <button type="button" className="db-table-action danger" onClick={() => deleteMenuItem(item.id)}><Trash2 size={14} /> Delete</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="db-admin-menu-cards">
              {menuItemsData.map((item) => (
                <article key={item.id} className="db-mobile-order-card">
                  <p><strong>Item ID:</strong> {item.itemId}</p>
                  <p><strong>Name:</strong> {item.name} &nbsp;·&nbsp; <strong>Category:</strong> {item.category}</p>
                  <p><strong>Price:</strong> {formatCurrency(item.price)} &nbsp;·&nbsp; <span className={`db-badge ${item.availability ? "delivered" : "pending"}`}>{item.availability ? "Available" : "Unavailable"}</span></p>
                  <div className="db-inline-actions">
                    <button type="button" className="db-table-action" onClick={() => editMenuItem(item)}>Edit</button>
                    <button type="button" className="db-table-action danger" onClick={() => deleteMenuItem(item.id)}><Trash2 size={14} /> Delete</button>
                  </div>
                </article>
              ))}
            </div>
          </section>
        </div>
      );
    }

    /* RESERVATIONS */
    if (activeItem === "reservations") {
      return (
        <section className="db-card db-table-card db-res-section">
          <div className="db-section-head">
            <h2>Reservation Management</h2>
            <span className="db-res-count-badge">{reservations.length} reservation{reservations.length !== 1 ? "s" : ""}</span>
          </div>

          {/* ── DESKTOP TABLE ── */}

          <div className="db-res-table-wrap db-admin-reservations-table premium-card-table">
            <div className="premium-table-header" style={{gridTemplateColumns: '14% 18% 12% 10% 12% 8% 6% 10% 10% 12%'}}>
              <div style={{textAlign:'center'}}>Reservation ID</div>
              <div style={{textAlign:'center'}}>Customer Name</div>
              <div style={{textAlign:'center'}}>Phone</div>
              <div style={{textAlign:'center'}}>Table</div>
              <div style={{textAlign:'center'}}>Date</div>
              <div style={{textAlign:'center'}}>Time</div>
              <div style={{textAlign:'center'}}>Guests</div>
              <div style={{textAlign:'center'}}>Deposit</div>
              <div style={{textAlign:'center'}}>Status</div>
              <div style={{textAlign:'center'}}>Actions</div>
            </div>
            {reservations.length ? (
              <>
                {reservations.map((r) => {
                  const status = getReservationStatus(r.reservationStatus || r.status);
                  const paymentStatus = getReservationPaymentStatus(r);
                  const nextSteps = getAvailableReservationActions(status);
                  const isFinal = status === "Completed" || status === "Cancelled";
                  const nameParts = (r.customerName || "").trim().split(/\s+/);
                  const firstName = nameParts[0] || "";
                  const lastName = nameParts.slice(1).join(" ") || "";
                  const paymentUrl = stripePaymentUrl(r.paymentIntentId);
                  const reservationNumber = String(r.reservationId || "").replace(/^RSV-?/i, "");
                  let formattedDate = "-", formattedTime = "-";
                  if (r.date && r.time) {
                    try {
                      const dt = new Date(`${r.date}T${r.time}`);
                      formattedDate = format(dt, "MMM d, yyyy");
                      formattedTime = format(dt, "hh:mm a");
                    } catch { formattedDate = r.date; formattedTime = r.time; }
                  }
                  return (
                    <>
                      <div className="premium-table-row" style={{gridTemplateColumns: '14% 18% 12% 10% 12% 8% 6% 10% 10% 12%'}}>
                        <div className="premium-table-cell premium-id-cell" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72}}>
                          <div className="premium-res-id-split" style={{alignItems:'center'}}>
                            <span className="premium-res-id-prefix" style={{fontWeight:900, fontSize:13}}>RSV-</span>
                            <span className="premium-res-id-number" style={{fontWeight:700, fontSize:15, wordBreak:'break-all'}}>{reservationNumber}</span>
                          </div>
                        </div>
                        <div className="premium-table-cell premium-name-cell" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72}}>
                          <div className="premium-name-split" style={{flexDirection:'column', alignItems:'center', gap:2}}>
                            <span style={{fontWeight:600, fontSize:15}}>{firstName}</span>
                            <span style={{fontWeight:600, fontSize:15}}>{lastName}</span>
                          </div>
                        </div>
                        <div className="premium-table-cell premium-phone-cell" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72, fontWeight:500, fontSize:14, whiteSpace:'nowrap'}}>{r.phone || "—"}</div>
                        <div className="premium-table-cell premium-table-cellnum" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72, fontWeight:600, fontSize:14}}>{r.tableNumber ? `Table ${r.tableNumber}` : "—"}</div>
                        <div className="premium-table-cell premium-date-cell" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72, fontWeight:500, fontSize:14}}>{formattedDate}</div>
                        <div className="premium-table-cell premium-time-cell" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72, fontWeight:500, fontSize:14}}>{formattedTime}</div>
                        <div className="premium-table-cell premium-guests-cell" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72, fontWeight:600, fontSize:14}}>{r.guests || "—"}</div>
                        <div className="premium-table-cell premium-deposit-cell" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72}}>
                          {r.depositAmount > 0
                            ? <span className="db-money-pill db-gold-badge">{formatCurrency(r.depositAmount)}</span>
                            : <span className="db-badge-muted">—</span>}
                        </div>
                        <div className="premium-table-cell premium-status-cell" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72}}>
                          <span className={`db-badge db-badge-status ${statusToClassName(status)}`}>{status}</span>
                        </div>
                        <div className="premium-table-cell premium-actions-cell" style={{width:'100%', textAlign:'center', justifyContent:'center', minHeight:72, display:'flex', alignItems:'center', justifyItems:'center'}}>
                          <div className="db-res-actions db-action-btns" style={{display:'flex', justifyContent:'center', alignItems:'center', gap:10, width:'100%'}} aria-label={`Actions for ${r.reservationId}`}>
                            <button type="button" className="db-icon-action db-action-view" title="View reservation" onClick={() => setSelectedReservation(r)}>
                              <Eye size={16} />
                            </button>
                            <button type="button" className="db-icon-action db-action-approve" title="Confirm reservation" disabled={!nextSteps.includes("Confirmed") } onClick={() => updateReservationStatus(r.id, "Confirmed")}> 
                              <CheckCircle2 size={16} />
                            </button>
                            <button type="button" className="db-icon-action db-action-complete" title="Complete reservation" disabled={!nextSteps.includes("Completed") } onClick={() => updateReservationStatus(r.id, "Completed")}> 
                              <CheckCircle2 size={16} />
                            </button>
                            <button type="button" className="db-icon-action db-action-cancel" title="Cancel reservation" disabled={!nextSteps.includes("Cancelled") } onClick={() => updateReservationStatus(r.id, "Cancelled")}> 
                              <XCircle size={16} />
                            </button>
                            <button type="button" className="db-icon-action db-action-delete" title="Delete reservation" onClick={() => deleteReservation(r.id)}>
                              <Trash2 size={16} />
                            </button>
                            <button type="button" className={`db-icon-action db-action-payment payment ${statusToClassName(paymentStatus)}`} title={paymentUrl ? "Open Stripe payment" : "Payment details"} onClick={() => paymentUrl ? window.open(paymentUrl, "_blank", "noopener,noreferrer") : setSelectedReservation(r)}>
                              <CreditCard size={16} />
                            </button>
                            {isFinal && <span className="db-final-badge">Final</span>}
                          </div>
                        </div>
                      </div>
                    </>
                  );
                })}
              </>
            ) : (
              <div className="premium-table-row">
                <div className="premium-table-cell" style={{ gridColumn: "1 / span 10", textAlign: "center" }}>
                  <div className="db-orders-empty-text">No table reservations have been submitted yet.</div>
                </div>
              </div>
            )}
          </div>

          {/* ── MOBILE CARDS ── */}
          <div className="db-admin-reservations-cards">
            {reservations.length ? reservations.map((r) => {
              const status = getReservationStatus(r.reservationStatus || r.status);
              const paymentStatus = getReservationPaymentStatus(r);
              const nextSteps = getAvailableReservationActions(status);
              const paymentUrl = stripePaymentUrl(r.paymentIntentId);
              return (
                <article key={r.id} className="db-mobile-order-card">
                  <p><strong>Res. ID:</strong> RSV-{(r.reservationId || "").toString().slice(-4).padStart(4, "0")}</p>
                  <p><strong>Customer:</strong> {r.customerName} <span className="db-customer-premium-label">Premium Guest</span></p>
                  {/* <p><strong>Email:</strong> {r.email}</p> */}
                  <p><strong>Phone:</strong> {r.phone || "—"}</p>
                  <p><strong>Table:</strong> {r.tableNumber || "—"}</p>
                  <p><strong>Date:</strong> {r.date} &nbsp;·&nbsp; <strong>Time:</strong> {r.time}</p>
                  {r.depositAmount > 0 && <p><strong>Deposit:</strong> <span className="db-money-pill db-gold-badge">{formatCurrency(r.depositAmount)}</span></p>}
                  <p><strong>Payment:</strong> <span className={`db-badge ${statusToClassName(paymentStatus)}`}>{paymentStatus}</span></p>
                  <p><strong>Status:</strong> <span className={`db-badge ${statusToClassName(status)}`}>{status}</span></p>
                  <div className="db-res-actions db-action-btns db-res-actions-mobile">
                    <button type="button" className="db-icon-action db-action-view" onClick={() => setSelectedReservation(r)}><Eye size={14} /> View</button>
                    <button type="button" className="db-icon-action db-action-approve" disabled={!nextSteps.includes("Confirmed")} onClick={() => updateReservationStatus(r.id, "Confirmed")}><CheckCircle2 size={14} /> Approve</button>
                    <button type="button" className="db-icon-action db-action-complete" disabled={!nextSteps.includes("Completed")} onClick={() => updateReservationStatus(r.id, "Completed")}><CheckCircle2 size={14} /> Complete</button>
                    <button type="button" className="db-icon-action db-action-cancel" disabled={!nextSteps.includes("Cancelled")} onClick={() => updateReservationStatus(r.id, "Cancelled")}><XCircle size={14} /> Cancel</button>
                    <button type="button" className="db-icon-action db-action-delete" onClick={() => deleteReservation(r.id)}><Trash2 size={14} /> Delete</button>
                    <button type="button" className={`db-icon-action db-action-payment payment ${statusToClassName(paymentStatus)}`} onClick={() => paymentUrl ? window.open(paymentUrl, "_blank", "noopener,noreferrer") : setSelectedReservation(r)}><CreditCard size={14} /> Payment</button>
                  </div>
                </article>
              );
            }) : <div className="db-empty-state"><h3>No reservations found</h3><p><span role="img" aria-label="calendar">📅</span> No reservations have been made yet.</p></div>}
          </div>
        </section>
      );
    }

    /* CUSTOMERS */
    if (activeItem === "customers") {
      // Filter out admin users by email, role, isAdmin, or userType
      const adminEmail = "vrbitesrestaurant@gmail.com";
      const filteredCustomers = customers.filter(
        (c) =>
          c.email?.toLowerCase() !== adminEmail &&
          c.role !== "admin" &&
          c.isAdmin !== true &&
          c.userType !== "admin"
      );

      // Helper to show short customer ID
      function getShortCustomerId(id) {
        if (!id) return "-";
        const str = String(id);
        if (str.length <= 8) return `CUS-${str.toUpperCase()}`;
        return `CUS-${str.slice(-5).toUpperCase()}`;
      }

      return (
        <section className="db-card db-table-card">
          <div className="db-section-head"><h2>Customers</h2></div>
          {filteredCustomers.length > 0 ? (
            <div className="db-res-table-wrap db-admin-reservations-table premium-card-table" style={{overflowX: 'auto', WebkitOverflowScrolling: 'touch'}}>
              <table className="db-table db-customers-table" style={{ minWidth: 1100, tableLayout: 'fixed', width: '100%' }}>
                <colgroup>
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '25%' }} />
                  <col style={{ width: '15%' }} />
                  <col style={{ width: '10%' }} />
                  <col style={{ width: '10%', minWidth: 120 }} />
                </colgroup>
                <thead>
                  <tr>
                    <th style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 700 }}>Customer ID</th>
                    <th style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 700 }}>Customer Name</th>
                    <th style={{ textAlign: 'left', padding: '12px 10px', fontWeight: 700 }}>Email</th>
                    <th style={{ textAlign: 'center', padding: '12px 10px', fontWeight: 700 }}>Last Login</th>
                    <th style={{ textAlign: 'center', padding: '12px 10px', fontWeight: 700 }}>Orders</th>
                    <th style={{ textAlign: 'center', padding: '12px 10px', fontWeight: 700, minWidth: 120 }}>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCustomers.map((customer) => (
                    <tr key={customer.id} style={{ minHeight: 76, height: 76, verticalAlign: 'middle' }}>
                      <td style={{ wordBreak: 'break-all', padding: '12px 10px', fontSize: 15, lineHeight: 1.25, verticalAlign: 'middle', fontFamily: 'monospace', background: '#f9f9fa' }}>
                        {getShortCustomerId(customer.id || customer._id)}
                      </td>
                      <td style={{ padding: '12px 10px', fontWeight: 600, fontSize: 16, lineHeight: 1.25, verticalAlign: 'middle', whiteSpace: 'pre-line', wordBreak: 'break-word' }}>
                        {customer.fullName || customer.customerName || "-"}
                      </td>
                      <td style={{ padding: '12px 10px', fontSize: 15, lineHeight: 1.25, verticalAlign: 'middle', wordBreak: 'break-all', maxWidth: 260, whiteSpace: 'normal' }}>
                        {customer.email}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 10px', fontSize: 15, verticalAlign: 'middle', minWidth: 100 }}>
                        {customer.lastLoginAt
                          ? format(new Date(customer.lastLoginAt), "MMM d, yyyy")
                          : customer.createdAt
                            ? format(new Date(customer.createdAt), "MMM d, yyyy")
                            : "-"}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 10px', fontSize: 15, verticalAlign: 'middle' }}>
                        {customer.totalOrders ?? (orders?.filter(o => o.userEmail === customer.email).length || 0)}
                      </td>
                      <td style={{ textAlign: 'center', padding: '12px 10px', verticalAlign: 'middle', minWidth: 120 }}>
                        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: 10, width: '100%' }}>
                          <button type="button" className="db-table-action danger" title="Delete customer" style={{ minWidth: 42, display: "inline-flex", justifyContent: "center", alignItems: "center", marginLeft: 2 }} disabled>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <div className="premium-table-row">
              <div className="premium-table-cell" style={{ gridColumn: "1 / span 6", textAlign: "center" }}>
                <div className="db-orders-empty-text">No customers found.</div>
              </div>
            </div>
          )}
        </section>
      );
    }

    if (activeItem === "settings") {
      return (
        <section className="db-card">
          <div className="db-section-head"><h2>Settings</h2></div>
          <p className="db-orders-empty-text">Admin settings will appear here.</p>
        </section>
      );
    }

    return null;
  };

  return (
    <div className="db-layout">
      <Sidebar
        menuItems={menuItems}
        activeItem={activeItem}
        onSelect={handleSetActiveItem}
        isOpen={isSidebarOpen}
        onClose={toggleSidebar}
        role="ADMIN"
      />

      <div className="db-main">
        <DashboardNavbar
          title="Admin Dashboard"
          user={user}
          onToggleSidebar={toggleSidebar}
          showUserChip={false}
        />

        <main className="db-content">{renderAdminContent()}</main>
      </div>

      {/* Reservation detail modal */}
      {selectedReservation && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label="Reservation details"
          onClick={() => setSelectedReservation(null)}
          style={{
            position: "fixed",
            inset: 0,
            zIndex: 1000,
            display: "grid",
            placeItems: "center",
            padding: 18,
            background: "rgba(32, 20, 12, 0.48)",
            backdropFilter: "blur(4px)",
          }}
        >
          <article
            onClick={(e) => e.stopPropagation()}
            style={{
              width: "min(580px, 100%)",
              borderRadius: 22,
              border: "1px solid rgba(193, 145, 88, 0.28)",
              background: "#fffaf5",
              boxShadow: "0 26px 70px rgba(35, 22, 12, 0.28)",
              overflow: "hidden",
              padding: 28,
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 20 }}>
              <div>
                <h3 style={{ margin: 0, color: "#2b1a10", fontSize: 22 }}>Reservation Details</h3>
                <p style={{ margin: "6px 0 0", color: "#7d6b5b", fontSize: 14 }}>
                  {selectedReservation.reservationId || selectedReservation.id}
                </p>
              </div>
              <span className={`db-badge ${statusToClassName(getReservationStatus(selectedReservation.reservationStatus || selectedReservation.status))}`}>
                {getReservationStatus(selectedReservation.reservationStatus || selectedReservation.status)}
              </span>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 14 }}>
              {[
                ["Customer", selectedReservation.customerName || "—"],
                ["Email", selectedReservation.email || "—"],
                ["Phone", selectedReservation.phone || "—"],
                ["Date", selectedReservation.date || "—"],
                ["Time", selectedReservation.time || "—"],
                ["Guests", selectedReservation.guests || "—"],
                ["Table", selectedReservation.tableNumber ? `Table ${selectedReservation.tableNumber}` : "—"],
                ["Deposit", selectedReservation.depositAmount > 0 ? formatCurrency(selectedReservation.depositAmount) : "—"],
                ["Payment", getReservationPaymentStatus(selectedReservation)],
                ["Notes", selectedReservation.specialRequest || "—"],
              ].map(([label, value]) => (
                <div key={label} style={{ padding: "10px 14px", borderRadius: 12, background: "#fff7ef", border: "1px solid rgba(178,132,78,0.16)" }}>
                  <span style={{ display: "block", color: "#8a6a47", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                  <strong style={{ display: "block", marginTop: 4, color: "#2f1c10", fontSize: 14, wordBreak: "break-word" }}>{value}</strong>
                </div>
              ))}
            </div>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 22 }}>
              <button
                type="button"
                className="db-pill-btn"
                onClick={() => setSelectedReservation(null)}
              >
                Close
              </button>
            </div>
          </article>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;
