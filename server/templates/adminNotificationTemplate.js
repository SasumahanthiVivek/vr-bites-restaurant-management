const layout = require('./layout');
const { hero, statusCard, detailCard, button, money } = require('./layouts/premiumEmail');

const appUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://vrbites.com';

module.exports = (data = {}) => {
  const eventType = data.eventType || 'Admin Notification';
  const isReservation = String(eventType).toLowerCase().includes('reservation');
  const isPayment = String(eventType).toLowerCase().includes('payment');
  const tone = isReservation ? 'green' : isPayment ? 'blue' : 'amber';

  return layout(`Admin Alert - ${eventType}`, `
    ${hero({
      eyebrow: 'Admin Notification',
      title: eventType,
      message: data.message || 'A VR BITES dashboard event needs your attention.',
      tone,
    })}
    ${statusCard({
      label: 'Action',
      value: 'Review in Admin Dashboard',
      tone,
      rightLabel: 'Received',
      rightValue: new Date().toLocaleString('en-US'),
    })}
    ${detailCard('Event Details', [
      ['Customer', data.customerName],
      ['Email', data.email],
      ['Phone', data.phone],
      ['Order ID', data.orderId ? `#${data.orderId}` : ''],
      ['Reservation ID', data.reservationId ? `#${data.reservationId}` : ''],
      ['Date', data.date],
      ['Time', data.time],
      ['Guests', data.guests],
      ['Table', data.tableNumber ? `Table ${data.tableNumber}` : ''],
      ['Deposit', data.depositAmount],
      ['Payment Status', data.paymentStatus],
      ['Amount', data.totalPrice ? money(data.totalPrice) : ''],
    ])}
    ${button('Open Admin Dashboard', `${appUrl}/admin-dashboard`, tone)}
  `);
};
