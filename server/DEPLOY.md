# Arihant Store Backend - Deployment Guide

This guide explains how to deploy the Express backend to Render.

## 1. MongoDB Atlas Setup
1. Create a **Cluster** on [MongoDB Atlas](https://www.mongodb.com/cloud/atlas).
2. Go to **Network Access** and add `0.0.0.0/0`.
3. Go to **Database Access** and create a user.
4. Get your connection string: `mongodb+srv://<user>:<password>@cluster.mongodb.net/arihant_store?retryWrites=true&w=majority`.

## 2. Render Deployment
1. Log in to [Render](https://render.com).
2. Create a **New Web Service**.
3. Connect your GitHub repository.
4. Set **Root Directory** to `server`.
5. **Build Command**: `npm install`
6. **Start Command**: `node index.js`

## 3. Environment Variables (on Render)
Add these in the **Environment** tab:
- `MONGODB_URI`: (Your Atlas connection string)
- `JWT_SECRET`: (A secure random string)
- `FRONTEND_URL`: `https://your-frontend-url.vercel.app`
- `RAZORPAY_KEY_ID`: Your Razorpay Key ID
- `RAZORPAY_KEY_SECRET`: Your Razorpay Secret

## 4. Seeding Production
Once deployed, you can seed the initial data:
Connect to your Render terminal or use a tool like Postman to trigger a seed route (or manually run `node seed.js` from a shell if the platform allows it).
