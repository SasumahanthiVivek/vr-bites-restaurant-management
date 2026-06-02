const layout = require('./layout');
const { hero, statusCard, detailCard, button, money } = require('./layouts/premiumEmail');

module.exports = (data = {}) => layout('Order Placed', `
  ${hero({ eyebrow: 'Order Received', title: 'VR BITES', message: `Hi ${data.customerName || 'Guest'}, your order has been received successfully.`, tone: 'amber' })}
  ${statusCard({ label: 'Order Status', value: 'Order Placed', tone: 'amber', rightLabel: 'Order ID', rightValue: `#${data.orderId || 'N/A'}` })}
  ${detailCard('Order Summary', [
    ['Item', data.items?.[0]?.name || 'Your selected item'],
    ['Quantity', data.items?.[0]?.qty || '1'],
    ['Total Paid', money(data.total)],
    ['Currency', 'USD'],
  ])}
  ${button('Track Your Order', data.orderLink || '#', 'gold')}
`);
