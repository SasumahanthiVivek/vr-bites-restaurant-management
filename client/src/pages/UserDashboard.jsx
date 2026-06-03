import { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { useUser } from "@clerk/clerk-react";
import toast from "react-hot-toast";
import {
  CalendarCheck2,
  CheckCircle2,
  ChefHat,
  Clock3,
  Download,
  Eye,
  LayoutDashboard,
  ListOrdered,
  MapPin,
  Navigation,
  Phone,
  Settings,
  UserCircle,
  RotateCcw,
  ShoppingBag,
  Sparkles,
  Truck,
  XCircle,
} from "lucide-react";
import Sidebar from "../components/dashboard/Sidebar";
import DashboardNavbar from "../components/dashboard/DashboardNavbar";
import StatsCard from "../components/dashboard/StatsCard";
import { AccessDeniedMessage } from "../components/ProtectedRoute";
import { apiRequest } from "../apiClient";
import "../styles/dashboard.css";

const menuItems = [
  { key: "dashboard", label: "My Dashboard", icon: LayoutDashboard },
  { key: "orders", label: "My Orders", icon: ShoppingBag },
  { key: "reservations", label: "My Reservations", icon: CalendarCheck2 },
  { key: "profile", label: "Profile", icon: UserCircle },
  { key: "settings", label: "Settings", icon: Settings },
  { key: "insights", label: "Insights", icon: Sparkles },
];

const allowedTabs = new Set([...menuItems.map((item) => item.key), "tracking"]);
const userPathByTab = {
  dashboard: "/user-dashboard",
  orders: "/my-orders",
  reservations: "/my-reservations",
  profile: "/user-dashboard/profile",
  settings: "/user-dashboard/settings",
  insights: "/user-dashboard/insights",
  tracking: "/user-dashboard?tab=tracking",
};

function getUserTabFromPath(pathname, fallback = "") {
  const path = String(pathname || "");
  if (path.startsWith("/my-orders") || path.startsWith("/order-details/")) return "orders";
  if (path.startsWith("/my-reservations") || path.startsWith("/reservation/")) return "reservations";
  const segment = path.split("/").filter(Boolean).pop();
  if (allowedTabs.has(segment)) return segment;
  return allowedTabs.has(fallback) ? fallback : "";
}

function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

// Returns a 2-line-safe display ID: prefix + last 5 digits only.
// The FULL id is still used in receipts, emails, tracking, and APIs.
function shortOrderId(orderId) {
  const value = String(orderId || "");
  if (!value || value === "-") return value;
  const [prefix, ...rest] = value.split("-");
  const number = rest.length ? rest.join("") : value;
  return (rest.length ? prefix : "ORD") + "-" + (number.length > 5 ? number.slice(-5) : number);
}

// Returns a meal-period-aware delivery message based on the delivered timestamp.
function getMealPeriodMessage(deliveredAt) {
  const dt = deliveredAt ? new Date(deliveredAt) : new Date();
  const hour = Number.isNaN(dt.getTime()) ? new Date().getHours() : dt.getHours();
  if (hour >= 5 && hour < 12) return "Delivered successfully. Enjoy your breakfast.";
  if (hour >= 12 && hour < 17) return "Delivered successfully. Enjoy your lunch.";
  if (hour >= 17 && hour < 24) return "Delivered successfully. Enjoy your dinner.";
  return "Delivered successfully. Enjoy your meal."; // 12:00 AM – 4:59 AM
}

function formatOrderDate(value) {
  if (!value) return "-";
  return new Date(value).toLocaleDateString();
}

function statusToClassName(status) {
  return String(status || "placed").trim().toLowerCase().replace(/\s+/g, "-");
}

function normalizeOrderStatus(status) {
  const normalized = String(status || "PLACED").trim().toUpperCase();
  if (normalized === "PREPARING") {
    return "IN PROGRESS";
  }
  if (normalized === "COMPLETED") {
    return "DELIVERED";
  }
  if (normalized === "CANCELLED" || normalized === "CANCELED") {
    return "CANCELLED";
  }
  if (
    normalized !== "PLACED" &&
    normalized !== "CONFIRMED" &&
    normalized !== "IN PROGRESS" &&
    normalized !== "DELIVERED" &&
    normalized !== "CANCELLED"
  ) {
    return "PLACED";
  }
  return normalized;
}

function getStatusDisplayLabel(status) {
  const normalized = normalizeOrderStatus(status);
  const labels = {
    PLACED: "Order Placed",
    CONFIRMED: "Order Confirmed",
    "IN PROGRESS": "In Progress",
    DELIVERED: "Delivered",
    CANCELLED: "Cancelled",
  };
  return labels[normalized] || normalized;
}

function getOrderTime(order) {
  const rawDate = order?.createdAt || order?.bookedAt || order?.updatedAt;
  const orderDate = rawDate ? new Date(rawDate) : new Date();
  return Number.isNaN(orderDate.getTime()) ? new Date() : orderDate;
}

function getOrderTitle(order) {
  return order?.foodName || order?.foodItem || "Signature order";
}

function getOrderAmount(order) {
  return Number(order?.totalPrice || Number(order?.price || 0) * Number(order?.quantity || 1) || 0);
}

function getOrderCategory(order) {
  return order?.category || order?.foodCategory || order?.menuCategory || "Signature";
}

function getMonthKey(date) {
  return date.toLocaleDateString("en-US", { month: "short" });
}

function formatDateTime(dt) {
  if (!dt || Number.isNaN(dt.getTime())) return "Pending";
  return dt.toLocaleString("en-IN", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

function formatTime(dt) {
  if (!dt || Number.isNaN(dt.getTime())) return "Pending";
  return dt.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
}

function getOrderDate(order, keys) {
  for (const key of keys) {
    if (order?.[key]) {
      const dt = new Date(order[key]);
      if (!Number.isNaN(dt.getTime())) return dt;
    }
  }
  return null;
}

function getDeliveryPartner(order) {
  const partners = [
    { name: "Sneha Reddy", phone: "+91 98765 43210", vehicleType: "Bike", vehicleNumber: "TS09 AB 1234", image: "SR" },
    { name: "Rahul Verma", phone: "+91 98765 43109", vehicleType: "Scooter", vehicleNumber: "TS08 CV 8842", image: "RV" },
    { name: "Priya Sharma", phone: "+91 98765 43098", vehicleType: "Bike", vehicleNumber: "TS10 KT 5601", image: "PS" },
    { name: "Arjun Patel", phone: "+91 98765 42987", vehicleType: "E-Bike", vehicleNumber: "TS07 EV 2045", image: "AP" },
  ];
  const raw = String(order?.id || order?.orderId || "0");
  const index = raw.split("").reduce((sum, char) => sum + char.charCodeAt(0), 0) % partners.length;
  const fallback = partners[index];
  return {
    name: order?.deliveryPartnerName || order?.deliveryPerson || fallback.name,
    phone: order?.deliveryPartnerPhone || order?.deliveryPhone || fallback.phone,
    vehicleType: order?.vehicleType || fallback.vehicleType,
    vehicleNumber: order?.vehicleNumber || fallback.vehicleNumber,
    image: order?.deliveryPartnerImage || "",
    initials: fallback.image,
  };
}

function buildSparklinePoints(data, width = 320, height = 96, padding = 14) {
  const values = data.map((item) => Number(item.value || 0));
  const max = Math.max(...values, 1);
  const step = data.length > 1 ? (width - padding * 2) / (data.length - 1) : 0;

  return data
    .map((item, index) => {
      const x = padding + step * index;
      const y = height - padding - (Number(item.value || 0) / max) * (height - padding * 2);
      return `${x},${y}`;
    })
    .join(" ");
}

function PremiumMetricCard({ label, value, detail }) {
  return (
    <article style={{
      minHeight: 118,
      padding: 18,
      borderRadius: 18,
      border: "1px solid rgba(178, 132, 78, 0.22)",
      background: "linear-gradient(145deg, #fffaf4 0%, #f8ead8 100%)",
      boxShadow: "0 16px 36px rgba(77, 48, 22, 0.08)",
    }}>
      <span style={{ display: "block", color: "#8a6a47", fontSize: 12, fontWeight: 800, textTransform: "uppercase", letterSpacing: 0.4 }}>{label}</span>
      <strong style={{ display: "block", marginTop: 8, color: "#2d1c12", fontSize: 26, lineHeight: 1.1 }}>{value}</strong>
      <span style={{ display: "block", marginTop: 8, color: "#7b6a5c", fontSize: 13 }}>{detail}</span>
    </article>
  );
}

function PremiumLineChart({ title, subtitle, data }) {
  const points = buildSparklinePoints(data);
  const fillPoints = `14,96 ${points} 306,96`;

  return (
    <article style={{
      padding: 20,
      borderRadius: 20,
      border: "1px solid rgba(178, 132, 78, 0.2)",
      background: "#fffaf5",
      boxShadow: "0 18px 38px rgba(62, 42, 26, 0.08)",
      overflow: "hidden",
    }}>
      <div style={{ display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", marginBottom: 14 }}>
        <div>
          <h3 style={{ margin: 0, fontSize: 17, color: "#2b1a10" }}>{title}</h3>
          <p style={{ margin: "4px 0 0", color: "#7d6b5b", fontSize: 13 }}>{subtitle}</p>
        </div>
      </div>
      <svg viewBox="0 0 320 116" role="img" aria-label={title} style={{ width: "100%", height: 150, display: "block" }}>
        <defs>
          <linearGradient id={`${title.replace(/\s+/g, "-")}-fill`} x1="0" x2="0" y1="0" y2="1">
            <stop offset="0%" stopColor="#b98345" stopOpacity="0.28" />
            <stop offset="100%" stopColor="#b98345" stopOpacity="0.03" />
          </linearGradient>
        </defs>
        {[24, 52, 80].map((y) => <line key={y} x1="14" x2="306" y1={y} y2={y} stroke="#ead8c3" strokeWidth="1" />)}
        <polygon points={fillPoints} fill={`url(#${title.replace(/\s+/g, "-")}-fill)`} />
        <polyline points={points} fill="none" stroke="#9b642d" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
        {data.map((item, index) => {
          const values = data.map((entry) => Number(entry.value || 0));
          const max = Math.max(...values, 1);
          const x = 14 + ((320 - 28) / Math.max(data.length - 1, 1)) * index;
          const y = 96 - 14 - (Number(item.value || 0) / max) * (96 - 28);
          return <circle key={item.label} cx={x} cy={y} r="4.5" fill="#fffaf5" stroke="#9b642d" strokeWidth="3" />;
        })}
        {data.map((item, index) => {
          const x = 14 + ((320 - 28) / Math.max(data.length - 1, 1)) * index;
          return <text key={item.label} x={x} y="112" textAnchor="middle" fill="#8b7866" fontSize="10">{item.label}</text>;
        })}
      </svg>
    </article>
  );
}

function PremiumBarChart({ title, subtitle, data }) {
  const max = Math.max(...data.map((item) => Number(item.value || 0)), 1);

  return (
    <article style={{
      padding: 20,
      borderRadius: 20,
      border: "1px solid rgba(178, 132, 78, 0.2)",
      background: "#fffaf5",
      boxShadow: "0 18px 38px rgba(62, 42, 26, 0.08)",
    }}>
      <h3 style={{ margin: 0, fontSize: 17, color: "#2b1a10" }}>{title}</h3>
      <p style={{ margin: "4px 0 18px", color: "#7d6b5b", fontSize: 13 }}>{subtitle}</p>
      <div style={{ display: "grid", gridTemplateColumns: `repeat(${Math.max(data.length, 1)}, minmax(32px, 1fr))`, gap: 10, alignItems: "end", height: 148 }}>
        {data.map((item) => (
          <div key={item.label} style={{ display: "grid", gap: 8, alignItems: "end", height: "100%" }}>
            <div title={`${item.label}: ${item.value}`} style={{
              alignSelf: "end",
              minHeight: 8,
              height: `${Math.max(8, (Number(item.value || 0) / max) * 118)}px`,
              borderRadius: "12px 12px 5px 5px",
              background: "linear-gradient(180deg, #c89658 0%, #70421d 100%)",
              boxShadow: "0 10px 22px rgba(112, 66, 29, 0.18)",
            }} />
            <span style={{ color: "#8b7866", fontSize: 11, textAlign: "center" }}>{item.label}</span>
          </div>
        ))}
      </div>
    </article>
  );
}

function getMinutesSince(date, now) {
  return Math.max(0, Math.floor((now.getTime() - date.getTime()) / 60000));
}

function formatElapsedTime(minutes) {
  if (minutes < 60) {
    return minutes <= 1 ? "just now" : `${minutes} minutes ago`;
  }

  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;

  if (!remainingMinutes) {
    return `${hours} ${hours === 1 ? "hour" : "hours"} ago`;
  }

  return `${hours} ${hours === 1 ? "hour" : "hours"} ${remainingMinutes} min ago`;
}

function getTrackingStage(order) {
  if (!order) {
    return 0;
  }

  const status = normalizeOrderStatus(order.orderStatus || order.status);

  if (status === "DELIVERED" || status === "CANCELLED") {
    return 3;
  }

  if (status === "IN PROGRESS") {
    return 2;
  }

  if (status === "CONFIRMED") {
    return 1;
  }

  return 0;
}

function getTrackingMeta(order, now) {
  if (!order) {
    return {
      stage: 0,
      progress: 0,
      etaMinutes: 0,
      etaLabel: "-",
      distanceLabel: "-",
      statusLabel: "No active order",
    };
  }

  const stage = getTrackingStage(order);
  const status = normalizeOrderStatus(order.orderStatus || order.status);
  const progressByStage = [12, 42, 72, 100];
  const statusLabels = status === "CANCELLED"
    ? ["Order Placed", "Confirmed", "Preparing", "Order Cancelled"]
    : ["Order Placed", "Confirmed by VR BITES", "Preparing Food", "Delivered"];
  const placedAt = getOrderDate(order, ["placedAt", "createdAt"]);
  const estimatedAt = getOrderDate(order, ["estimatedDeliveryAt", "etaAt"]);
  const fallbackEta = placedAt ? new Date(placedAt.getTime() + 45 * 60000) : null;
  const eta = estimatedAt || fallbackEta;
  const lastUpdated = getOrderDate(order, ["updatedAt", "deliveredAt", "inProgressAt", "confirmedAt", "placedAt", "createdAt"]);

  const etaLabel = status === "DELIVERED" ? "Delivered" : eta ? formatTime(eta) : "Awaiting ETA";

  return {
    stage,
    progress: progressByStage[stage] || 0,
    etaMinutes: 0,
    etaLabel,
    distanceLabel: status === "DELIVERED" ? "0 km" : status === "CANCELLED" ? "-" : "3.4 km",
    statusLabel: statusLabels[stage],
    lastUpdated,
    estimatedAt: eta,
  };
}

// Stepper component for order status

function UserDashboard({ initialTab: initialTabProp = "", detailOrderId = "", detailReservationId = "" }) {
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const navigate = useNavigate();
  const requestedInitialTab = getUserTabFromPath(location.pathname, initialTabProp) || searchParams.get("tab") || "";
  const initialTab = allowedTabs.has(requestedInitialTab) ? requestedInitialTab : "dashboard";
  const [activeItem, setActiveItem] = useState(initialTab);
  const [isSidebarOpen, setSidebarOpen] = useState(false);
  const [orders, setOrders] = useState([]);
  const [reservations, setReservations] = useState([]);
  const [isLoading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedTrackingOrderId, setSelectedTrackingOrderId] = useState("");
  const [selectedOrderDetails, setSelectedOrderDetails] = useState(null);
  const [trackingNow, setTrackingNow] = useState(() => new Date());
  const previousStatusesRef = useRef(new Map());
  const { user } = useUser();

  const email = user?.primaryEmailAddress?.emailAddress || "";
  const normalizedDetailOrderId = String(detailOrderId || "").trim();
  const normalizedDetailReservationId = String(detailReservationId || "").trim();

  useEffect(() => {
    const pathTab = getUserTabFromPath(location.pathname, initialTabProp);
    const tabParam = searchParams.get("tab") || "";
    const tab = pathTab || (allowedTabs.has(tabParam) ? tabParam : "dashboard");
    if (tab !== activeItem) {
      setActiveItem(tab);
    }
  }, [initialTabProp, location.pathname, searchParams]); // eslint-disable-line react-hooks/exhaustive-deps

  const handleSetActiveItem = (tab) => {
    if (!allowedTabs.has(tab)) return;
    setActiveItem(tab);
    const path = userPathByTab[tab] || "/user-dashboard";
    if (path.includes("?")) {
      navigate(path);
      return;
    }
    navigate(path);
  };

  useEffect(() => {
    if (!email) {
      return;
    }

    let isMounted = true;

    const fetchUserData = async (isInitial = false) => {
      if (isInitial) {
        setLoading(true);
      }
      setError("");

      try {
        const [orderData, reservationData] = await Promise.all([
          apiRequest(`/api/orders/user/${encodeURIComponent(email)}`),
          apiRequest(`/api/reservations/user/${encodeURIComponent(email)}`),
        ]);

        if (!isMounted) {
          return;
        }

        const nextOrders = Array.isArray(orderData) ? orderData : [];

        for (const order of nextOrders) {
          const status = normalizeOrderStatus(order.orderStatus || order.status);
          const previousStatus = previousStatusesRef.current.get(order.id);

          if (previousStatus && previousStatus !== "DELIVERED" && status === "DELIVERED") {
            toast.success("Your order has been successfully delivered. Enjoy your meal!");
          }

          previousStatusesRef.current.set(order.id, status);
        }

        setOrders(nextOrders);
        setReservations(Array.isArray(reservationData) ? reservationData : []);
      } catch (apiError) {
        if (isMounted) {
          setError(apiError.message || "Unable to load your dashboard data.");
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    fetchUserData(true);
    const pollId = window.setInterval(() => fetchUserData(false), 5000);

    return () => {
      isMounted = false;
      window.clearInterval(pollId);
    };
  }, [email]);

  useEffect(() => {
    const timerId = window.setInterval(() => setTrackingNow(new Date()), 10000);
    return () => window.clearInterval(timerId);
  }, []);

  useEffect(() => {
    if (!normalizedDetailOrderId || isLoading) return;
    const matchedOrder = orders.find((order) => {
      const ids = [order.id, order._id, order.orderId].map((value) => String(value || ""));
      return ids.includes(normalizedDetailOrderId);
    });
    if (matchedOrder) {
      setActiveItem("orders");
      setSelectedOrderDetails(matchedOrder);
    }
  }, [isLoading, normalizedDetailOrderId, orders]);

  const detailOrderAccessDenied = normalizedDetailOrderId && !isLoading && !orders.some((order) => {
    const ids = [order.id, order._id, order.orderId].map((value) => String(value || ""));
    return ids.includes(normalizedDetailOrderId);
  });

  const detailReservationAccessDenied = normalizedDetailReservationId && !isLoading && !reservations.some((reservation) => {
    const ids = [reservation.id, reservation._id, reservation.reservationId].map((value) => String(value || ""));
    return ids.includes(normalizedDetailReservationId);
  });

  const handleCancelOrder = async (order) => {
    const status = normalizeOrderStatus(order.orderStatus || order.status);
    if (status !== "PLACED") {
      toast.error("Only newly placed orders can be cancelled.");
      return;
    }

    try {
      await apiRequest(`/api/orders/${order.id}`, { method: "DELETE" });
      setOrders((prev) => prev.filter((item) => item.id !== order.id));
      if (selectedTrackingOrderId === String(order.id)) {
        setSelectedTrackingOrderId("");
      }
      toast.success("Order cancelled.");
    } catch (err) {
      toast.error(err.message || "Failed to cancel order.");
    }
  };

  const handleReorder = (order) => {
    const quantity = Number(order.quantity || 1);
    const amount = getOrderAmount(order);
    navigate("/checkout", {
      state: {
        order: {
          foodName: getOrderTitle(order),
          foodItem: getOrderTitle(order),
          foodImage: order.foodImage || order.image || "",
          quantity,
          price: Number(order.price || amount / quantity || 0),
          totalPrice: amount,
          category: getOrderCategory(order),
          customerName: user?.fullName || order.customerName || "",
          userEmail: email || order.userEmail || "",
          phone: order.phone || "",
          deliveryAddress: order.deliveryAddress || "",
          specialNotes: order.specialNotes || "",
        },
      },
    });
  };

  const handleDownloadReceipt = (order) => {
    const receiptLines = [
      "VR BITES Receipt",
      `Order ID: ${order.orderId || order.id}`,
      `Item: ${getOrderTitle(order)}`,
      `Quantity: ${order.quantity || 1}`,
      `Total: ${formatCurrency(getOrderAmount(order))}`,
      `Status: ${getStatusDisplayLabel(order.orderStatus || order.status)}`,
      `Date: ${formatOrderDate(order.createdAt || order.placedAt)}`,
    ];
    const blob = new Blob([receiptLines.join("\n")], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `vr-bites-${order.orderId || order.id || "receipt"}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  const stats = useMemo(
    () => [
      { label: "My Orders", value: orders.length, icon: <ShoppingBag size={20} />, tone: "amber" },
      { label: "My Reservations", value: reservations.length, icon: <CalendarCheck2 size={20} />, tone: "peach" },
      {
        label: "Total Spent",
        value: formatCurrency(orders.reduce((sum, order) => sum + Number(order.totalPrice || 0), 0)),
        icon: <ListOrdered size={20} />,
        tone: "sand",
      },
    ],
    [orders, reservations]
  );

  const orderSummary = useMemo(() => {
    const summary = {
      placed: 0,
      confirmed: 0,
      delivered: 0,
      totalItems: 0,
      avgOrderValue: 0,
    };

    if (!orders.length) {
      return summary;
    }

    let totalValue = 0;

    orders.forEach((order) => {
      const status = normalizeOrderStatus(order.orderStatus || order.status);
      const quantity = Number(order.quantity || 0);
      const amount = Number(order.totalPrice || Number(order.price || 0) * quantity || 0);

      if (status === "PLACED") summary.placed += 1;
      if (status === "CONFIRMED") summary.confirmed += 1;
      if (status === "DELIVERED") summary.delivered += 1;

      summary.totalItems += quantity;
      totalValue += amount;
    });

    summary.avgOrderValue = totalValue / orders.length;
    return summary;
  }, [orders]);

  const trackingOrders = useMemo(() => {
    return orders
      .filter((order) => {
        const status = normalizeOrderStatus(order.orderStatus || order.status);
        return status !== "DELIVERED";
      })
      .sort((a, b) => getOrderTime(b).getTime() - getOrderTime(a).getTime());
  }, [orders]);

  const trackingFallbackOrders = useMemo(() => {
    if (trackingOrders.length) {
      return trackingOrders;
    }

    return [...orders].sort((a, b) => getOrderTime(b).getTime() - getOrderTime(a).getTime());
  }, [orders, trackingOrders]);

  const selectedTrackingOrder = useMemo(() => {
    if (!trackingFallbackOrders.length) {
      return null;
    }

    return (
      trackingFallbackOrders.find((order) => String(order.id) === String(selectedTrackingOrderId)) ||
      trackingFallbackOrders[0]
    );
  }, [selectedTrackingOrderId, trackingFallbackOrders]);

  useEffect(() => {
    if (!trackingFallbackOrders.length) {
      setSelectedTrackingOrderId("");
      return;
    }

    const hasSelectedOrder = trackingFallbackOrders.some((order) => String(order.id) === String(selectedTrackingOrderId));
    if (!hasSelectedOrder) {
      setSelectedTrackingOrderId(String(trackingFallbackOrders[0].id));
    }
  }, [selectedTrackingOrderId, trackingFallbackOrders]);

  const reservationSummary = useMemo(() => {
    const summary = {
      pending: 0,
      confirmed: 0,
      completed: 0,
      cancelled: 0,
      upcoming: null,
    };

    if (!reservations.length) {
      return summary;
    }

    const now = new Date();

    reservations.forEach((reservation) => {
      const status = String(reservation.status || "Pending").toLowerCase();
      if (status === "pending") summary.pending += 1;
      if (status === "confirmed") summary.confirmed += 1;
      if (status === "completed") summary.completed += 1;
      if (status === "cancelled") summary.cancelled += 1;

      const dt = new Date(`${reservation.date || ""}T${reservation.time || "00:00"}`);
      if (!Number.isNaN(dt.getTime()) && dt >= now) {
        if (!summary.upcoming || dt < summary.upcoming.datetime) {
          summary.upcoming = {
            datetime: dt,
            label: `${reservation.date} at ${reservation.time}`,
          };
        }
      }
    });

    return summary;
  }, [reservations]);

  const orderInsights = useMemo(() => {
    const totalSpent = orders.reduce((sum, order) => sum + getOrderAmount(order), 0);
    const completedOrders = orders.filter((order) => normalizeOrderStatus(order.orderStatus || order.status) === "DELIVERED").length;
    const categoryMap = new Map();
    const monthSeeds = Array.from({ length: 6 }, (_, index) => {
      const date = new Date();
      date.setMonth(date.getMonth() - (5 - index));
      return {
        key: `${date.getFullYear()}-${date.getMonth()}`,
        label: getMonthKey(date),
        orders: 0,
        spent: 0,
      };
    });
    const monthMap = new Map(monthSeeds.map((item) => [item.key, item]));

    orders.forEach((order) => {
      const category = getOrderCategory(order);
      const current = categoryMap.get(category) || 0;
      categoryMap.set(category, current + Number(order.quantity || 1));

      const date = getOrderTime(order);
      const key = `${date.getFullYear()}-${date.getMonth()}`;
      const month = monthMap.get(key);
      if (month) {
        month.orders += 1;
        month.spent += getOrderAmount(order);
      }
    });

    const favoriteCategory = Array.from(categoryMap.entries()).sort((a, b) => b[1] - a[1])[0]?.[0] || "Signature";

    return {
      totalSpent,
      completedOrders,
      favoriteCategory,
      monthlyOrders: monthSeeds.map((item) => ({ label: item.label, value: item.orders })),
      spendingTrend: monthSeeds.map((item) => ({ label: item.label, value: item.spent })),
    };
  }, [orders]);

  const orderActionButtonStyle = {
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    gap: 7,
    minHeight: 36,
    padding: "8px 11px",
    borderRadius: 10,
    border: "1px solid rgba(153, 102, 47, 0.22)",
    background: "#fffaf5",
    color: "#4a2d18",
    fontSize: 12,
    fontWeight: 800,
    cursor: "pointer",
    whiteSpace: "nowrap",
  };

  const renderOrderCards = (rows) => (
    <div style={{ display: "grid", gap: 14 }}>
      {rows.map((order) => {
        const status = normalizeOrderStatus(order.orderStatus || order.status);
        const canCancel = status === "PLACED";
        const amount = getOrderAmount(order);
        const title = getOrderTitle(order);

        return (
          <article key={order.id} style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 16,
            alignItems: "center",
            padding: 14,
            borderRadius: 18,
            border: "1px solid rgba(169, 122, 69, 0.18)",
            background: "linear-gradient(135deg, #fffaf4 0%, #fff4e7 100%)",
            boxShadow: "0 14px 30px rgba(58, 36, 18, 0.07)",
          }}>
            <div style={{
              width: 96,
              height: 78,
              borderRadius: 14,
              overflow: "hidden",
              background: "#ead8c5",
              boxShadow: "inset 0 0 0 1px rgba(112, 66, 29, 0.1)",
            }}>
              {order.foodImage ? (
                <img src={order.foodImage} alt={title} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
              ) : (
                <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#7d5b3a", fontWeight: 800, fontSize: 12 }}>VR BITES</div>
              )}
            </div>

            <div style={{ minWidth: 220, flex: "1 1 260px" }}>
              <h3 style={{ margin: 0, color: "#2b1a10", fontSize: 17, lineHeight: 1.25 }}>{title}</h3>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "6px 12px", marginTop: 8, color: "#756452", fontSize: 13 }}>
                <span>{shortOrderId(order.orderId || order.id)}</span>
                <span>{formatOrderDate(order.createdAt || order.placedAt)}</span>
                <span>Qty {order.quantity || 1}</span>
                <span>{getOrderCategory(order)}</span>
              </div>
              <div style={{ marginTop: 8, fontSize: 13, fontWeight: 600, color: status === "DELIVERED" ? "#15803d" : status === "CANCELLED" ? "#b91c1c" : "#92400e" }}>
                {status === "DELIVERED"
                  ? "✓ Delivered Successfully"
                  : status === "CANCELLED"
                  ? "✕ Order Cancelled"
                  : `Status: ${getStatusDisplayLabel(status)}`}
              </div>
            </div>

            <div style={{ display: "grid", gap: 8, justifyItems: "start", flex: "0 1 130px" }}>
              <span className={`db-badge ${statusToClassName(status)}`}>{getStatusDisplayLabel(status)}</span>
              <strong style={{ color: "#2d1c12", fontSize: 18 }}>{formatCurrency(amount)}</strong>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", gap: 8, justifyContent: "flex-end", flex: "1 1 240px" }}>
              <button
                type="button"
                style={orderActionButtonStyle}
                onClick={() => {
                  setSelectedTrackingOrderId(String(order.id));
                  handleSetActiveItem("tracking");
                }}
              >
                <Truck size={14} /> Track
              </button>
              <button type="button" style={orderActionButtonStyle} onClick={() => setSelectedOrderDetails(order)}>
                <Eye size={14} /> Details
              </button>
              <button type="button" style={orderActionButtonStyle} onClick={() => handleReorder(order)}>
                <RotateCcw size={14} /> Reorder
              </button>
              <button type="button" style={orderActionButtonStyle} onClick={() => handleDownloadReceipt(order)}>
                <Download size={14} /> Download Receipt
              </button>
              {canCancel ? (
                <button
                  type="button"
                  style={{ ...orderActionButtonStyle, color: "#97372f", borderColor: "rgba(151, 55, 47, 0.28)", background: "#fff3f1" }}
                  onClick={() => handleCancelOrder(order)}
                >
                  <XCircle size={14} /> Cancel
                </button>
              ) : null}
            </div>
          </article>
        );
      })}

      {!rows.length ? (
        <div className="db-empty-state" style={{ padding: 28 }}>
          <h3>No orders yet</h3>
          <p>Your VR BITES order history will appear here after checkout.</p>
        </div>
      ) : null}
    </div>
  );

  const topOrder = useMemo(() => {
    if (!orders.length) return null;

    const grouped = orders.reduce((acc, order) => {
      const key = order.foodName || order.foodItem || "Unknown";
      const current = acc.get(key) || { name: key, count: 0 };
      current.count += Number(order.quantity || 0);
      acc.set(key, current);
      return acc;
    }, new Map());

    return Array.from(grouped.values()).sort((a, b) => b.count - a.count)[0] || null;
  }, [orders]);

  const latestOrder = orders[0] || null;
  const latestReservation = reservations[0] || null;

  const renderTrackingContent = () => {
    if (!selectedTrackingOrder) {
      return (
        <section className="db-card db-empty-state">
          <h3>No orders to track yet</h3>
          <p>Once you complete checkout, your live delivery tracker will appear here automatically.</p>
        </section>
      );
    }

    const trackingMeta = getTrackingMeta(selectedTrackingOrder, trackingNow);
    const trackingStatus = normalizeOrderStatus(selectedTrackingOrder.orderStatus || selectedTrackingOrder.status);
    const orderTitle = selectedTrackingOrder.foodName || selectedTrackingOrder.foodItem || "Your order";
    const orderAddress = selectedTrackingOrder.deliveryAddress || "Your saved delivery address";
    const placedAt = new Date(selectedTrackingOrder.placedAt || selectedTrackingOrder.createdAt || Date.now());
    const confirmedAt = selectedTrackingOrder.confirmedAt ? new Date(selectedTrackingOrder.confirmedAt) : null;
    const inProgressAt = selectedTrackingOrder.inProgressAt ? new Date(selectedTrackingOrder.inProgressAt) : null;
    const deliveredAt = selectedTrackingOrder.deliveredAt ? new Date(selectedTrackingOrder.deliveredAt) : null;
    function formatDateTime(dt) {
      if (!dt || isNaN(dt.getTime())) return "—";
      return dt.toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
        hour12: true,
      });
    }
    const timeline = [
      {
        title: "Order Placed",
        copy: trackingStatus === "PLACED" || trackingStatus === "CONFIRMED" || trackingStatus === "IN PROGRESS" || trackingStatus === "DELIVERED" ? "Your order has been placed successfully and sent to VR BITES." : "Pending",
        meta: trackingStatus === "PLACED" || trackingStatus === "CONFIRMED" || trackingStatus === "IN PROGRESS" || trackingStatus === "DELIVERED" ? formatDateTime(placedAt) : "Pending",
        icon: CheckCircle2,
      },
      {
        title: "Order Confirmed",
        copy: trackingStatus === "CONFIRMED" || trackingStatus === "IN PROGRESS" || trackingStatus === "DELIVERED" ? "Your order was confirmed by VR BITES." : "Pending",
        meta: confirmedAt ? formatDateTime(confirmedAt) : "Pending",
        icon: ChefHat,
      },
      {
        title: "Preparing",
        copy: trackingStatus === "IN PROGRESS" || trackingStatus === "DELIVERED" ? "Your food is currently being prepared and will arrive soon." : "Pending",
        meta: inProgressAt ? formatDateTime(inProgressAt) : "Pending",
        icon: ChefHat,
      },
      {
        title: "Delivered",
        copy: trackingStatus === "DELIVERED" ? getMealPeriodMessage(deliveredAt) : "Pending",
        meta: deliveredAt ? formatDateTime(deliveredAt) : "Pending",
        icon: CheckCircle2,
      },
    ];

    return (
      <section className="db-card live-tracker-card">
        <div className="db-section-head live-tracker-head">
          <div>
            <h2>Track Order</h2>
            <p className="db-muted-text mb-0">Live updates refresh automatically from your order status.</p>
          </div>

          {trackingFallbackOrders.length > 1 ? (
            <select
              className="db-select live-order-select"
              value={selectedTrackingOrder?.id || ""}
              onChange={(event) => setSelectedTrackingOrderId(event.target.value)}
              aria-label="Select order to track"
            >
              {trackingFallbackOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {(order.foodName || order.foodItem || "Order")} - {order.orderId || order.id}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <div className="live-tracker-layout">
          <div className="live-map-phone" aria-label="Order route map">
            <div className="live-map-topbar">
              <Navigation size={22} />
              <strong>Track Order</strong>
            </div>

            <div className="live-map-canvas">
              <div className="map-grid-lines" aria-hidden="true"></div>
              <div className="map-route route-main" aria-hidden="true"></div>
              <div className="map-route route-turn" aria-hidden="true"></div>
              <div className="map-route route-final" aria-hidden="true"></div>

              <div className="map-pin restaurant-pin">
                <MapPin size={22} />
                <span>VR BITES</span>
              </div>
              <div className="map-pin home-pin">
                <MapPin size={22} />
              </div>
              <div className="driver-marker" style={{ "--route-progress": `${trackingMeta.progress}%` }}>
                <Truck size={20} />
              </div>

              <div className="driver-info-pop">
                <div className="driver-avatar">{(selectedTrackingOrder.deliveryPerson || "VR").charAt(0)}</div>
                <div>
                  <strong>{selectedTrackingOrder.deliveryPerson || "VR BITES Delivery"}</strong>
                  <p>
                    <Clock3 size={14} /> {trackingMeta.etaLabel}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="live-updates-panel">
            <div className="live-status-card">
              <span className={`db-badge ${statusToClassName(normalizeOrderStatus(selectedTrackingOrder.orderStatus || selectedTrackingOrder.status))}`}>
                {trackingMeta.statusLabel}
              </span>
              <h3>{orderTitle}</h3>
              <p>{orderAddress}</p>
              <div className="live-status-metrics">
                <span><Clock3 size={16} /> {trackingMeta.etaLabel}</span>
              </div>
            </div>

            <div className="delivery-timeline">
              <h3>Order Status Updates</h3>
              {timeline.map((item, index) => {
                const Icon = item.icon;
                const isActive = index <= trackingMeta.stage;

                return (
                  <article key={item.title} className={`delivery-timeline-item ${isActive ? "active" : ""}`}>
                    <span className="delivery-timeline-dot">
                      <Icon size={17} />
                    </span>
                    <div>
                      <h4>{item.title}</h4>
                      <p>{item.copy}</p>
                      <small>{item.meta}</small>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        </div>
      </section>
    );
  };

  const renderPremiumTrackingContent = () => {
    if (!selectedTrackingOrder) {
      return (
        <section className="db-card db-empty-state">
          <h3>No orders to track yet</h3>
          <p>Once you complete checkout, your live delivery tracker will appear here automatically.</p>
        </section>
      );
    }

    const trackingMeta = getTrackingMeta(selectedTrackingOrder, trackingNow);
    const trackingStatus = normalizeOrderStatus(selectedTrackingOrder.orderStatus || selectedTrackingOrder.status);
    const orderTitle = getOrderTitle(selectedTrackingOrder);
    const orderAddress = selectedTrackingOrder.deliveryAddress || "Your saved delivery address";
    const placedAt = getOrderDate(selectedTrackingOrder, ["placedAt", "createdAt"]) || new Date();
    const confirmedAt = getOrderDate(selectedTrackingOrder, ["confirmedAt"]);
    const inProgressAt = getOrderDate(selectedTrackingOrder, ["inProgressAt"]);
    const deliveredAt = getOrderDate(selectedTrackingOrder, ["deliveredAt"]);
    const deliveryPartner = getDeliveryPartner(selectedTrackingOrder);
    const orderAmount = getOrderAmount(selectedTrackingOrder);
    const isCancelled = trackingStatus === "CANCELLED";
    const timeline = isCancelled ? [
      { title: "Order Placed", copy: "Your order was received by VR BITES.", pendingCopy: "Awaiting confirmation from VR BITES.", meta: formatDateTime(placedAt), icon: CheckCircle2 },
      { title: "Confirmed by VR BITES", copy: "Your order was confirmed by VR BITES.", pendingCopy: "Awaiting confirmation from VR BITES.", meta: confirmedAt ? formatDateTime(confirmedAt) : "Pending", icon: ChefHat },
      { title: "Preparing Food", copy: "The kitchen is preparing your meal.", pendingCopy: "Your order will begin preparation shortly.", meta: inProgressAt ? formatDateTime(inProgressAt) : "Pending", icon: ChefHat },
      { title: "Order Cancelled", copy: "This order was cancelled from the admin dashboard.", pendingCopy: "We will notify you once your order progresses.", meta: formatDateTime(trackingMeta.lastUpdated), icon: XCircle },
    ] : [
      { title: "Order Placed", copy: "Your order was received by VR BITES.", pendingCopy: "Awaiting confirmation from VR BITES.", meta: formatDateTime(placedAt), icon: CheckCircle2 },
      { title: "Confirmed by VR BITES", copy: "Your order was confirmed by VR BITES.", pendingCopy: "Awaiting confirmation from VR BITES.", meta: confirmedAt ? formatDateTime(confirmedAt) : "Pending", icon: ChefHat },
      { title: "Preparing Food", copy: "The kitchen is preparing your meal.", pendingCopy: "Your order will begin preparation shortly.", meta: inProgressAt ? formatDateTime(inProgressAt) : "Pending", icon: ChefHat },
      { title: "Delivered", copy: getMealPeriodMessage(deliveredAt), pendingCopy: "Your order will be delivered once preparation is completed.", meta: deliveredAt ? formatDateTime(deliveredAt) : "Pending", icon: CheckCircle2 },
    ];

    return (
      <section style={{ display: "grid", gap: 18 }}>
        <div className="db-section-head" style={{ marginBottom: 0 }}>
          <div>
            <h2>Track Order</h2>
            <p className="db-muted-text mb-0">Synced from admin status updates. No frontend timers advance your order status.</p>
          </div>
          {trackingFallbackOrders.length > 1 ? (
            <select className="db-select live-order-select" value={selectedTrackingOrder?.id || ""} onChange={(event) => setSelectedTrackingOrderId(event.target.value)} aria-label="Select order to track">
              {trackingFallbackOrders.map((order) => (
                <option key={order.id} value={order.id}>
                  {getOrderTitle(order)} - {order.orderId || order.id}
                </option>
              ))}
            </select>
          ) : null}
        </div>

        <section style={{ position: "relative", minHeight: 340, overflow: "hidden", borderRadius: 26, border: "1px solid rgba(172, 126, 74, 0.24)", background: "linear-gradient(135deg, #f8ead8 0%, #fffaf4 52%, #ead6bd 100%)", boxShadow: "0 24px 60px rgba(52, 32, 17, 0.12)" }} aria-label="Delivery map">
          <svg viewBox="0 0 920 360" preserveAspectRatio="none" style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }} aria-hidden="true">
            <defs>
              <pattern id="tracking-grid" width="56" height="56" patternUnits="userSpaceOnUse">
                <path d="M56 0H0V56" fill="none" stroke="#d7b993" strokeOpacity="0.32" strokeWidth="1" />
              </pattern>
              <linearGradient id="tracking-route" x1="0" x2="1">
                <stop offset="0%" stopColor="#7a4a22" />
                <stop offset="100%" stopColor="#c99554" />
              </linearGradient>
            </defs>
            <rect width="920" height="360" fill="url(#tracking-grid)" />
            <path d="M88 260 C 220 160, 310 290, 430 175 S 685 100, 824 210" fill="none" stroke="#fff6ea" strokeWidth="28" strokeLinecap="round" />
            <path d="M88 260 C 220 160, 310 290, 430 175 S 685 100, 824 210" fill="none" stroke="url(#tracking-route)" strokeWidth="8" strokeLinecap="round" strokeDasharray="18 14" />
          </svg>

          <div style={{ position: "absolute", left: "7%", bottom: "18%", display: "grid", gap: 6, justifyItems: "center", color: "#3b2414", fontWeight: 900 }}>
            <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 16, background: "#3a2415", color: "#fffaf4", boxShadow: "0 14px 30px rgba(58, 36, 21, 0.25)" }}><MapPin size={24} /></span>
            <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255, 250, 244, 0.9)", fontSize: 12 }}>VR BITES</span>
          </div>

          <div style={{ position: "absolute", left: `calc(7% + ${trackingMeta.progress * 0.78}%)`, top: `calc(67% - ${Math.min(trackingMeta.progress, 80) * 0.55}%)`, transform: "translate(-50%, -50%)", transition: "left 700ms ease, top 700ms ease", display: "grid", placeItems: "center", width: 54, height: 54, borderRadius: "50%", background: "#9b642d", color: "#fffaf4", boxShadow: "0 18px 34px rgba(112, 66, 29, 0.3)" }}>
            <Truck size={25} />
          </div>

          <div style={{ position: "absolute", right: "8%", top: "52%", display: "grid", gap: 6, justifyItems: "center", color: "#3b2414", fontWeight: 900 }}>
            <span style={{ display: "grid", placeItems: "center", width: 48, height: 48, borderRadius: 16, background: "#fffaf4", color: "#8b5426", boxShadow: "0 14px 30px rgba(58, 36, 21, 0.18)" }}><MapPin size={24} /></span>
            <span style={{ padding: "6px 10px", borderRadius: 999, background: "rgba(255, 250, 244, 0.9)", fontSize: 12 }}>Destination</span>
          </div>

          <div style={{ position: "relative", zIndex: 1, display: "flex", justifyContent: "space-between", gap: 16, alignItems: "flex-start", padding: 22, flexWrap: "wrap" }}>
            <div style={{ maxWidth: 430 }}>
              <span className={`db-badge ${statusToClassName(trackingStatus)}`}>{trackingMeta.statusLabel}</span>
              <h3 style={{ margin: "12px 0 8px", color: "#24150c", fontSize: 30, lineHeight: 1.1 }}>{orderTitle}</h3>
              <p style={{ margin: 0, color: "#6f5946", fontWeight: 700 }}>{orderAddress}</p>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(125px, 1fr))", gap: 10, minWidth: 280, maxWidth: 560, flex: "1 1 320px" }}>
              {[
                ["Current Time", formatDateTime(trackingNow)],
                ["Last Updated", formatDateTime(trackingMeta.lastUpdated)],
                ["Estimated Delivery", trackingMeta.etaLabel],
                ["Order Placed", formatDateTime(placedAt)],
              ].map(([label, value]) => (
                <article key={label} style={{ padding: 12, borderRadius: 14, background: "rgba(255, 250, 244, 0.86)", border: "1px solid rgba(144, 92, 42, 0.14)" }}>
                  <span style={{ display: "block", color: "#8a6a47", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                  <strong style={{ display: "block", marginTop: 5, color: "#2f1c10", fontSize: 13 }}>{value}</strong>
                </article>
              ))}
            </div>
          </div>
        </section>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
          <article className="db-card" style={{ padding: 20 }}>
            <div className="db-section-head" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22 }}>Delivery Partner</h2>
                <p className="db-muted-text mb-0">Assigned partner details for this order.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", marginBottom: 18 }}>
              <div style={{ width: 66, height: 66, borderRadius: "50%", overflow: "hidden", display: "grid", placeItems: "center", background: "linear-gradient(145deg, #3a2415, #9b642d)", color: "#fffaf4", fontWeight: 900, fontSize: 20 }}>
                {deliveryPartner.image ? <img src={deliveryPartner.image} alt={deliveryPartner.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} /> : deliveryPartner.initials}
              </div>
              <div>
                <h3 style={{ margin: 0, color: "#2b1a10" }}>{deliveryPartner.name}</h3>
                <p style={{ margin: "5px 0 0", color: "#756452", display: "flex", gap: 7, alignItems: "center" }}><Phone size={14} /> {deliveryPartner.phone}</p>
              </div>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(130px, 1fr))", gap: 10 }}>
              {[["Vehicle", deliveryPartner.vehicleType], ["Number", deliveryPartner.vehicleNumber], ["Status", trackingMeta.statusLabel], ["ETA", trackingMeta.etaLabel]].map(([label, value]) => (
                <div key={label} style={{ padding: 12, borderRadius: 14, background: "#fff7ef", border: "1px solid rgba(178, 132, 78, 0.18)" }}>
                  <span style={{ display: "block", color: "#8a6a47", fontSize: 11, fontWeight: 900, textTransform: "uppercase" }}>{label}</span>
                  <strong style={{ display: "block", marginTop: 5, color: "#2f1c10", fontSize: 14 }}>{value}</strong>
                </div>
              ))}
            </div>
          </article>

          <article className="db-card" style={{ padding: 20 }}>
            <div className="db-section-head" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22 }}>Order Summary</h2>
                <p className="db-muted-text mb-0">Order #{selectedTrackingOrder.orderId || selectedTrackingOrder.id}</p>
              </div>
              <span className={`db-badge ${statusToClassName(trackingStatus)}`}>{getStatusDisplayLabel(trackingStatus)}</span>
            </div>
            <div style={{ display: "flex", gap: 14, alignItems: "center", flexWrap: "wrap" }}>
              <div style={{ width: 100, height: 86, borderRadius: 16, overflow: "hidden", background: "#ead8c5" }}>
                {selectedTrackingOrder.foodImage ? <img src={selectedTrackingOrder.foodImage} alt={orderTitle} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} /> : <div style={{ height: "100%", display: "grid", placeItems: "center", color: "#70421d", fontWeight: 900 }}>VR</div>}
              </div>
              <div style={{ flex: "1 1 220px" }}>
                <h3 style={{ margin: 0, color: "#2b1a10" }}>{orderTitle}</h3>
                <p style={{ margin: "7px 0 0", color: "#756452" }}>Qty {selectedTrackingOrder.quantity || 1} | {getOrderCategory(selectedTrackingOrder)}</p>
                <p style={{ margin: "7px 0 0", color: "#756452" }}>{orderAddress}</p>
              </div>
              <strong style={{ color: "#2b1a10", fontSize: 22 }}>{formatCurrency(orderAmount)}</strong>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(135px, 1fr))", gap: 10, marginTop: 16 }}>
              <div style={{ padding: 12, borderRadius: 14, background: "#fff7ef" }}><span style={{ color: "#8a6a47", fontSize: 12, fontWeight: 900 }}>Payment</span><br /><strong>{selectedTrackingOrder.paymentStatus || "Paid"}</strong></div>
              <div style={{ padding: 12, borderRadius: 14, background: "#fff7ef" }}><span style={{ color: "#8a6a47", fontSize: 12, fontWeight: 900 }}>Distance</span><br /><strong>{trackingMeta.distanceLabel}</strong></div>
            </div>
          </article>
        </div>

        <section className="db-card" style={{ padding: 22 }}>
          <div className="db-section-head" style={{ marginBottom: 18 }}>
            <div>
              <h2 style={{ fontSize: 22 }}>Live Order Timeline</h2>
              <p className="db-muted-text mb-0">Progress follows admin status updates only.</p>
            </div>
          </div>
          <div style={{ position: "relative", display: "grid", gap: 0 }}>
            <div style={{ position: "absolute", left: 19, top: 18, bottom: 18, width: 3, borderRadius: 99, background: "#ead8c5" }} />
            <div style={{ position: "absolute", left: 19, top: 18, width: 3, height: `calc(${Math.min(100, (trackingMeta.stage / 3) * 100)}% - 18px)`, borderRadius: 99, background: "linear-gradient(180deg, #70421d, #c99554)" }} />
            {timeline.map((item, index) => {
              const Icon = item.icon;
              const done = trackingMeta.stage >= index;
              const active = trackingMeta.stage === index;
              return (
                <article key={item.title} style={{ position: "relative", display: "grid", gridTemplateColumns: "42px 1fr", gap: 14, padding: "0 0 22px" }}>
                  <span style={{ position: "relative", zIndex: 1, display: "grid", placeItems: "center", width: 40, height: 40, borderRadius: "50%", color: done ? "#fffaf4" : "#9a7d62", background: done ? "linear-gradient(145deg, #70421d, #c99554)" : "#fff7ef", border: active ? "3px solid #f2d1a9" : "1px solid rgba(178, 132, 78, 0.2)", boxShadow: active ? "0 0 0 6px rgba(201, 149, 84, 0.12)" : "none" }}>
                    <Icon size={17} />
                  </span>
                  <div style={{ padding: 14, borderRadius: 16, background: done ? "#fff7ef" : "#fffaf5", border: "1px solid rgba(178, 132, 78, 0.16)" }}>
                    <h4 style={{ margin: 0, color: "#2b1a10" }}>{item.title}</h4>
                    <p style={{ margin: "5px 0", color: "#756452" }}>{done ? item.copy : item.pendingCopy}</p>
                    <small style={{ color: done ? "#70421d" : "#9a8978", fontWeight: 800 }}>{done ? item.meta : "Pending"}</small>
                  </div>
                </article>
              );
            })}
          </div>
        </section>
      </section>
    );
  };

  // Helper to get reservation status based on date/time
  function getReservationStatus(reservation) {
    // Use backend status if present
    if (reservation.status) {
      return String(reservation.status).charAt(0).toUpperCase() + String(reservation.status).slice(1).toLowerCase();
    }
    // Fallback: infer from date
    const now = new Date();
    const resDate = new Date(`${reservation.date || ''}T${reservation.time || '00:00'}`);
    if (!Number.isNaN(resDate.getTime()) && resDate < now) {
      return "Completed";
    }
    return "Pending";
  }

  // Sort reservations by booking creation time first, then reservation date.
  const sortedReservations = [...reservations].sort((a, b) => {
    const aCreated = new Date(a.createdAt || 0);
    const bCreated = new Date(b.createdAt || 0);
    if (!Number.isNaN(aCreated.getTime()) && !Number.isNaN(bCreated.getTime()) && aCreated.getTime() !== bCreated.getTime()) {
      return bCreated - aCreated;
    }
    const aDate = new Date(`${a.date || ''}T${a.time || '00:00'}`);
    const bDate = new Date(`${b.date || ''}T${b.time || '00:00'}`);
    return bDate - aDate;
  });

  const renderUserContent = () => {
    if (isLoading) {
      return <section className="db-card">Loading your dashboard...</section>;
    }

    if (error) {
      return (
        <section className="db-card">
          <p className="db-error-text">{error}</p>
        </section>
      );
    }

    if (activeItem === "dashboard") {
      return (
        <>
          <section className="db-stats-grid">
            {stats.map((stat) => (
              <StatsCard key={stat.label} icon={stat.icon} label={stat.label} value={stat.value} tone={stat.tone} />
            ))}
          </section>

          <section className="db-card">
            <div className="db-section-head">
              <h2>Account Snapshot</h2>
            </div>
            <div className="db-settings-grid">
              <article>
                <h4>Order Progress</h4>
                <p>
                  Placed: {orderSummary.placed} | Confirmed: {orderSummary.confirmed} | Delivered: {orderSummary.delivered}
                </p>
              </article>
              <article>
                <h4>Spending Insights</h4>
                <p>
                  Avg order value: {formatCurrency(orderSummary.avgOrderValue)} | Items ordered: {orderSummary.totalItems}
                </p>
              </article>
              <article>
                <h4>Reservation Status</h4>
                <p>
                  Pending: {reservationSummary.pending} | Confirmed: {reservationSummary.confirmed} | Completed: {reservationSummary.completed}
                </p>
              </article>
              <article>
                <h4>Upcoming Reservation</h4>
                <p>{reservationSummary.upcoming ? reservationSummary.upcoming.label : "No upcoming reservations."}</p>
              </article>
              <article>
                <h4>Last Delivered Item</h4>
                <p>
                  {latestOrder
                    ? `${latestOrder.foodName || latestOrder.foodItem} (${normalizeOrderStatus(latestOrder.orderStatus || latestOrder.status)})`
                    : "No delivered orders yet."}
                </p>
              </article>
              <article>
                <h4>Most Ordered Dish</h4>
                <p>{topOrder ? `${topOrder.name} (${topOrder.count} items)` : "No top dish yet."}</p>
              </article>
            </div>
          </section>

          {/* Latest Orders section removed as requested */}
        </>
      );
    }

    if (activeItem === "orders") {
      return (
        <section style={{ display: "grid", gap: 22 }}>
          <div className="db-section-head" style={{ marginBottom: 0 }}>
            <div>
              <h2>My Orders</h2>
              <p className="db-muted-text mb-0">A polished view of your dining history, spend, and live order actions.</p>
            </div>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(170px, 1fr))", gap: 14 }}>
            <PremiumMetricCard label="Total Orders" value={orders.length} detail="All VR BITES orders" />
            <PremiumMetricCard label="Completed Orders" value={orderInsights.completedOrders} detail="Delivered successfully" />
            <PremiumMetricCard label="Total Spent" value={formatCurrency(orderInsights.totalSpent)} detail={`Avg ${formatCurrency(orderSummary.avgOrderValue)}`} />
            <PremiumMetricCard label="Favorite Category" value={orderInsights.favoriteCategory} detail="Based on ordered quantity" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: 16 }}>
            <PremiumBarChart title="Monthly Orders" subtitle="Order count across the last six months" data={orderInsights.monthlyOrders} />
            <PremiumLineChart title="Spending Trend" subtitle="Your dining spend across the last six months" data={orderInsights.spendingTrend} />
          </div>

          <section className="db-card db-table-card" style={{ padding: 18 }}>
            <div className="db-section-head" style={{ marginBottom: 16 }}>
              <div>
                <h2 style={{ fontSize: 22 }}>Order History</h2>
                <p className="db-muted-text mb-0">Compact order cards with tracking, reorder, cancellation, and receipt actions.</p>
              </div>
            </div>
            {renderOrderCards(orders)}
          </section>

          {selectedOrderDetails ? (
            <div
              role="dialog"
              aria-modal="true"
              aria-label="Order details"
              onClick={() => setSelectedOrderDetails(null)}
              style={{
                position: "fixed",
                inset: 0,
                zIndex: 1000,
                display: "grid",
                placeItems: "center",
                padding: 18,
                background: "rgba(32, 20, 12, 0.42)",
                backdropFilter: "blur(4px)",
              }}
            >
              <article
                onClick={(event) => event.stopPropagation()}
                style={{
                  width: "min(560px, 100%)",
                  borderRadius: 22,
                  border: "1px solid rgba(193, 145, 88, 0.28)",
                  background: "#fffaf5",
                  boxShadow: "0 26px 70px rgba(35, 22, 12, 0.28)",
                  overflow: "hidden",
                }}
              >
                <div style={{ height: 170, background: "#ead8c5" }}>
                  {selectedOrderDetails.foodImage ? (
                    <img src={selectedOrderDetails.foodImage} alt={getOrderTitle(selectedOrderDetails)} style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }} />
                  ) : (
                    <div style={{ display: "grid", placeItems: "center", height: "100%", color: "#70421d", fontWeight: 900 }}>VR BITES</div>
                  )}
                </div>
                <div style={{ padding: 22 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", gap: 14, alignItems: "flex-start" }}>
                    <div>
                      <h3 style={{ margin: 0, color: "#2b1a10", fontSize: 24 }}>{getOrderTitle(selectedOrderDetails)}</h3>
                      <p style={{ margin: "8px 0 0", color: "#756452" }}>Order #{selectedOrderDetails.orderId || selectedOrderDetails.id}</p>
                    </div>
                    <span className={`db-badge ${statusToClassName(normalizeOrderStatus(selectedOrderDetails.orderStatus || selectedOrderDetails.status))}`}>
                      {getStatusDisplayLabel(selectedOrderDetails.orderStatus || selectedOrderDetails.status)}
                    </span>
                  </div>

                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 12, marginTop: 20 }}>
                    <p style={{ margin: 0 }}><strong>Date</strong><br />{formatOrderDate(selectedOrderDetails.createdAt || selectedOrderDetails.placedAt)}</p>
                    <p style={{ margin: 0 }}><strong>Quantity</strong><br />{selectedOrderDetails.quantity || 1}</p>
                    <p style={{ margin: 0 }}><strong>Total</strong><br />{formatCurrency(getOrderAmount(selectedOrderDetails))}</p>
                    <p style={{ margin: 0 }}><strong>Category</strong><br />{getOrderCategory(selectedOrderDetails)}</p>
                  </div>

                  <div style={{ display: "flex", flexWrap: "wrap", gap: 10, marginTop: 22, justifyContent: "flex-end" }}>
                    <button type="button" style={{ ...orderActionButtonStyle, background: "#3a2415", color: "#fffaf5" }} onClick={() => setSelectedOrderDetails(null)}>
                      Close
                    </button>
                  </div>
                </div>
              </article>
            </div>
          ) : null}
        </section>
      );
    }

    if (activeItem === "tracking") {
      return renderPremiumTrackingContent();
    }

    if (activeItem === "reservations") {
      return (
        <section className="db-card db-table-card">
          <div className="db-section-head">
            <h2>My Reservations</h2>
          </div>
          <div className="db-table-wrap db-user-reservations-table">
            <table className="db-table" style={{ tableLayout: "fixed", width: "100%" }}>
              <colgroup>
                <col style={{ width: 110 }} />
                <col style={{ width: 64 }} />
                <col style={{ width: 110 }} />
                <col style={{ width: 86 }} />
                <col style={{ width: 64 }} />
                <col style={{ width: 96 }} />
                <col style={{ width: 100 }} />
              </colgroup>
              <thead>
                <tr>
                  <th style={{ whiteSpace: "nowrap" }}>Booking ID</th>
                  <th>Table</th>
                  <th>Date</th>
                  <th>Time</th>
                  <th>Guests</th>
                  <th>Deposit</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                {sortedReservations.length ? (
                  sortedReservations.map((reservation) => (
                    <tr key={reservation.id}>
                      <td style={{ verticalAlign: "middle", whiteSpace: "normal" }}>
                        <div style={{
                          display: "inline-flex",
                          flexDirection: "column",
                          alignItems: "center",
                          justifyContent: "center",
                          gap: 1,
                          padding: "4px 8px",
                          borderRadius: 8,
                          background: "#fff7ee",
                          border: "1px solid rgba(193, 148, 92, 0.22)",
                          width: "100%",
                          maxWidth: "100%",
                          minWidth: 0,
                        }}>
                          <span style={{ fontSize: 12, fontWeight: 800, color: "#2b1a10", lineHeight: 1.35, whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word", textAlign: "center" }}>
                            {reservation.reservationId || reservation.id}
                          </span>
                        </div>
                      </td>
                      <td>{reservation.tableNumber || "-"}</td>
                      <td>{reservation.date}</td>
                      <td>{reservation.time}</td>
                      <td>{reservation.guests || "-"}</td>
                      <td>
                        {reservation.depositAmount > 0
                          ? <span className="db-badge confirmed">{formatCurrency(reservation.depositAmount)}</span>
                          : <span className="db-badge db-badge-muted">—</span>}
                      </td>
                      <td>
                        <span className={`db-badge ${statusToClassName(getReservationStatus(reservation))}`}>
                          {getReservationStatus(reservation)}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={7} style={{ padding: 0, border: "none", height: 0 }} />
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {!sortedReservations.length && (
            <div style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              gap: 14,
              padding: "52px 32px",
              textAlign: "center",
              boxSizing: "border-box",
              width: "100%",
            }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: 20,
                background: "linear-gradient(145deg, #f8ead8, #ead6bd)",
                border: "1px solid rgba(193, 148, 92, 0.22)",
                display: "grid",
                placeItems: "center",
                color: "#9b642d",
                boxShadow: "0 10px 24px rgba(155, 100, 45, 0.14)",
                flexShrink: 0,
              }}>
                <CalendarCheck2 size={32} />
              </div>
              <h3 style={{ margin: 0, fontSize: 18, fontWeight: 800, color: "#1e1208" }}>No Reservations Yet</h3>
              <p style={{
                margin: 0,
                width: "100%",
                maxWidth: 360,
                color: "#7b6050",
                fontSize: 14,
                lineHeight: 1.65,
                wordBreak: "break-word",
                overflowWrap: "break-word",
                padding: "0 8px",
                boxSizing: "border-box",
              }}>
                Reserve your first table to view booking details here.
              </p>
            </div>
          )}

          <div className="db-user-reservation-cards">
            {sortedReservations.length ? (
              sortedReservations.map((reservation) => (
                <article key={reservation.id} className="db-mobile-order-card">
                  <p className="db-reservation-id-row" style={{ display: "grid", gap: 4, width: "100%" }}>
                    <strong style={{ display: "block", minWidth: 0, width: "100%", whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.2 }}>Booking ID:</strong>
                    <span style={{ display: "block", minWidth: 0, width: "100%", whiteSpace: "normal", overflowWrap: "anywhere", wordBreak: "break-word", lineHeight: 1.35 }}>{reservation.reservationId || reservation.id}</span>
                  </p>
                  <p><strong>Table:</strong> {reservation.tableNumber || "-"}</p>
                  <p><strong>Date:</strong> {reservation.date}</p>
                  <p><strong>Time:</strong> {reservation.time}</p>
                  <p><strong>Guests:</strong> {reservation.guests || "-"}</p>
                  <p><strong>Deposit:</strong>{" "}
                    {reservation.depositAmount > 0
                      ? <span className="db-badge confirmed">{formatCurrency(reservation.depositAmount)}</span>
                      : <span>—</span>}
                  </p>
                  <p>
                    <strong>Status:</strong>{" "}
                    <span className={`db-badge ${statusToClassName(getReservationStatus(reservation))}`}>
                      {getReservationStatus(reservation)}
                    </span>
                  </p>
                </article>
              ))
            ) : (
              <div style={{
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 14,
                padding: "40px 32px",
                textAlign: "center",
                borderRadius: 16,
                border: "2px dashed rgba(193, 148, 92, 0.26)",
                background: "linear-gradient(145deg, #fffdf9, #fff8ee)",
                boxSizing: "border-box",
                width: "100%",
              }}>
                <div style={{
                  width: 64,
                  height: 64,
                  borderRadius: 18,
                  background: "linear-gradient(145deg, #f8ead8, #ead6bd)",
                  border: "1px solid rgba(193, 148, 92, 0.22)",
                  display: "grid",
                  placeItems: "center",
                  color: "#9b642d",
                  boxShadow: "0 10px 24px rgba(155, 100, 45, 0.14)",
                  flexShrink: 0,
                }}>
                  <CalendarCheck2 size={28} />
                </div>
                <h3 style={{ margin: 0, fontSize: 17, fontWeight: 800, color: "#1e1208" }}>No Reservations Yet</h3>
                <p style={{
                  margin: 0,
                  width: "100%",
                  maxWidth: 300,
                  color: "#7b6050",
                  fontSize: 13.5,
                  lineHeight: 1.65,
                  wordBreak: "break-word",
                  overflowWrap: "break-word",
                  boxSizing: "border-box",
                }}>
                  Reserve your first table to view booking details here.
                </p>
              </div>
            )}
          </div>
        </section>
      );
    }

    if (activeItem === "profile") {
      return (
        <section className="db-card">
          <div className="db-section-head">
            <h2>Profile</h2>
          </div>
          <div className="db-settings-grid">
            <article>
              <h4>Name</h4>
              <p>{user?.fullName || user?.username || "Guest"}</p>
            </article>
            <article>
              <h4>Email</h4>
              <p>{email || "Not available"}</p>
            </article>
            <article>
              <h4>Orders</h4>
              <p>{orders.length}</p>
            </article>
            <article>
              <h4>Reservations</h4>
              <p>{reservations.length}</p>
            </article>
          </div>
        </section>
      );
    }

    if (activeItem === "settings") {
      return (
        <section className="db-card">
          <div className="db-section-head">
            <h2>Settings</h2>
          </div>
          <div className="db-settings-grid">
            <article>
              <h4>Account</h4>
              <p>{email || "Signed in customer"}</p>
            </article>
            <article>
              <h4>Dashboard</h4>
              <p>Your orders and reservations remain private to your account.</p>
            </article>
          </div>
        </section>
      );
    }

    return (
      <section className="db-card">
        <div className="db-section-head">
          <h2>Customer Insights</h2>
        </div>
        <p className="db-muted-text">Quick intelligence based on your latest food orders and reservation activity.</p>
        <div className="db-settings-grid">
          <article>
            <h4>Favorite Order</h4>
            <p>{topOrder ? `${topOrder.name} (${topOrder.count} items ordered)` : "No orders yet."}</p>
          </article>
          <article>
            <h4>Latest Delivery</h4>
            <p>
              {latestOrder
                ? `${latestOrder.foodName || latestOrder.foodItem} - ${latestOrder.orderStatus || latestOrder.status}`
                : "No deliveries tracked yet."}
            </p>
          </article>
          <article>
            <h4>Upcoming Reservation</h4>
            <p>
              {latestReservation
                ? `${latestReservation.date} at ${latestReservation.time}`
                : "No reservation scheduled."}
            </p>
          </article>
        </div>
      </section>
    );
  };

  if (detailOrderAccessDenied || detailReservationAccessDenied) {
    return <AccessDeniedMessage />;
  }

  return (
    <div className="db-layout">
      <Sidebar
        menuItems={menuItems}
        activeItem={activeItem}
        onSelect={handleSetActiveItem}
        isOpen={isSidebarOpen}
        onClose={() => setSidebarOpen(false)}
        role="USER"
      />

      <div className="db-main">
        <DashboardNavbar
          title="User Dashboard"
          user={user}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          showUserChip={false}
        />

        <main className="db-content">{renderUserContent()}</main>
      </div>
    </div>
  );
}

export default UserDashboard;
