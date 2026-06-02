const layout = require('./layout');
const { hero, statusCard, detailCard, button, money } = require('./layouts/premiumEmail');

module.exports = (data = {}) => layout('Order Preparing', `
  ${hero({ eyebrow: 'Kitchen Update', title: 'Food Preparing', message: `Hi ${data.customerName || 'Guest'}, your meal is being prepared by our kitchen team.`, tone: 'blue' })}
  ${statusCard({ label: 'Order Status', value: 'In Progress', tone: 'blue', rightLabel: 'Order ID', rightValue: `#${data.orderId || 'N/A'}` })}
  ${detailCard('Preparation Details', [
    ['Item', data.items?.[0]?.name || 'Your selected item'],
    ['Quantity', data.items?.[0]?.qty || '1'],
    ['Total Paid', money(data.total)],
    ['Estimated Delivery', '30-45 min'],
  ])}
  ${button('Track Your Order', data.orderLink || '#', 'gold')}
`);
