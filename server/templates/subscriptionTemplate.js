const layout = require('./layout');
const { hero, detailCard, button, contactCard, escapeHtml } = require('./layouts/premiumEmail');

module.exports = (data = {}) => layout('Welcome to VR BITES Exclusive Updates', `
  ${hero({
    eyebrow: 'Exclusive Updates',
    title: 'Welcome to VR BITES',
    message: `Hi ${data.customerName || 'Guest'}, you are now subscribed to our private dining updates, seasonal menus, and premium offers.`,
    tone: 'gold',
  })}
  ${detailCard('What You Will Receive', [
    ['Seasonal menus', 'Early access to new chef specials'],
    ['Private offers', 'Exclusive dining promotions in USD'],
    ['Events', 'Invitations to VR BITES experiences'],
    ['Subscribed email', escapeHtml(data.email || 'Your registered email')],
  ])}
  ${button('Explore Menu', 'https://vrbites.com/menu', 'gold')}
  ${contactCard()}
`);
