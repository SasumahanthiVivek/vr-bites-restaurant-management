const escapeHtml = (v = '') => String(v).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;');

function itemRows(items = []) {
  return (items || []).map(item =>
    `<tr><td style="padding:9px 0;border-bottom:1px solid #f3f4f6;font-size:14px;color:#111827;">${escapeHtml(item.name)}</td><td style="padding:9px 0;border-bottom:1px solid #f3f4f6;text-align:center;font-size:14px;color:#374151;">${escapeHtml(String(item.qty))}</td><td style="padding:9px 0;border-bottom:1px solid #f3f4f6;text-align:right;font-size:14px;font-weight:700;color:#111827;">$${escapeHtml(String(item.price))}</td></tr>`
  ).join('');
}

function totalBlock(total) {
  return `<table width="100%" cellpadding="0" cellspacing="0" style="margin-top:8px;">
    <tr><td style="text-align:right;"><span style="font-size:13px;color:#6b7280;">Total Paid:</span>&nbsp;<span style="font-size:18px;font-weight:900;color:#111827;">$${escapeHtml(String(total || 0))}</span></td></tr>
  </table>`;
}

module.exports = { itemRows, totalBlock, escapeHtml };

