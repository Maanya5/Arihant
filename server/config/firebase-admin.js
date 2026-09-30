const admin = require("firebase-admin");
const dotenv = require("dotenv");

dotenv.config();

try {
  let serviceAccount;

  if (process.env.FIREBASE_SERVICE_ACCOUNT) {
    // 1. Try parsing a full JSON string if provided
    try {
      serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
    } catch (parseError) {
      throw new Error("FIREBASE_SERVICE_ACCOUNT environment variable is not valid JSON.");
    }
  } else if (process.env.FIREBASE_PROJECT_ID && process.env.FIREBASE_CLIENT_EMAIL && process.env.FIREBASE_PRIVATE_KEY) {
    // 2. Fall back to individual environment variables
    serviceAccount = {
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    };
  } else {
    // 3. Fail gracefully and explicitly if variables are missing
    throw new Error("Missing Firebase Admin credentials. Please set FIREBASE_SERVICE_ACCOUNT or individual FIREBASE_* variables in .env");
  }

  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.cert(serviceAccount),
    });
    console.log("✅ Firebase Admin SDK Initialized Successfully");
  }
} catch (error) {
  console.error("❌ Firebase Admin Initialization Error:", error.message);
}

module.exports = admin;
