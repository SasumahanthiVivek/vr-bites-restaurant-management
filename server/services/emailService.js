
require('dotenv').config();
const nodemailer = require('nodemailer');
const handlebars = require('handlebars');
const juice = require('juice');
const { htmlToText } = require('html-to-text');
const fs = require('fs');
const path = require('path');

const EMAIL_USER = process.env.EMAIL_USER;
const EMAIL_PASS = process.env.EMAIL_PASS;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || process.env.EMAIL_USER;

if (!EMAIL_USER || !EMAIL_PASS) {
  console.error('[EMAIL_ERROR] Missing SMTP credentials. Emails will not be sent.');
  // Do not crash backend
} else {
  console.log('[EMAIL_DEBUG] SMTP credentials found, attempting connection...');
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: EMAIL_USER,
    pass: EMAIL_PASS,
  },
  tls: {
    rejectUnauthorized: false,
  },
});

transporter.verify((err, success) => {
  if (err) {
    console.error('[EMAIL_ERROR] SMTP Failed', err);
  } else {
    console.log('[EMAIL_SUCCESS] SMTP Connected');
  }
});

function compileTemplate(templateName, data) {
  const templatePath = path.join(__dirname, '../templates', templateName + '.js');
  const templateFn = require(templatePath);
  const html = templateFn(data);
  return juice(html);
}

async function sendEmail({
  to,
  subject,
  template,
  data = {},
  attachments = [],
  retries = 2,
}) {
  console.log(`[EMAIL_DEBUG] Email trigger started for: ${to} | Subject: ${subject}`);
  if (!to) {
    console.error('[EMAIL_ERROR] sendEmail failed: recipient email is missing.');
    return false;
  }
  if (!EMAIL_USER || !EMAIL_PASS) {
    console.error('[EMAIL_ERROR] sendEmail failed: Missing SMTP credentials. Ensure .env is loaded and EMAIL_USER/EMAIL_PASS are set.');
    return false;
  }
  try {
    const html = compileTemplate(template, data);
    const text = htmlToText(html);
    const mailOptions = {
      from: `VR Bites <${EMAIL_USER}>`,
      to,
      subject,
      html,
      text,
      attachments,
    };
    let attempt = 0;
    while (attempt <= retries) {
      try {
        console.log(`[EMAIL_DEBUG] Sending email attempt ${attempt + 1}...`);
        await transporter.sendMail(mailOptions);
        console.log(`[EMAIL_SUCCESS] Sent to ${to} | Subject: ${subject}`);
        return true;
      } catch (err) {
        attempt++;
        console.error(`[EMAIL_ERROR] Attempt ${attempt} failed for ${to}. Reason: ${err.message}`);
        
        // Diagnostic suggestions
        if (err.message.includes('Invalid login') || err.code === 'EAUTH') {
          console.error('[EMAIL_DIAGNOSTIC] Authentication failed. Check if EMAIL_PASS is a valid App Password (not your regular password). Gmail requires App Passwords if 2FA is enabled.');
        } else if (err.code === 'ESOCKET' || err.code === 'ECONNREFUSED') {
          console.error('[EMAIL_DIAGNOSTIC] Connection refused. Check if Gmail is blocking SMTP or if your network is blocking the port.');
        }
        
        if (attempt > retries) {
          console.error(`[EMAIL_ERROR] All ${retries + 1} attempts failed. Returning false.`);
          return false;
        }
      }
    }
  } catch (err) {
    console.error('[EMAIL_ERROR] sendEmail failed during template compilation or unexpected error:', err.message);
    return false;
  }
}

module.exports = {
  sendEmail,
  ADMIN_EMAIL,
};
