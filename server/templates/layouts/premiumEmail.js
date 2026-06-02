const escapeHtml = (v = '') =>
  String(v).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;').replace(/'/g, '&#39;');

const money = (value = 0) => `$${Number(value || 0).toFixed(2)} USD`;

function hero({ eyebrow = 'Fine Dining Experience', title = 'VR BITES', message = '', tone = 'gold' } = {}) {
  const tones = {
    gold: ['#1a0a00', '#8b5b18'],
    green: ['#123524', '#0f7a44'],
    amber: ['#281407', '#b97716'],
    red: ['#351010', '#b42323'],
    blue: ['#0d1f3f', '#1d5fbf'],
  };
  const [from, to] = tones[tone] || tones.gold;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:linear-gradient(135deg,${from},${to});border-radius:18px;margin-bottom:22px;">
      <tr><td style="padding:30px 28px;text-align:left;">
        <div style="display:inline-block;padding:5px 12px;border-radius:999px;border:1px solid rgba(244,216,160,0.38);color:#f4d8a0;font-size:10px;font-weight:800;letter-spacing:0.14em;text-transform:uppercase;margin-bottom:12px;">${escapeHtml(eyebrow)}</div>
        <div style="font-size:28px;line-height:1.15;font-weight:900;color:#ffffff;letter-spacing:0.04em;margin-bottom:8px;">${escapeHtml(title)}</div>
        ${message ? `<div style="font-size:14px;line-height:1.65;color:rgba(255,255,255,0.86);">${escapeHtml(message)}</div>` : ''}
      </td></tr>
    </table>`;
}

function statusCard({ label = '', value = '', tone = 'gold', rightLabel = '', rightValue = '' } = {}) {
  const colors = {
    gold: ['#fff8e7', '#ead6a3', '#7a4b00'],
    amber: ['#fff7d6', '#f2d47c', '#856000'],
    green: ['#eaf8ee', '#b9e5c7', '#176436'],
    red: ['#fff0f0', '#f5b5b5', '#9b1c1c'],
    blue: ['#e9f2ff', '#bdd7ff', '#1453a6'],
  };
  const [bg, border, color] = colors[tone] || colors.gold;
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="background:${bg};border:1px solid ${border};border-radius:16px;margin-bottom:20px;">
      <tr>
        <td style="padding:16px 18px;vertical-align:middle;">
          <div style="font-size:10px;color:#6b5a45;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px;">${escapeHtml(label)}</div>
          <div style="display:inline-block;padding:7px 13px;border-radius:999px;background:#ffffff;border:1px solid ${border};color:${color};font-size:12px;font-weight:900;letter-spacing:0.04em;">${escapeHtml(value)}</div>
        </td>
        ${rightLabel ? `<td style="padding:16px 18px;vertical-align:middle;text-align:right;">
          <div style="font-size:10px;color:#6b5a45;font-weight:800;text-transform:uppercase;letter-spacing:0.1em;margin-bottom:5px;">${escapeHtml(rightLabel)}</div>
          <div style="font-size:15px;color:#1f1309;font-weight:900;">${escapeHtml(rightValue)}</div>
        </td>` : ''}
      </tr>
    </table>`;
}

function detailCard(title, rows = []) {
  const body = rows.filter(Boolean).map(([label, value]) => `
    <tr>
      <td style="padding:11px 0;color:#7a6a58;font-size:13px;border-bottom:1px solid #f0e5d5;">${escapeHtml(label)}</td>
      <td style="padding:11px 0;color:#1f1309;font-size:13px;font-weight:800;text-align:right;border-bottom:1px solid #f0e5d5;">${escapeHtml(value || 'Not provided')}</td>
    </tr>`).join('');
  return `
    <table width="100%" cellpadding="0" cellspacing="0" style="border:1px solid #eadfce;border-radius:16px;overflow:hidden;margin-bottom:20px;">
      <tr><td style="background:#fbf6ed;padding:14px 18px;border-bottom:1px solid #eadfce;color:#1f1309;font-size:14px;font-weight:900;">${escapeHtml(title)}</td></tr>
      <tr><td style="padding:2px 18px 12px;">
        <table width="100%" cellpadding="0" cellspacing="0">${body}</table>
      </td></tr>
    </table>`;
}

function button(label, href = '#', tone = 'gold') {
  const bg = tone === 'green' ? 'linear-gradient(135deg,#123524,#0f7a44)' : tone === 'red' ? 'linear-gradient(135deg,#351010,#b42323)' : 'linear-gradient(135deg,#1a0a00,#8b5b18)';
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin:18px 0;"><tr><td align="center"><a href="${escapeHtml(href)}" style="display:inline-block;padding:13px 34px;border-radius:999px;background:${bg};color:#ffffff;text-decoration:none;font-size:14px;font-weight:900;">${escapeHtml(label)}</a></td></tr></table>`;
}

function contactCard() {
  return detailCard('Restaurant Contact', [
    ['Email', 'support@vrbites.com'],
    ['Restaurant', 'VR BITES'],
    ['Experience', 'Fine Dining Experience'],
  ]);
}

module.exports = { escapeHtml, money, hero, statusCard, detailCard, button, contactCard };
