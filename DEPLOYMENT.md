# Deployment Guide

This guide covers deploying DaanaRX to production.

## Pre-Deployment Checklist

- [ ] Firebase security rules configured
- [ ] Environment variables set for production
- [ ] Firebase Admin SDK key secured
- [ ] CORS configured for production domain
- [ ] Error handling tested
- [ ] Data backed up
- [ ] SSL/HTTPS enabled

## Option 1: Firebase Hosting + Cloud Run (Recommended)

### Advantages
- Fully integrated with Firebase
- Automatic SSL
- Global CDN
- Easy scaling
- Good free tier

### Steps

#### 1. Install Firebase CLI
```bash
npm install -g firebase-tools
firebase login
```

#### 2. Initialize Firebase Hosting
```bash
firebase init hosting
# Choose your project
# Set public directory to: client/build
# Configure as single-page app: Yes
# Don't overwrite index.html
```

#### 3. Build Frontend
```bash
cd client
npm run build
cd ..
```

#### 4. Deploy Frontend
```bash
firebase deploy --only hosting
```

#### 5. Deploy Backend to Cloud Run

Create `Dockerfile` in project root:
```dockerfile
FROM node:18-alpine

WORKDIR /app

# Copy backend files
COPY server/ ./server/
COPY package*.json ./

# Install dependencies
RUN npm install --production

# Expose port
EXPOSE 8080

# Start server
CMD ["node", "server/index.js"]
```

Build and deploy:
```bash
# Build image
gcloud builds submit --tag gcr.io/[PROJECT-ID]/daanarx-backend

# Deploy to Cloud Run
gcloud run deploy daanarx-backend \
  --image gcr.io/[PROJECT-ID]/daanarx-backend \
  --platform managed \
  --region us-central1 \
  --allow-unauthenticated
```

#### 6. Update Frontend Environment

Update `client/.env.production`:
```env
REACT_APP_API_URL=https://your-cloud-run-url.run.app/api
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
# ... other Firebase config
```

Rebuild and redeploy frontend:
```bash
cd client
npm run build
cd ..
firebase deploy --only hosting
```

## Option 2: Vercel + Railway

### Advantages
- Easy deployment from GitHub
- Automatic deployments on push
- Good free tier for both
- Built-in monitoring

### Steps

#### 1. Deploy Backend to Railway

1. Sign up at https://railway.app/
2. Click "New Project" → "Deploy from GitHub repo"
3. Select your repository
4. Add environment variables:
   - `PORT=8080`
   - `NODE_ENV=production`
   - Upload `firebase-adminsdk.json` content as environment variable
5. Set start command: `node server/index.js`
6. Deploy!

Note your Railway URL (e.g., `https://daanarx-backend.up.railway.app`)

#### 2. Deploy Frontend to Vercel

1. Sign up at https://vercel.com/
2. Click "New Project" → Import your repository
3. Set root directory to: `client`
4. Add environment variables:
   ```
   REACT_APP_API_URL=https://daanarx-backend.up.railway.app/api
   REACT_APP_FIREBASE_API_KEY=...
   REACT_APP_FIREBASE_AUTH_DOMAIN=...
   # ... other Firebase config
   ```
5. Build command: `npm run build`
6. Output directory: `build`
7. Deploy!

## Option 3: Heroku

### Advantages
- Simple deployment
- Good documentation
- Add-ons available

### Steps

#### 1. Create Heroku Apps

```bash
# Install Heroku CLI
npm install -g heroku

# Login
heroku login

# Create backend app
heroku create daanarx-backend

# Create frontend (static)
heroku create daanarx-frontend --buildpack heroku/nodejs
```

#### 2. Deploy Backend

```bash
# Add Procfile to root
echo "web: node server/index.js" > Procfile

# Set environment variables
heroku config:set NODE_ENV=production -a daanarx-backend
heroku config:set FIREBASE_ADMIN_SDK_PATH=./server/firebase-adminsdk.json -a daanarx-backend

# Add firebase-adminsdk.json content as config var
heroku config:set FIREBASE_ADMIN_SDK="$(cat server/firebase-adminsdk.json)" -a daanarx-backend

# Deploy
git push heroku main -a daanarx-backend
```

