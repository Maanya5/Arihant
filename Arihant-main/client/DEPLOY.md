# Arihant Store Frontend - Deployment Guide

This guide explains how to deploy the Next.js frontend to Vercel.

## 1. Vercel Deployment
1. Log in to [Vercel](https://vercel.com).
2. Create a **New Project**.
3. Connect your GitHub repository.
4. Set **Root Directory** to `client`.
5. Vercel will auto-detect Next.js and set the build commands automatically.

## 2. Environment Variables (on Vercel)
Add this in the **Environment Variables** section:
- `NEXT_PUBLIC_API_URL`: `https://your-backend-url.onrender.com/api`

## 3. Post-Deployment
- Ensure your backend `FRONTEND_URL` points to the `https://...vercel.app` URL provided by Vercel to allow CORS.
