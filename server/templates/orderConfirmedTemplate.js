const layout = require('./layout');
const { hero, statusCard, detailCard, button, money } = require('./layouts/premiumEmail');

module.exports = (data = {}) => layout('Order Confirmed', `
  ${hero({ eyebrow: 'Chef Confirmed', title: 'Order Confirmed', message: `Hi ${data.customerName || 'Guest'}, our kitchen has confirmed your VR BITES order.`, tone: 'green' })}
  ${statusCard({ label: 'Order Status', value: 'Confirmed', tone: 'green', rightLabel: 'Order ID', rightValue: `#${data.orderId || 'N/A'}` })}
  ${detailCard('Order Details', [
    ['Item', data.items?.[0]?.name || 'Your selected item'],
    ['Quantity', data.items?.[0]?.qty || '1'],
    ['Total Paid', money(data.total)],
    ['Currency', 'USD'],
  ])}
  ${button('Track Your Order', data.orderLink || '#', 'green')}
`);
