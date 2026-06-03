const layout = require('./layout');
const { hero, statusCard, detailCard, button, contactCard, money } = require('./layouts/premiumEmail');

const appUrl = process.env.CLIENT_URL || process.env.FRONTEND_URL || 'https://vrbites.com';

const config = {
  PENDING: {
    title: 'Reservation Request Received',
    message: 'Thank you for choosing VR BITES. We have successfully received your reservation request and payment. Your reservation is currently under review — you will receive another email once our team confirms your table.',
    tone: 'amber',
  },
  CONFIRMED: {
    title: 'Reservation Confirmed',
    message: 'Your reservation has been confirmed by VR BITES. We look forward to welcoming you.',
    tone: 'green',
  },
  CANCELLED: {
    title: 'Reservation Cancelled',
    message: 'This reservation has been cancelled. Contact us if you need help booking another table.',
    tone: 'red',
  },
  DECLINED: {
    title: 'Reservation Cancelled',
    message: 'We are unable to accommodate this request for the selected slot. Our team can help you choose another time.',
    tone: 'red',
  },
  COMPLETED: {
    title: 'Dining Experience Completed',
    message: 'Thank you for dining with VR BITES. We hope to host you again soon.',
    tone: 'blue',
  },
};

module.exports = (data = {}) => {
  const status = String(data.reservationStatus || data.status || 'PENDING').toUpperCase();
  const cfg = config[status] || config.PENDING;
  const reservationId = data.reservationId ? `Reservation #${data.reservationId}` : 'Reservation pending';
  const reservationDetailId = data._id?.toString?.() || data.id || '';
  const reservationLink = reservationDetailId ? `${appUrl}/reservation/${reservationDetailId}` : `${appUrl}/my-reservations`;

  return layout(cfg.title, `
    ${hero({
      eyebrow: 'Fine Dining Experience',
      title: 'VR BITES',
      message: cfg.message,
      tone: cfg.tone,
    })}
    ${statusCard({
      label: 'Reservation Status',
      value: cfg.title,
      tone: cfg.tone,
      rightLabel: 'Reservation ID',
      rightValue: reservationId,
    })}
    ${detailCard('Reservation Details', [
      ['Guest Name', data.customerName],
      ['Date', data.date],
      ['Time', data.time],
      ['Guests', data.guests ? `${data.guests} guest${Number(data.guests) === 1 ? '' : 's'}` : 'Not provided'],
      ['Table', data.tableNumber ? `Table ${data.tableNumber}` : 'Not assigned'],
      ['Deposit Paid', money(data.depositAmount)],
      ['Payment Status', data.paymentStatus || (data.depositPaid ? 'Paid' : 'Pending')],
      ['Reservation ID', reservationId],
    ])}
    ${data.paymentIntentId ? detailCard('Payment Reference', [
      ['Stripe Payment ID', data.paymentIntentId],
      ['Currency', 'USD'],
    ]) : ''}
    ${button(status === 'DECLINED' || status === 'CANCELLED' ? 'Book Another Table' : 'View Reservation', status === 'DECLINED' || status === 'CANCELLED' ? `${appUrl}/book-table` : reservationLink, cfg.tone)}
    ${contactCard()}
  `);
};
