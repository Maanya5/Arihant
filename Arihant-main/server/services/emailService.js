const resend = require('../config/resend');
const FROM_EMAIL = 'onboarding@resend.dev'; // Use verified domain once available

const formatCurrency = (paisa) => `₹${(paisa / 100).toFixed(2)}`;

const generateOrderTable = (items) => {
  let rows = items.map(item => `
    <tr>
      <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.itemName} (${item.size})</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price_paisa)}</td>
      <td style="padding: 10px; border-bottom: 1px solid #eee; text-align: right;">${formatCurrency(item.price_paisa * item.quantity)}</td>
    </tr>
  `).join('');

  return `
    <table style="width: 100%; border-collapse: collapse; margin-top: 20px; font-family: sans-serif;">
      <thead>
        <tr style="background-color: #f8f9fa;">
          <th style="padding: 10px; text-align: left; border-bottom: 2px solid #ddd;">Item</th>
          <th style="padding: 10px; text-align: center; border-bottom: 2px solid #ddd;">Qty</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Price</th>
          <th style="padding: 10px; text-align: right; border-bottom: 2px solid #ddd;">Total</th>
        </tr>
      </thead>
      <tbody>
        ${rows}
      </tbody>
    </table>
  `;
};

const sendOrderConfirmationEmails = async (order, user) => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL || 'orders@arihantuniform.com';
    const address = order.shippingAddress;
    const itemsTable = generateOrderTable(order.items);
    const orderTotal = formatCurrency(order.totalAmount);
    
    // Email 1 — To the Customer
    if (!resend) {
      console.warn('[Email Service] Resend not initialized. Skipping customer email.');
    } else {
      await resend.emails.send({
        from: `Arihant Uniform Store <${FROM_EMAIL}>`,
        to: user.email,
        subject: `✅ Order Confirmed — Arihant Uniform Store (#${order._id})`,
        html: `
        <div style="font-family: sans-serif; max-w-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #1a56db; padding: 20px; text-align: center; color: white;">
            <h2>Arihant Uniform Store</h2>
          </div>
          <div style="padding: 20px;">
            <p>Thank you for your order, <strong>${user.name}</strong>!</p>
            <p>We've received your order and are getting it ready to ship.</p>
            
            <h3>Order Summary (#${order._id})</h3>
            ${itemsTable}
            
            <table style="width: 100%; margin-top: 10px; font-weight: bold;">
              <tr>
                <td style="text-align: right; padding: 10px;">Total Paid:</td>
                <td style="text-align: right; padding: 10px;">${orderTotal}</td>
              </tr>
            </table>

            <h3>Shipping Details</h3>
            <p style="background-color: #f9f9f9; padding: 15px; border-radius: 8px;">
              ${address.fullName}<br>
              ${address.street}<br>
              ${address.city}, ${address.state} ${address.pincode}<br>
              Phone: ${address.phone}
            </p>

            <p style="margin-top: 20px; color: #666;">
              <em>Estimated delivery: 3 to 5 business days.</em><br>
              We will send you an email update once your order has shipped!
            </p>
          </div>
          <div style="text-align: center; padding: 20px; font-size: 12px; color: #888;">
            Arihant Uniform Store | Need help? Reply to this email.
          </div>
        </div>
      `
      });

      // Email 2 — To the Store Owner
      await resend.emails.send({
        from: `Orders System <${FROM_EMAIL}>`,
        to: ownerEmail,
        subject: `🛒 New Order Received — #${order._id} | ${orderTotal}`,
        html: `
        <div style="font-family: sans-serif; padding: 20px; color: #333;">
          <h2>New Order Received!</h2>
          <p><strong>Order ID:</strong> ${order._id}</p>
          <p><strong>Razorpay ID:</strong> ${order.razorpay_payment_id || 'N/A'}</p>
          <p><strong>Total:</strong> ${orderTotal}</p>
          
          <h3>Customer Info</h3>
          <ul>
            <li>Name: ${user.name}</li>
            <li>Email: ${user.email}</li>
            <li>Phone: ${address.phone}</li>
          </ul>

          <h3>Order Items</h3>
          ${itemsTable}

          <h3>Shipping Address</h3>
          <p>
            ${address.fullName}, ${address.street}, ${address.city}, ${address.state} ${address.pincode}
          </p>

          <a href="https://arihant-uniforms.vercel.app/admin/dashboard/orders/${order._id}" 
             style="display: inline-block; padding: 10px 20px; background-color: #28a745; color: white; text-decoration: none; border-radius: 5px; margin-top: 20px;">
            Manage Order in Dashboard
          </a>
        </div>
      `
      });
    }

    console.log(`[Email Service] Confirmation process handled for order ${order._id}`);
  } catch (err) {
    console.error('[Email Service] Failed in sendOrderConfirmationEmails', err);
  }
};

