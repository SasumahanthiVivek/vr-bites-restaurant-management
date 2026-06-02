const layout = require('./layout');
const { hero, statusCard, detailCard, button, money } = require('./layouts/premiumEmail');

module.exports = (data = {}) => layout('Order Delivered', `
  ${hero({ eyebrow: 'Delivered', title: 'Enjoy Your Meal', message: `Hi ${data.customerName || 'Guest'}, your VR BITES order has been delivered successfully.`, tone: 'green' })}
  ${statusCard({ label: 'Order Status', value: 'Delivered', tone: 'green', rightLabel: 'Order ID', rightValue: `#${data.orderId || 'N/A'}` })}
  ${detailCard('Delivery Summary', [
    ['Item', data.items?.[0]?.name || 'Your selected item'],
    ['Quantity', data.items?.[0]?.qty || '1'],
    ['Total Paid', money(data.total)],
    ['Currency', 'USD'],
  ])}
  ${button('Order Again', data.orderLink || '#', 'green')}
`);
