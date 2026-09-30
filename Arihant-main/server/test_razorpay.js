/* server/test_razorpay.js */
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server/.env
dotenv.config({ path: path.join(__dirname, '.env') });

const Razorpay = require('razorpay');

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

console.log('⚡ Starting Razorpay Diagnostics...');
console.log('------------------------------------');
console.log('Loaded Key ID:', key_id);
console.log('Key Secret Present:', !!key_secret);
if (key_secret) {
  console.log('Key Secret Length:', key_secret.length);
}

if (!key_id || !key_secret) {
  console.error('❌ ERROR: Missing Razorpay Key ID or Key Secret in server/.env');
  process.exit(1);
}

const razorpay = new Razorpay({
  key_id: key_id,
  key_secret: key_secret
});

async function testRazorpay() {
  try {
    console.log('🔄 Attempting to create a mock order of ₹1.00 (100 paise)...');
    
    const mockOrder = await razorpay.orders.create({
      amount: 100, // 100 paise = 1 Rupee
      currency: 'INR',
      receipt: `test_receipt_${Date.now()}`
    });
    
    console.log('✅ SUCCESS! Razorpay is fully authenticated and running well!');
    console.log('Mock Order Details:');
    console.log('- Order ID:', mockOrder.id);
    console.log('- Amount:', mockOrder.amount + ' paise');
    console.log('- Currency:', mockOrder.currency);
    console.log('- Status:', mockOrder.status);
    console.log('------------------------------------');
  } catch (error) {
    console.error('❌ FAILED! Razorpay returned an error:');
    console.error('- Message:', error.message);
    if (error.statusCode) {
      console.error('- HTTP Status Code:', error.statusCode);
    }
    console.error('- Full Error payload:', error);
    console.log('------------------------------------');
  }
}

testRazorpay();
