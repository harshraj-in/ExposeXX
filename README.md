# ExposeX

A robust, full-stack civic reporting platform allowing users to securely report corruption incidents, request AI legal guidance, track their resolution, and explore a live public incidence map.

## Tech Stack
- Frontend: React + Vite + Tailwind CSS + Zustand + React Router
- Backend: Node.js + Express.js + MongoDB
- Integrations: Anthropic Claude for AI Advice, Leaflet for public mapping

## Deployment Guide

### Backend setup:
1. `cd backend`
2. `npm install`
3. Fill `.env` using `.env.example` as a template
4. Start dev server: `npm run dev`
5. Seed database (creates Super Admin and dummy reports): `npm run seed`

### Frontend setup:
1. `cd frontend`
2. `npm install`
3. Set VITE_API_URL or use proxy setup in `vite.config.js` pointing to backend port
4. Start dev server: `npm run dev`

### Production:
- Backend is optimized to run on Railway / Render. Ensure all API keys are set.
- Frontend should be deployed to Vercel/Netlify. Ensure API base URL is set to the production backend route.

## Default Admin Credentials
**Email:** admin@exposex.gov
**Password:** password123
