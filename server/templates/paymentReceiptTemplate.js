const layout = require('./layout');
const { itemRows, escapeHtml } = require('./layouts/orderHelpers');

const money = (value = 0) =>
  `$${Number(value || 0).toFixed(2)}`;

module.exports = (data = {}) => {
  const isReservation = data.receiptType === 'reservation' || Boolean(data.reservationId);
  const receiptId = isReservation ? data.reservationId : data.orderId;
  const title = isReservation ? 'Reservation Payment Receipt' : 'Payment Receipt';
  const intro = isReservation
    ? `Hi ${escapeHtml(data.customerName)}, your VR BITES reservation deposit has been received.`
    : `Hi ${escapeHtml(data.customerName)}, thank you for your payment. Here is your official receipt for order #${escapeHtml(receiptId)}.`;

  const details = isReservation ? `
    <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;font-size:14px;">Reservation ID</td><td style="padding:10px 0;color:#111827;font-weight:800;text-align:right;border-bottom:1px solid #f3f4f6;font-size:14px;">#${escapeHtml(receiptId)}</td></tr>
    <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;font-size:14px;">Customer</td><td style="padding:10px 0;color:#111827;font-weight:800;text-align:right;border-bottom:1px solid #f3f4f6;font-size:14px;">${escapeHtml(data.customerName)}</td></tr>
    <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;font-size:14px;">Date & Time</td><td style="padding:10px 0;color:#111827;font-weight:800;text-align:right;border-bottom:1px solid #f3f4f6;font-size:14px;">${escapeHtml(data.date || 'N/A')} at ${escapeHtml(data.time || 'N/A')}</td></tr>
    <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;font-size:14px;">Table</td><td style="padding:10px 0;color:#111827;font-weight:800;text-align:right;border-bottom:1px solid #f3f4f6;font-size:14px;">${data.tableNumber ? `Table ${escapeHtml(data.tableNumber)}` : 'N/A'}</td></tr>
    <tr><td style="padding:10px 0;color:#6b7280;border-bottom:1px solid #f3f4f6;font-size:14px;">Guests</td><td style="padding:10px 0;color:#111827;font-weight:800;text-align:right;border-bottom:1px solid #f3f4f6;font-size:14px;">${escapeHtml(String(data.guests || 'N/A'))}</td></tr>
    <tr><td style="padding:10px 0;color:#6b7280;font-size:14px;">Deposit Amount</td><td style="padding:10px 0;color:#4338ca;font-weight:900;text-align:right;font-size:16px;">${money(data.depositAmount || data.total)}</td></tr>
  ` : `
    <tr><td style="background:#f9fafb;padding:12px 18px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#111827;">Items Ordered</td></tr>
    <tr><td style="padding:4px 18px 4px;">
      <table width="100%" cellpadding="0" cellspacing="0">
        <tr style="border-bottom:1px solid #f3f4f6;"><td style="padding:8px 0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;">Item</td><td style="padding:8px 0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;text-align:center;">Qty</td><td style="padding:8px 0;font-size:12px;font-weight:700;color:#6b7280;text-transform:uppercase;text-align:right;">Price</td></tr>
        ${itemRows(data.items)}
      </table>
    </td></tr>
  `;

  return layout('VR BITES Payment Receipt', `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1f1309 0%,#8b5b18 100%);border-radius:16px;margin-bottom:24px;">
      <tr><td style="padding:28px 26px;">
        <div style="display:inline-block;padding:5px 14px;border-radius:999px;background:rgba(255,255,255,0.18);border:1px solid rgba(255,255,255,0.28);font-size:11px;font-weight:700;letter-spacing:0.1em;text-transform:uppercase;color:#ffffff;margin-bottom:12px;">Payment Successful</div>
        <div style="font-size:22px;font-weight:800;color:#ffffff;line-height:1.3;margin-bottom:8px;">${title}</div>
        <div style="font-size:14px;color:rgba(255,255,255,0.88);">${intro}</div>
      </td></tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="background:#fff8e7;border:1px solid #ead6a3;border-radius:14px;padding:16px 18px;margin-bottom:20px;">
      <tr>
        <td style="vertical-align:top;">
          <div style="font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Receipt No.</div>
          <div style="font-size:16px;font-weight:800;color:#7a4b00;">#${escapeHtml(receiptId || 'N/A')}</div>
        </td>
        <td style="vertical-align:top;text-align:right;">
          <div style="font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Date</div>
          <div style="font-size:14px;font-weight:700;color:#111827;">${escapeHtml(data.orderDate || new Date().toLocaleDateString('en-US'))}</div>
        </td>
      </tr>
      <tr>
        <td style="padding-top:10px;vertical-align:top;">
          <div style="font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Payment ID</div>
          <div style="font-size:12px;font-weight:600;color:#374151;word-break:break-all;">${escapeHtml(data.paymentId || 'N/A')}</div>
        </td>
        <td style="padding-top:10px;vertical-align:top;text-align:right;">
          <div style="font-size:11px;color:#6b7280;font-weight:700;text-transform:uppercase;margin-bottom:3px;">Payment Status</div>
          <div style="display:inline-block;padding:5px 12px;border-radius:999px;background:#ffffff;border:1px solid #a7f3d0;color:#047857;font-size:12px;font-weight:800;">${escapeHtml(data.paymentStatus || 'Paid')}</div>
        </td>
      </tr>
    </table>

    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:16px;overflow:hidden;margin-bottom:20px;">
      ${details}
      <tr><td style="padding:0 18px 16px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-top:1px solid #e5e7eb;padding-top:12px;margin-top:4px;">
          <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Subtotal</td><td style="padding:4px 0;text-align:right;font-size:13px;color:#374151;">${money(data.subtotal || data.depositAmount)}</td></tr>
          <tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Tax</td><td style="padding:4px 0;text-align:right;font-size:13px;color:#374151;">${money(data.tax)}</td></tr>
          ${isReservation ? '' : `<tr><td style="padding:4px 0;font-size:13px;color:#6b7280;">Delivery Fee</td><td style="padding:4px 0;text-align:right;font-size:13px;color:#374151;">${money(data.deliveryFee)}</td></tr>`}
          <tr><td style="padding:10px 0 0;font-size:15px;font-weight:800;color:#111827;border-top:2px solid #e5e7eb;">Total Paid</td><td style="padding:10px 0 0;text-align:right;font-size:18px;font-weight:900;color:#7a4b00;border-top:2px solid #e5e7eb;">${money(data.total || data.depositAmount)}</td></tr>
        </table>
      </td></tr>
    </table>

    <p style="margin:0 0 16px;font-size:13px;color:#6b7280;text-align:center;">VR BITES Restaurant</p>
  `);
};
