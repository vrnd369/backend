# 🚀 Render Deployment Checklist

## ✅ Pre-Deployment (Local)

- [x] All code committed to GitHub
- [x] `package.json` has correct start script: `"start": "node server.js"`
- [x] `server.js` is the main entry point
- [x] All dependencies are in `package.json`
- [x] Node.js version specified: `"node": ">=20.0.0 <21.0.0"`

## 🔧 Render Setup

### Step 1: Create Web Service
- [ ] Go to [Render Dashboard](https://dashboard.render.com/)
- [ ] Click "New +" → "Web Service"
- [ ] Connect GitHub repository
- [ ] Select your backend repository

### Step 2: Configure Service
- [ ] **Name**: `your-backend-name`
- [ ] **Environment**: `Node`
- [ ] **Region**: Choose closest to users
- [ ] **Branch**: `main`
- [ ] **Build Command**: `npm install`
- [ ] **Start Command**: `npm start`

### Step 3: Environment Variables
Add these in Render dashboard:

**Required:**
- [ ] `MONGO_URI` = `mongodb+srv://username:password@cluster.mongodb.net/database`
- [ ] `EMAIL_USER` = `your-gmail@gmail.com`
- [ ] `EMAIL_PASS` = `your-gmail-app-password`
- [ ] `GOOGLE_CLIENT_ID` = `your-google-oauth-client-id`
- [ ] `JWT_SECRET` = `your-super-secure-jwt-secret-key`
- [ ] `NODE_ENV` = `production`

**Optional (for payments):**
- [ ] `RAZORPAY_KEY_ID` = `your-razorpay-key-id`
- [ ] `RAZORPAY_KEY_SECRET` = `your-razorpay-key-secret`

### Step 4: Deploy
- [ ] Click "Create Web Service"
- [ ] Wait for build to complete (2-3 minutes)
- [ ] Check deployment logs for any errors

## 🧪 Post-Deployment Testing

### Health Check
- [ ] Visit: `https://your-app-name.onrender.com/health`
- [ ] Should return: `{"status":"ok","mongodb":"connected","environment":"production"}`

### Test Endpoints
- [ ] Test signup: `POST /auth/signup`
- [ ] Test login: `POST /auth/login`
- [ ] Test profile: `GET /auth/profile/:userId`
- [ ] Test cart: `POST /cart/update` and `GET /cart/:userId`
- [ ] Test wishlist: `POST /wishlist/update` and `GET /wishlist/:userId`

## 🔧 Configuration Updates

### Update CORS (if needed)
After deployment, update `server.js` CORS origin:
```javascript
origin: [
  'http://localhost:3000',
  'https://your-frontend-domain.com' // Add your frontend URL
]
```

### Update Frontend
- [ ] Change API base URL to: `https://your-app-name.onrender.com`
- [ ] Test all frontend features with new backend URL

## 🎯 Your Backend URL
Once deployed, your backend will be available at:
```
https://your-app-name.onrender.com
```

## 📞 If Issues Occur

1. **Check Render Logs**: Go to your service → Logs
2. **Verify Environment Variables**: Check all variables are set
3. **Test Locally**: Ensure code works locally first
4. **Check MongoDB**: Verify Atlas connection and permissions

## 🎉 Success Indicators

- [ ] Health endpoint returns success
- [ ] All API endpoints respond correctly
- [ ] Frontend can connect to backend
- [ ] Database operations work
- [ ] Authentication works
- [ ] Cart/wishlist functionality works

**Your backend is now live and ready for production! 🚀** 