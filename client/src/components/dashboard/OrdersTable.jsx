import { useState } from "react";
import toast from "react-hot-toast";

const ORDER_STATUSES = ["PLACED", "CONFIRMED", "IN PROGRESS", "DELIVERED"];

// Utility for formatting price in dollars
function formatCurrency(value) {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 2,
  }).format(Number(value || 0));
}

function OrdersTable({ rows, onStatusChange }) {
  const statusToClassName = (status) => String(status || "preparing").trim().toLowerCase().replace(/\s+/g, "-");
  const [updatingId, setUpdatingId] = useState(null);

  const handleStatusChange = async (order, newStatus) => {
    setUpdatingId(order.id);
    if (onStatusChange) {
      const result = await onStatusChange(order, newStatus);
      // Show toast for email delivery status if available
      if (result && result.emailStatus) {
        if (result.emailStatus === "success") {
          toast.success("Order status email sent successfully.");
        } else if (result.emailStatus === "error") {
          toast.error(result.emailMessage || "Order status email delivery failed.");
        }
      }
    }
    setUpdatingId(null);
  };

  return (
    <section className="db-card db-table-card">
      <div className="db-section-head">
        <h2>Recent Orders</h2>
      </div>
      <div className="db-table-wrap recent-orders-table" style={{overflowX: 'auto', WebkitOverflowScrolling: 'touch'}}>
        <table className="db-table" style={{minWidth: 1000}}>
          <thead>
            <tr>
              <th style={{minWidth: 150, maxWidth: 180, textAlign: 'center'}}>Order ID</th>
              <th style={{minWidth: 150, maxWidth: 180, textAlign: 'center'}}>Customer Name</th>
              <th>Food Item</th>
              <th>Quantity</th>
              <th>Status</th>
              <th>Price</th>
              <th style={{minWidth: 180, textAlign: 'center'}}>Update Status</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((order) => {
              // --- Order ID: split into two balanced lines ---
              let orderId = String(order.id || "");
              let line1 = "", line2 = "";
              if (orderId.length <= 8) {
                line1 = orderId;
                line2 = "";
              } else if (orderId.startsWith("ORD-")) {
                // Example: ORD-177933466613680
                const mid = Math.ceil((orderId.length - 4) / 2) + 4;
                line1 = orderId.slice(0, mid);
                line2 = orderId.slice(mid);
              } else {
                const mid = Math.ceil(orderId.length / 2);
                line1 = orderId.slice(0, mid);
                line2 = orderId.slice(mid);
              }
              // --- Customer Name: always two lines ---
              const nameParts = (order.customer || "").trim().split(/\s+/);
              const firstName = nameParts[0] || "";
              const lastName = nameParts.slice(1).join(" ") || "";
              return (
                <tr key={order.id} style={{verticalAlign: 'middle'}}>
                  <td style={{minWidth: 150, maxWidth: 180, textAlign: 'center', padding: '14px 10px'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.15, fontWeight: 700, fontSize: 15, wordBreak: 'break-word', minHeight: 38}}>
                      <span style={{display: 'block', width: '100%', whiteSpace: 'normal', overflowWrap: 'break-word', letterSpacing: 0.5}}>{line1}</span>
                      <span style={{display: 'block', width: '100%', whiteSpace: 'normal', overflowWrap: 'break-word', letterSpacing: 0.5}}>{line2}</span>
                    </div>
                  </td>
                  <td style={{minWidth: 150, maxWidth: 180, textAlign: 'center', padding: '14px 10px'}}>
                    <div style={{display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', lineHeight: 1.15, fontWeight: 700, fontSize: 15, wordBreak: 'break-word', minHeight: 38}}>
                      <span style={{display: 'block', width: '100%', whiteSpace: 'normal', overflowWrap: 'break-word', letterSpacing: 0.5}}>{firstName}</span>
                      <span style={{display: 'block', width: '100%', whiteSpace: 'normal', overflowWrap: 'break-word', letterSpacing: 0.5}}>{lastName}</span>
                    </div>
                  </td>
                  <td>{order.item}</td>
                  <td>{order.quantity}</td>
                  <td>
                    <span className={`db-badge ${statusToClassName(order.status)}`}>{order.status}</span>
                  </td>
                  <td>{formatCurrency(order.price)}</td>
                  <td style={{minWidth: 180, textAlign: 'center'}}>
                    <select
                      value={order.status}
                      disabled={updatingId === order.id}
                      onChange={(e) => handleStatusChange(order, e.target.value)}
                      style={{padding: '7px 14px', borderRadius: 8, fontWeight: 600, minWidth: 120, maxWidth: 180, textAlign: 'center'}}
                    >
                      {ORDER_STATUSES.map((status) => (
                        <option key={status} value={status}>{status}</option>
                      ))}
                    </select>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="db-mobile-orders">
        {rows.length ? (
          rows.map((order) => (
            <article key={order.id} className="db-mobile-order-card">
              <p><strong>Order ID:</strong> {order.id}</p>
              <p><strong>Customer:</strong> {order.customer}</p>
              <p><strong>Food:</strong> {order.item}</p>
              <p><strong>Quantity:</strong> {order.quantity}</p>
              <p>
                <strong>Status:</strong>{" "}
                <span className={`db-badge ${statusToClassName(order.status)}`}>{order.status}</span>
              </p>
              <p><strong>Price:</strong> {formatCurrency(order.price)}</p>
              <div>
                <select
                  value={order.status}
                  disabled={updatingId === order.id}
                  onChange={(e) => handleStatusChange(order, e.target.value)}
                >
                  {ORDER_STATUSES.map((status) => (
                    <option key={status} value={status}>{status}</option>
                  ))}
                </select>
              </div>
            </article>
          ))
        ) : (
          <p className="db-muted-text mb-0">No recent orders found.</p>
        )}
      </div>
    </section>
  );
}

export default OrdersTable;