const sendStatusUpdateEmail = async (order, user) => {
  try {
    const address = order.shippingAddress;
    const itemsTable = generateOrderTable(order.items);
    
    if (!resend) {
      console.warn('[Email Service] Resend not initialized. Skipping status update email.');
      return;
    }

    await resend.emails.send({
      from: `Arihant Uniform Store <${FROM_EMAIL}>`,
      to: user.email,
      subject: `📦 Your Order is ${order.orderStatus.toUpperCase()} — Arihant Uniform Store`,
      html: `
        <div style="font-family: sans-serif; max-w-width: 600px; margin: 0 auto; color: #333;">
          <div style="background-color: #1a56db; padding: 20px; text-align: center; color: white;">
            <h2>Arihant Uniform Store</h2>
          </div>
          <div style="padding: 20px;">
            <p>Hi <strong>${user.name}</strong>,</p>
            <p>Your order status has been updated to: <strong style="color: #1a56db; font-size: 18px;">${order.orderStatus.toUpperCase()}</strong></p>
            
            ${order.trackingNumber ? `
              <div style="background-color: #f0fdf4; border: 1px solid #bbf7d0; padding: 15px; border-radius: 8px; margin: 20px 0;">
                <strong>Tracking Number:</strong> ${order.trackingNumber}
              </div>
            ` : ''}
            
            <h3>Order Summary (#${order._id})</h3>
            ${itemsTable}
            
            <p style="background-color: #f9f9f9; padding: 15px; border-radius: 8px; margin-top: 20px;">
              <strong>Delivering To:</strong><br>
              ${address.fullName}, ${address.street}, ${address.city}, ${address.state} ${address.pincode}
            </p>
          </div>
        </div>
      `
    });
    console.log(`[Email Service] Status update email sent for order ${order._id}`);
  } catch (err) {
    console.error('[Email Service] Failed sendStatusUpdateEmail', err);
  }
};

const sendBulkInquiryEmail = async (inquiry) => {
  try {
    const ownerEmail = process.env.OWNER_EMAIL || 'orders@arihantuniform.com';
    if (!resend) { console.warn('[Email Service] Resend not initialized. Skipping inquiry email.'); return; }
    await resend.emails.send({
      from: `Arihant Store <${FROM_EMAIL}>`,
      to: ownerEmail,
      subject: `📋 New Bulk Order Inquiry — ${inquiry.name} (Qty: ${inquiry.quantity})`,
      html: `<div style="font-family:sans-serif;padding:20px;">
        <h2>New Bulk Order Inquiry</h2>
        <p><strong>Name:</strong> ${inquiry.name}</p>
        <p><strong>Phone:</strong> ${inquiry.phone}</p>
        ${inquiry.email ? `<p><strong>Email:</strong> ${inquiry.email}</p>` : ''}
        <p><strong>Quantity:</strong> ${inquiry.quantity}</p>
        ${inquiry.message ? `<p><strong>Message:</strong> ${inquiry.message}</p>` : ''}
      </div>`
    });
  } catch (err) {
    console.error('[Email Service] Failed sendBulkInquiryEmail', err);
  }
};

module.exports = {
  sendOrderConfirmationEmails,
  sendStatusUpdateEmail,
  sendBulkInquiryEmail
};
