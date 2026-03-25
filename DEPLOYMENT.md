# Deployment Guide - Context Graph System

This guide covers deploying the application to Render.com (recommended) or other platforms.

## Option 1: Deploy to Render.com (Recommended)

### Backend Deployment (Node.js API)

1. Go to [render.com](https://render.com) and sign in
2. Click **"New +"** → **"Web Service"**
3. Connect your GitHub repository
4. Configure the backend service:
   - **Name**: `context-graph-api`
   - **Root Directory**: `backend`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Free or Paid

5. Add Environment Variables (in Render dashboard):
   ```
   NODE_ENV = production
   MONGODB_URI = <your-mongodb-connection-string>
   GEMINI_API_KEY = <your-gemini-api-key>
   PORT = 3001
   ```

6. Click **Deploy** and wait 5-10 minutes

**Your Backend URL**: `https://context-graph-api.onrender.com`

---

### Frontend Deployment (React + Vite)

1. Go to [render.com](https://render.com)
2. Click **"New +"** → **"Static Site"** (for best performance)
3. Connect your GitHub repository
4. Configure the frontend service:
   - **Name**: `context-graph-frontend`
   - **Root Directory**: `frontend`
   - **Build Command**: `npm install && npm run build`
   - **Publish Directory**: `dist`
   - **Plan**: Free

5. Add Environment Variable:
   ```
   VITE_API_URL = https://context-graph-api.onrender.com/api
   ```

6. Click **Deploy** and wait 2-3 minutes

**Your Frontend URL**: `https://context-graph-frontend.onrender.com`

---

## Option 2: Alternative Deployment Platforms

### Railway.app
```bash
# Backend
cd backend
railway link   # Connect to your Railway project
railway deploy

# Frontend
cd ../frontend
railway deploy
```

### Vercel (Frontend Only)
```bash
cd frontend
npm install -g vercel
vercel
```

### AWS Elastic Beanstalk (Backend)
```bash
cd backend
eb create context-graph-api-prod
eb deploy
```

---

## Environment Variables Setup

### Backend (.env)
```env
NODE_ENV=production
PORT=3001
MONGODB_URI=mongodb+srv://user:password@cluster.mongodb.net/context-graph
GEMINI_API_KEY=your-gemini-api-key
```

### Frontend (.env or .env.production)
```env
VITE_API_URL=https://context-graph-api.onrender.com/api
```

---

## Getting Your API Keys

### MongoDB Atlas
1. Go to [mongodb.com/atlas](https://mongodb.com/atlas)
2. Create a free cluster
3. Get connection string from "Connect" → "Drivers"
4. Copy to `.env` as `MONGODB_URI`

### Google Gemini API
1. Go to [ai.google.dev](https://ai.google.dev)
2. Click "Get API Key"
3. Create new key for your project
4. Copy to backend `.env` as `GEMINI_API_KEY`

---

## Post-Deployment Checklist

- [ ] Backend service is running (check logs in Render dashboard)
- [ ] Frontend service is running
- [ ] Environment variables are set correctly
- [ ] MongoDB connection works (check backend logs)
- [ ] Gemini API key is valid
- [ ] Frontend can reach backend API
- [ ] Graph visualization loads
- [ ] Chat interface works
- [ ] Data displays correctly

---

## Troubleshooting

### Backend Won't Start
```bash
# Check logs
render logs context-graph-api

# Common issues:
# 1. MongoDB connection failed → verify MONGODB_URI
# 2. Missing environment variables → add them in dashboard
# 3. Port already in use → Render auto-assigns port from $PORT env var
```

### Frontend Can't Connect to Backend
1. Check `VITE_API_URL` environment variable
2. Ensure it matches backend service URL
3. Check backend is running

### Build Failing
```bash
# Test locally first
cd backend
npm install
npm start

cd ../frontend
npm install
npm run build
```

---

## Production Recommendations

1. **Enable Auto-Deploy**: Render automatically redeploys on git push
2. **Monitor Logs**: Check Render dashboard regularly
3. **Setup Alerts**: Render can email on deployment failures
4. **Scale Services**: Upgrade plan if needed for better performance
5. **Regular Backups**: MongoDB Atlas provides automatic backups
6. **Use Custom Domain**: Add domain in Render dashboard settings

---

## Useful Render.com Commands

```bash
# View deployment logs
curl https://api.render.com/v1/services

# Trigger redeploy
# Go to Service → Manual Deploy → Deploy latest commit
```

---

For more help:
- [Render.com Docs](https://render.com/docs)
- [MongoDB Atlas Docs](https://docs.mongodb.com/atlas)
- [Google Gemini API Docs](https://ai.google.dev/tutorials)
