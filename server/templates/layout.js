module.exports = function layout(title, bodyContent) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body style="margin:0;padding:0;background-color:#f0ebe3;font-family:'Segoe UI',Arial,Helvetica,sans-serif;-webkit-font-smoothing:antialiased;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color:#f0ebe3;padding:32px 16px;">
    <tr>
      <td align="center">
        <table width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:20px;overflow:hidden;box-shadow:0 8px 32px rgba(0,0,0,0.10);">
          <tr>
            <td style="background:linear-gradient(135deg,#1a0a00 0%,#3d1a00 50%,#1a0a00 100%);padding:28px 32px;text-align:center;">
              <div style="display:inline-block;border:1px solid rgba(212,168,88,0.4);border-radius:999px;padding:6px 20px;margin-bottom:14px;">
                <span style="font-size:11px;font-weight:700;letter-spacing:0.15em;text-transform:uppercase;color:#d4a855;">Fine Dining Experience</span>
              </div>
              <div style="font-size:30px;font-weight:900;letter-spacing:0.08em;color:#ffffff;text-transform:uppercase;">VR BITES</div>
              <div style="width:48px;height:2px;background:linear-gradient(90deg,transparent,#d4a855,transparent);margin:10px auto 0;"></div>
            </td>
          </tr>
          <tr>
            <td style="padding:36px 32px 28px;color:#1a1a1a;line-height:1.65;font-size:15px;">
              ${bodyContent}
            </td>
          </tr>
          <tr>
            <td style="background:#1a0a00;padding:28px 32px;text-align:center;">
              <div style="width:40px;height:1px;background:#d4a855;margin:0 auto 16px;"></div>
              <p style="margin:0 0 8px;font-size:13px;color:#a0845c;">Experience the art of fine dining at VR Bites</p>
              <p style="margin:0 0 12px;font-size:12px;color:#6b4c2a;">Need help? <a href="mailto:support@vrbites.com" style="color:#d4a855;text-decoration:none;font-weight:600;">support@vrbites.com</a></p>
              <p style="margin:0;font-size:11px;color:#4a3020;">&copy; ${new Date().getFullYear()} VR Bites. All rights reserved.</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
};
