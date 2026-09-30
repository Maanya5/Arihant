const { Resend } = require('resend');

const resendApiKey = process.env.RESEND_API_KEY;

if (!resendApiKey) {
  console.warn('[Warning] RESEND_API_KEY is missing from environment variables. Emails will not be sent.');
}

const resend = resendApiKey ? new Resend(resendApiKey) : null;

module.exports = resend;