#### 3. Deploy Frontend

Update `client/.env.production`:
```env
REACT_APP_API_URL=https://daanarx-backend.herokuapp.com/api
```

```bash
cd client
npm run build

# Deploy build folder
heroku buildpacks:set heroku/nodejs -a daanarx-frontend
heroku config:set NPM_CONFIG_PRODUCTION=false -a daanarx-frontend

# Use heroku-buildpack-static
heroku buildpacks:set https://github.com/heroku/heroku-buildpack-static -a daanarx-frontend

# Create static.json in client/
echo '{
  "root": "build/",
  "routes": {
    "/**": "index.html"
  }
}' > static.json

# Deploy
git subtree push --prefix client heroku-frontend main
```

## Firebase Configuration for Production

### 1. Update Security Rules

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Locations - Read: authenticated, Write: admin only
    match /locations/{location} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.auth.token.admin == true;
    }
    
    // Lots - Read: authenticated, Write: admin only
    match /lots/{lot} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.auth.token.admin == true;
    }
    
    // Units - Read: authenticated, Write: authenticated
    match /units/{unit} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // Transactions - Read: authenticated, Write: authenticated
    match /transactions/{transaction} {
      allow read: if request.auth != null;
      allow write: if request.auth != null;
    }
    
    // NDC Formulary - Read: authenticated, Write: system only
    match /ndc_formulary/{ndc} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
                   request.auth.token.admin == true;
    }
  }
}
```

Deploy rules:
```bash
firebase deploy --only firestore:rules
```

### 2. Enable App Check (Optional but Recommended)

Protects your backend from abuse:

1. Go to Firebase Console → App Check
2. Enable for your web app
3. Choose reCAPTCHA v3
4. Add verification code to your app

### 3. Set Up Backup

Enable automatic backups:
```bash
gcloud firestore backups schedules create \
  --database='(default)' \
  --recurrence=daily \
  --retention=7d
```

## Environment Variables

### Production Backend (.env or hosting config)
```env
NODE_ENV=production
PORT=8080
FIREBASE_ADMIN_SDK_PATH=./server/firebase-adminsdk.json
CORS_ORIGIN=https://your-domain.com
```

### Production Frontend
```env
REACT_APP_API_URL=https://your-backend-url.com/api
REACT_APP_FIREBASE_API_KEY=your_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_domain
REACT_APP_FIREBASE_PROJECT_ID=your_project
REACT_APP_FIREBASE_STORAGE_BUCKET=your_bucket
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

## CORS Configuration

Update `server/index.js` for production:

```javascript
const corsOptions = {
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.CORS_ORIGIN 
    : '*',
  optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
```

## SSL/HTTPS

Most hosting providers include free SSL:
- Firebase Hosting: Automatic
- Vercel: Automatic
- Railway: Automatic
- Heroku: Automatic with paid plan
- Cloud Run: Automatic

## Monitoring

### Set Up Error Tracking

Install Sentry:
```bash
npm install @sentry/react @sentry/node
```

Frontend (`client/src/index.tsx`):
```typescript
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

Backend (`server/index.js`):
```javascript
const Sentry = require("@sentry/node");

