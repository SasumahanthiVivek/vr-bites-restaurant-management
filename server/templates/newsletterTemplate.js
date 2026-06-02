const layout = require('./layout');
const escapeHtml = (v = '') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');
module.exports = (data = {}) => layout('VR Bites Newsletter', `
  <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,#1a0a00 0%,#92400e 100%);border-radius:16px;margin-bottom:24px;text-align:center;">
    <tr><td style="padding:28px 26px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#d4a855;margin-bottom:12px;">VR Bites Newsletter</div>
      <div style="font-size:24px;font-weight:800;color:#ffffff;margin-bottom:8px;">${escapeHtml(data.headline || 'Exclusive Offers This Week')}</div>
      <div style="font-size:14px;color:rgba(255,255,255,0.85);">${escapeHtml(data.subheadline || 'Curated dining experiences just for you')}</div>
    </td></tr>
  </table>
  <p style="margin:0 0 20px;font-size:14px;color:#4b5563;line-height:1.65;">Hi <strong>${escapeHtml(data.customerName || 'Foodie')}</strong>, here is what is happening at VR Bites this week.</p>
  ${(data.sections || []).map(section => `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #e5e7eb;border-radius:14px;overflow:hidden;margin-bottom:16px;">
      <tr><td style="background:#f9fafb;padding:12px 18px;border-bottom:1px solid #e5e7eb;font-size:14px;font-weight:700;color:#111827;">${escapeHtml(section.title)}</td></tr>
      <tr><td style="padding:16px 18px;font-size:14px;color:#374151;line-height:1.65;">${section.content}</td></tr>
    </table>`).join('')}
  <table width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:16px;">
    <tr><td align="center"><a href="https://vrbites.com/menu" style="display:inline-block;padding:13px 36px;background:linear-gradient(135deg,#92400e,#d97706);color:#ffffff;text-decoration:none;border-radius:999px;font-size:14px;font-weight:700;">Explore Menu</a></td></tr>
  </table>
  <p style="margin:0;font-size:12px;color:#9ca3af;text-align:center;"><a href="#" style="color:#6b7280;text-decoration:underline;">Unsubscribe</a> from our newsletter</p>
`);
