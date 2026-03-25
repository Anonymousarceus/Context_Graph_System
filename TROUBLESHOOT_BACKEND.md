# Fix: Backend Connection Issues

## Problem
Frontend displays: "Failed to load initial data. Make sure the backend is running."

This happens because the frontend can't reach the backend API.

---

## Solutions

### Step 1: Check Backend is Running on Render

1. Go to [render.com dashboard](https://dashboard.render.com)
2. Click on your **backend service** (`context-graph-api`)
3. Look at the **Logs** tab - you should see:
   ```
   Server running on port 3001
   MongoDB connection established
   ```

If you see errors, check the troubleshooting section below.

---

### Step 2: Set FRONTEND_URL in Backend (IMPORTANT!)

**This is the most common issue.** The backend needs to know your frontend URL for CORS.

1. In Render dashboard, go to **Backend service** → **Environment**
2. Add this environment variable:
   ```
   FRONTEND_URL = https://context-graph-frontend.onrender.com
   ```
   (Replace with your actual frontend URL from Render)

3. Click **Save** and the backend will automatically redeploy

---

### Step 3: Set VITE_API_URL in Frontend (IMPORTANT!)

The frontend needs to know where the backend is located.

1. In Render dashboard, go to **Frontend service** → **Environment**
2. Add this environment variable:
   ```
   VITE_API_URL = https://context-graph-api.onrender.com/api
   ```
   (Replace with your actual backend URL from Render)

3. Click **Save** and the frontend will automatically redeploy

---

### Step 4: Verify Backend Health

Test if backend is working:

```bash
# Option 1: Visit in browser
https://context-graph-api.onrender.com/health

# Should return:
{
  "status": "ok",
  "timestamp": "2026-03-25T...",
  "database": "connected",
  "version": "1.0.0"
}
```

---

## Environment Variables Checklist

### Backend Service
- [ ] `NODE_ENV` = `production`
- [ ] `MONGODB_URI` = your MongoDB connection string
- [ ] `GEMINI_API_KEY` = your API key
- [ ] `FRONTEND_URL` = your frontend URL (e.g., `https://context-graph-frontend.onrender.com`)
- [ ] `PORT` = `3001` (optional, Render auto-assigns)

### Frontend Service
- [ ] `VITE_API_URL` = your backend API URL (e.g., `https://context-graph-api.onrender.com/api`)

---

## Troubleshooting

### Backend logs show "MongoDB connection failed"
1. Check `MONGODB_URI` is correct and contains actual username/password
2. Verify your MongoDB cluster is running in Atlas
3. Add Render's IP to MongoDB whitelist:
   - Go to MongoDB Atlas → Network Access
   - Click "Add IP Address"
   - Add `0.0.0.0/0` (allow all) or get Render's IP

### Backend logs show "CORS error"
1. This means `FRONTEND_URL` is not set
2. Add `FRONTEND_URL` environment variable (see Step 2 above)

### Frontend shows "Failed to load initial data"
1. Open browser DevTools (F12)
2. Go to **Network** tab
3. Try to load the graph page
4. Look for failed API requests
5. Check if `VITE_API_URL` is set correctly in frontend

### Health check returns "database: disconnected"
1. `MONGODB_URI` might be incorrect
2. MongoDB cluster might be paused or not running
3. Check MongoDB Atlas cluster status

### Still not working?
Check these URLs:
- Backend Health: `https://context-graph-api.onrender.com/health`
- Backend Docs: `https://context-graph-api.onrender.com/api/docs`
- Frontend: `https://context-graph-frontend.onrender.com`

---

## How to Debug Further

### 1. Check Frontend Console
```
Open frontend in browser → Right-click → Inspect → Console
Look for error messages about API calls
```

### 2. Check API Endpoint
Replace `https://context-graph-api.onrender.com` with your actual backend URL:
```
GET https://context-graph-api.onrender.com/api/graph/stats
```
Should return JSON data, not HTML error.

### 3. Check Render Logs
On Render dashboard:
- Click service
- Go to **Logs** tab
- Watch for new requests coming in
- Check for errors

### 4. Force Redeploy
Sometimes environment changes don't apply immediately:
1. Go to service → **Manual Deploy**
2. Click **Deploy latest commit**
3. Wait 3-5 minutes for rebuild

---

## Quick Fix Summary

If just deployed and getting "backend not running" error:

1. **Backend Service:**
   - Add `FRONTEND_URL` environment variable
   - Set it to your frontend URL
   - Deploy

2. **Frontend Service:**
   - Add `VITE_API_URL` environment variable
   - Set it to `https://[YOUR-BACKEND-NAME].onrender.com/api`
   - Deploy

3. **Wait** 5-10 minutes for builds to complete

4. **Test** by opening frontend in browser and checking the graph loads
