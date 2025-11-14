# Vercel Deployment Guide for DaanaRX

## Pre-Deployment Checklist

- [x] Removed hardcoded Firebase credentials
- [x] Created Vercel serverless functions for API
- [x] Fixed API calls to use environment variables
- [x] Created vercel.json configuration
- [ ] Set up environment variables in Vercel dashboard

## Step 1: Install Vercel CLI (Optional)

```bash
npm install -g vercel
```

## Step 2: Deploy to Vercel

### Option A: Deploy via Vercel Dashboard (Recommended)

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click "New Project"
3. Import your Git repository (GitHub/GitLab/Bitbucket)
4. Configure the project:
   - **Framework Preset**: Create React App
   - **Root Directory**: `client` (IMPORTANT!)
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
   - **Install Command**: `npm install`

### Option B: Deploy via CLI

```bash
cd /Users/narenratnam/Desktop/Projects/DaanarRX
vercel
```

Follow the prompts:
- Set root directory to: `client`
- Override settings? **No** (use vercel.json)

## Step 3: Configure Environment Variables

In Vercel Dashboard → Your Project → Settings → Environment Variables, add:

### Required Firebase Variables:
```
REACT_APP_FIREBASE_API_KEY=your_api_key
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

### Optional API URL (if using separate backend):
```
REACT_APP_API_URL=https://your-backend-url.com/api
```

**Note**: If you're deploying both frontend and API on Vercel, leave `REACT_APP_API_URL` unset (it will default to `/api`).

## Step 4: Deploy API Functions

The API functions are in the `/api` folder and will be automatically deployed with your project.

### Available API Endpoints:
- `GET /api/health` - Health check
- `GET /api/ndc/:ndc` - NDC lookup via openFDA

## Step 5: Verify Deployment

After deployment, check:
1. ✅ Frontend loads at your Vercel URL
2. ✅ Firebase authentication works
3. ✅ API endpoints respond: `https://your-app.vercel.app/api/health`
4. ✅ NDC lookup works: `https://your-app.vercel.app/api/ndc/0071057023`

## Troubleshooting

### Build Fails
- Check that all environment variables are set
- Verify `client/package.json` has correct build script
- Check Vercel build logs for specific errors

### API Routes Not Working
- Ensure `/api` folder is in the root (not in `/client`)
- Check that `vercel.json` has correct rewrites
- Verify CORS headers are set correctly

### Firebase Errors
- Double-check all `REACT_APP_FIREBASE_*` environment variables
- Ensure Firebase project has correct security rules
- Check browser console for specific Firebase errors

### Environment Variables Not Loading
- Variables must start with `REACT_APP_` to be available in the browser
- Redeploy after adding new environment variables
- Check that variables are set for the correct environment (Production/Preview/Development)

## Project Structure for Vercel

```
DaanarRX/
├── api/                    # Serverless functions (deployed to /api/*)
│   ├── health.js
│   ├── ndc/
│   │   └── [ndc].js
│   └── package.json
├── client/                 # React app (root directory for Vercel)
│   ├── src/
│   ├── public/
│   ├── package.json
│   └── build/              # Output directory
├── server/                 # Not used on Vercel (use /api instead)
├── vercel.json            # Vercel configuration
└── package.json           # Root package.json
```

## Important Notes

1. **Root Directory**: Vercel should use `client` as the root directory
2. **API Functions**: Must be in `/api` folder at project root (not in `/client/api`)
3. **Environment Variables**: All Firebase config must come from env vars (no hardcoded values)
4. **Build Output**: Vercel will look for `client/build` directory after build

## Custom Domain

1. Go to Vercel Dashboard → Your Project → Settings → Domains
2. Add your custom domain
3. Update DNS records as instructed
4. Wait for SSL certificate (automatic)

## Continuous Deployment

Vercel automatically deploys on every push to your main branch. For preview deployments on other branches, Vercel creates preview URLs automatically.

## Monitoring

- Check Vercel Dashboard → Analytics for traffic
- View logs in Vercel Dashboard → Functions
- Set up error tracking (Sentry recommended)

## Cost

Vercel Free Tier includes:
- 100GB bandwidth/month
- Unlimited serverless function invocations
- Automatic SSL
- Preview deployments

Perfect for small to medium deployments!