Sentry.init({
  dsn: "your-sentry-dsn",
  environment: process.env.NODE_ENV,
});
```

### Firebase Analytics

Already included! Check Firebase Console for analytics.

## Performance Optimization

### 1. Enable Caching

Add to `client/public/index.html`:
```html
<meta http-equiv="Cache-Control" content="max-age=31536000, immutable">
```

### 2. Compress Assets

Install compression middleware:
```bash
npm install compression
```

Update `server/index.js`:
```javascript
const compression = require('compression');
app.use(compression());
```

### 3. Enable CDN

If using Firebase Hosting, CDN is automatic.

For other hosts, consider:
- Cloudflare (free CDN)
- AWS CloudFront
- Fastly

## Database Optimization

### Create Indexes

In Firebase Console → Firestore → Indexes, create:

1. **units** collection:
   - Field: `status`, Order: Ascending
   - Field: `exp_date`, Order: Ascending

2. **transactions** collection:
   - Field: `timestamp`, Order: Descending
   - Field: `type`, Order: Ascending

### Enable Persistence

Already enabled in `FirebaseContext.tsx`!

## Post-Deployment Testing

### Checklist
- [ ] All pages load correctly
- [ ] Authentication works
- [ ] Check-in flow works end-to-end
- [ ] Check-out flow works end-to-end
- [ ] Scan/lookup works
- [ ] Inventory displays correctly
- [ ] Reports generate
- [ ] CSV exports work
- [ ] Admin functions work
- [ ] QR code labels print correctly
- [ ] Real-time updates work
- [ ] Mobile responsive
- [ ] SSL certificate valid
- [ ] API endpoints respond correctly

### Load Testing

Use tools like:
- Apache Bench (`ab`)
- Artillery
- k6

Example with ab:
```bash
ab -n 1000 -c 10 https://your-api.com/api/health
```

## Rollback Plan

### If Deployment Fails

#### Firebase Hosting
```bash
# View deployment history
firebase hosting:channel:list

# Rollback to previous version
firebase hosting:rollback
```

#### Railway/Vercel/Heroku
Use the platform's UI to rollback to previous deployment.

### Database Rollback
```bash
# Restore from backup
gcloud firestore import gs://your-backup-bucket/backup-folder
```

## Maintenance

### Regular Tasks
- [ ] Check error logs weekly
- [ ] Review Firebase usage monthly
- [ ] Update dependencies monthly
- [ ] Backup data weekly
- [ ] Review security rules quarterly
- [ ] Performance audit quarterly

### Updating the App

```bash
# 1. Test changes locally
npm run dev

# 2. Run tests
npm test

# 3. Build frontend
cd client && npm run build

# 4. Deploy backend
# (Railway/Vercel: automatic on git push)
# (Cloud Run: see deployment steps above)

# 5. Deploy frontend
firebase deploy --only hosting
# or let Vercel auto-deploy

# 6. Verify deployment
# Test critical flows

# 7. Monitor for errors
# Check Sentry/Firebase Console
```

## Cost Estimates

### Firebase (Free Tier)
- Spark Plan: $0/month
- 50K reads, 20K writes, 20K deletes per day
- 1GB storage
- Good for: Small to medium deployments (< 100 users/day)

### Firebase (Paid - Blaze Plan)
- Pay as you go
- ~$25-100/month for typical usage (500-1000 users/day)

### Hosting Costs

| Platform | Free Tier | Paid |
|----------|-----------|------|
| Firebase Hosting | 10GB/month | $0.15/GB |
| Vercel | 100GB bandwidth | $20/month |
| Railway | $5 credit | $5-20/month |
| Heroku | 550 hours/month | $7/month per dyno |

### Recommended Stack for Budget
- Frontend: Vercel (free)
- Backend: Railway ($5-10/month)
- Database: Firebase Blaze ($10-30/month)
- **Total: ~$15-40/month**

## Support

### Where to Get Help
- Firebase Documentation: https://firebase.google.com/docs
- Railway Documentation: https://docs.railway.app/
- Vercel Documentation: https://vercel.com/docs
- Stack Overflow (tag: firebase, react, express)

## Custom Domain

### Firebase Hosting
```bash
firebase hosting:channel:create production
firebase hosting:channel:deploy production
# Follow instructions to add custom domain in console
```

### Vercel
1. Go to project settings
2. Click "Domains"
3. Add your domain
4. Update DNS records as instructed

### Railway
1. Go to project settings
2. Click "Networking"
3. Add custom domain
4. Update DNS records

## Conclusion

Choose the deployment option that best fits your:
- Budget
- Technical expertise
- Scalability needs
- Geographic requirements

For most cases, **Firebase Hosting + Cloud Run** or **Vercel + Railway** provide the best balance of ease, cost, and features.

Good luck with your deployment! 🚀

