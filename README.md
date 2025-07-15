# MenuWise Backend - Render Deployment

Backend API services for MenuWise Korean food translation app.

## Features

- 🍜 Korean menu OCR and translation with OpenAI
- 💳 Payment processing with Stripe (Cards, PayPal, Klarna)
- 🔒 User authentication with Replit Auth
- 🖼️ Multi-source Korean food image integration
- 💾 SHA-256 image caching to reduce API costs
- 🗄️ PostgreSQL database with Drizzle ORM
- 🌐 CORS-enabled for frontend integration

## Quick Deploy to Render

[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://dashboard.render.com)

1. **Create PostgreSQL Database** in Render dashboard
2. **Deploy this repository** as a Web Service
3. **Set environment variables** (see below)
4. **Configure frontend** with `VITE_API_BASE_URL`

## Environment Variables

### Required
```
DATABASE_URL=postgresql://...
OPENAI_API_KEY=sk-...
NODE_ENV=production
SESSION_SECRET=auto-generated-by-render
```

### CORS & Auth
```
CORS_ORIGIN=https://your-replit-app.replit.app
REPLIT_DOMAINS=your-replit-app.replit.app
REPL_ID=your-replit-id
ISSUER_URL=https://replit.com/oidc
```

### Payments
```
STRIPE_SECRET_KEY=sk_...
```

### Optional APIs
```
UNSPLASH_ACCESS_KEY=...
PEXELS_API_KEY=...
PIXABAY_API_KEY=...
```

## API Endpoints

- `GET /health` - Health check
- `POST /api/analyze-menu` - Menu image analysis
- `POST /api/create-subscription` - Stripe payments
- `GET /api/proxy-image` - Korean image proxy
- `GET /api/auth/user` - User authentication

## Local Development

```bash
npm install
npm run dev
```

## Production Build

```bash
npm run build:backend
npm run start:backend
```

## Database

Schema managed with Drizzle ORM. Migrations run automatically on deployment.

## Architecture

Designed to work with Replit frontend via CORS-enabled API calls.

Frontend (Replit) ←→ Backend (Render) ←→ PostgreSQL (Render)