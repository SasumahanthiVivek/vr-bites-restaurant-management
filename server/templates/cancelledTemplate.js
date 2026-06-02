const layout = require('./layout');
const { hero, statusCard, detailCard, button, money } = require('./layouts/premiumEmail');

module.exports = (data = {}) => layout('Order Cancelled', `
  ${hero({ eyebrow: 'Order Update', title: 'Order Cancelled', message: `Hi ${data.customerName || 'Guest'}, your order has been cancelled.`, tone: 'red' })}
  ${statusCard({ label: 'Order Status', value: 'Cancelled', tone: 'red', rightLabel: 'Order ID', rightValue: `#${data.orderId || 'N/A'}` })}
  ${detailCard('Refund Information', [
    ['Paid Amount', money(data.total)],
    ['Currency', 'USD'],
    ['Refund Window', '3-5 business days when applicable'],
  ])}
  ${button('Contact Support', 'mailto:support@vrbites.com', 'red')}
`);
