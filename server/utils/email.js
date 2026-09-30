const nodemailer = require('nodemailer');

// Setup Ethereal automatically for local development
let transporter = null;

const createTransporter = async () => {
  if (transporter) return transporter;

  // If real SMTP is provided in env
  if (process.env.SMTP_HOST && process.env.SMTP_USER) {
    transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT || 587,
      secure: process.env.SMTP_PORT == 465,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
    return transporter;
  }

  // Fallback to fake SMTP (Ethereal) for testing
  console.log('📧 Setting up Ethereal Fake SMTP...');
  let testAccount = await nodemailer.createTestAccount();
  transporter = nodemailer.createTransport({
    host: "smtp.ethereal.email",
    port: 587,
    secure: false, // true for 465, false for other ports
    auth: {
      user: testAccount.user, // generated ethereal user
      pass: testAccount.pass, // generated ethereal password
    },
  });
  return transporter;
};

const sendOrderConfirmation = async (user, order) => {
  try {
    const tp = await createTransporter();

    // Map items to HTML
    const itemsHtml = order.items.map(item => `
      <tr>
        <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.itemName} (${item.size})</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
        <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">₹${item.price * item.quantity}</td>
      </tr>
    `).join('');

    const mailOptions = {
      from: '"Arihant Store" <noreply@arihantstore.com>',
      to: user.email,
      subject: `Order Confirmation - #${order._id}`,
      html: `
        <div style="font-family: Arial, sans-serif; max-w: 600px; margin: 0 auto; padding: 20px; color: #333;">
          <h2 style="color: #2b3a55;">Thank you for your order, ${user.name}!</h2>
          <p>Your order <strong>#${order._id}</strong> has been confirmed and is currently being processed.</p>
          
          <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
                <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
                <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr>
                <td colspan="2" style="padding: 10px; text-align: right; font-weight: bold;">Grand Total:</td>
                <td style="padding: 10px; text-align: right; font-weight: bold; color: #e74c3c;">₹${order.totalAmount}</td>
              </tr>
            </tfoot>
          </table>

          <div style="margin-top: 30px; background-color: #f8f9fa; padding: 15px; border-radius: 8px;">
            <h3 style="margin-top: 0; color: #555;">Shipping Address</h3>
            <p style="margin: 0; line-height: 1.5;">
               ${order.shippingAddress.fullName || user.name}<br/>
               ${order.shippingAddress.addressLine1 || order.shippingAddress.street}<br/>
               ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zipCode || order.shippingAddress.pincode}<br/>
               Phone: ${order.shippingAddress.phone || user.phone}
            </p>
          </div>

          <p style="margin-top: 30px; font-size: 14px; color: #777;">
            We will inform you once your order has shipped.<br/>
            Need help? Reply to this email.
          </p>
        </div>
      `
    };

    let info = await tp.sendMail(mailOptions);
    console.log(`✉️ Order email sent to ${user.email}`);
    
    // Log ethereal URL if in test mode
    if (!process.env.SMTP_HOST) {
      console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    }
    
    return true;
  } catch (err) {
    console.error('Failed to send email:', err);
    return false;
  }
};

module.exports = { sendOrderConfirmation };
