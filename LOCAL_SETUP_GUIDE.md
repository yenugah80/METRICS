# 🚀 MyFoodMetrics Local Setup Guide

## ⚠️ IMPORTANT: This is NOT a Flutter Project
This is a **React web application** with Express.js backend. Do NOT install Flutter or try to run Flutter commands.

## 📋 Prerequisites

### Required Software
- **Node.js 18+** (download from nodejs.org)
- **PostgreSQL** (download from postgresql.org)
- **Git** (for cloning the repository)

### Required API Keys (Get These First!)
- **OpenAI API Key** (openai.com/api)
- **Stripe API Keys** (stripe.com/docs/keys)
- **Google Cloud Storage** (optional, for image uploads)

## 🔧 Setup Steps

### 1. Clone and Install
```bash
git clone [YOUR_REPO_URL]
cd myfoodmetrics
npm install
```

### 2. Database Setup
```bash
# Install PostgreSQL and create database
createdb myfoodmetrics_dev

# Set up your DATABASE_URL in .env (see step 3)
```

### 3. Environment Variables
Create `.env` file in project root:

```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/myfoodmetrics_dev"

# OpenAI (REQUIRED - get from openai.com)
OPENAI_API_KEY="sk-your-actual-key-here"

# Stripe (REQUIRED - get from stripe.com)
STRIPE_SECRET_KEY="sk_test_your-stripe-key"
STRIPE_PUBLISHABLE_KEY="pk_test_your-stripe-key"
STRIPE_WEBHOOK_SECRET="whsec_your-webhook-secret"

# Session Security
SESSION_SECRET="your-32-character-session-secret"

# Authentication (Replit specific)
REPLIT_CLIENT_ID="your-client-id"
REPLIT_CLIENT_SECRET="your-client-secret"

# Optional: Google Cloud Storage
GOOGLE_CLOUD_PROJECT_ID="your-project-id"
GOOGLE_CLOUD_STORAGE_BUCKET="your-bucket-name"

# App Settings
NODE_ENV="development"
PORT="5000"
CORS_ORIGIN="http://localhost:5000"
```

### 4. Database Migration
```bash
npm run db:push
```

### 5. Start Development Server
```bash
npm run dev
```

**✅ Success:** Open http://localhost:5000 in your browser

## 🐛 Common Issues

### "Command not found: flutter"
**Solution:** This isn't a Flutter project! Use `npm run dev` instead.

### "Database connection failed"
**Solution:** 
1. Make sure PostgreSQL is running
2. Check your DATABASE_URL in .env
3. Run `npm run db:push` to create tables

### "OpenAI API error"
**Solution:** 
1. Get a valid API key from openai.com
2. Add credits to your OpenAI account
3. Set OPENAI_API_KEY in your .env file

### "Port 5000 already in use"
**Solution:** 
1. Kill any existing processes: `lsof -ti:5000 | xargs kill`
2. Or change PORT in .env to different number

## 📁 Project Structure
```
myfoodmetrics/
├── client/           # React frontend
├── server/           # Express.js backend  
├── shared/           # Shared types and schemas
├── package.json      # Dependencies and scripts
└── .env             # Environment variables
```

## 🎯 Tech Stack Summary
- **Frontend:** React + Vite + TailwindCSS
- **Backend:** Express.js + PostgreSQL + Drizzle ORM
- **AI:** OpenAI GPT-4o-mini
- **Payments:** Stripe
- **Auth:** Replit Auth (OpenID Connect)

## ❓ Still Having Issues?

1. **Check Node.js version:** `node --version` (should be 18+)
2. **Clear node_modules:** `rm -rf node_modules && npm install`
3. **Check all environment variables are set**
4. **Verify PostgreSQL is running:** `pg_isready`

This is a web application that runs in your browser, NOT a mobile app.