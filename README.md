# 🏥 DaanaRx - HIPAA-Compliant Medication Tracking System

A comprehensive web application for non-profit clinics to track and distribute donated prescription medications.

[![TypeScript](https://img.shields.io/badge/TypeScript-5.6-blue)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-15.0-black)](https://nextjs.org/)
[![License](https://img.shields.io/badge/License-Proprietary-red)]()

## 📋 Table of Contents

- [Overview](#-overview)
- [Quick Start](#-quick-start)
- [Prerequisites](#-prerequisites)
- [Installation](#-installation)
- [Configuration](#-configuration)
- [Running the Application](#-running-the-application)
- [Core Features](#-core-features)
- [User Roles](#-user-roles)
- [Project Structure](#-project-structure)
- [Troubleshooting](#-troubleshooting)
- [Contributing](#-contributing)

## 🎯 Overview

DaanaRx provides comprehensive medication inventory management for non-profit clinics with:

- **Complete Inventory Management**: Track medications from check-in to dispensing
- **QR Code System**: Generate and scan QR codes for quick unit identification
- **Drug Lookup**: Integrated RxNorm and FDA APIs for NDC barcode scanning
- **Role-Based Access**: Superadmin, Admin, and Employee roles with appropriate permissions
- **HIPAA Compliance**: Row-level security, encrypted data, audit trails
- **Multi-Clinic Support**: Isolated data per clinic with automatic RLS policies

## ⚡ Quick Start

```bash
# 1. Clone the repository
git clone https://github.com/your-org/DaanarRX.git
cd DaanarRX

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp env-example.txt .env.local
# Edit .env.local with your Supabase credentials

# 4. Verify your setup
npm run verify

# 5. Start the application
npm run dev:all
```

**That's it!** Open http://localhost:3000 and sign up to create your clinic.

## 📋 Prerequisites

Before you begin, ensure you have the following installed:

| Requirement | Version | Download |
|------------|---------|----------|
| **Node.js** | 18+ | [nodejs.org](https://nodejs.org/) |
| **npm** | 9+ | Included with Node.js |
| **Supabase Account** | Free tier works | [supabase.com](https://supabase.com/) |

**Optional:**
- Google Cloud Project (for OAuth)

## 🚀 Installation

### Step 1: Install Dependencies

```bash
npm install
```

After installation completes, you'll see helpful next steps automatically displayed.

### Step 2: Set Up Supabase

1. **Create a Supabase Project**
   - Go to [supabase.com](https://supabase.com/) and sign up
   - Click "New Project"
   - Choose a name, database password, and region

2. **Run Database Schema**
   - Open your Supabase Dashboard
   - Navigate to **SQL Editor** (left sidebar)
   - Open the `supabase-schema.sql` file from this project
   - Copy all contents and paste into SQL Editor
   - Click **Run**
   
   This creates all necessary tables, security policies, and seed data.

3. **Get Your API Keys**
   - In Supabase Dashboard, go to **Settings → API**
   - Copy the following:
     - Project URL
     - `anon` `public` key
     - `service_role` key (⚠️ Keep this secret!)

### Step 3: Configure Environment Variables

1. **Copy the template file:**
   ```bash
   cp env-example.txt .env.local
   ```

2. **Edit `.env.local` with your credentials:**
   ```bash
   # Required - Get from Supabase Dashboard → Settings → API
   NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key_here
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   
   # Required - Generate with: openssl rand -base64 32
   JWT_SECRET=your_random_secret_at_least_32_characters
   
   # Development defaults (can leave as-is)
   NEXT_PUBLIC_GRAPHQL_URL=http://localhost:4000/graphql
   ALLOWED_ORIGINS=http://localhost:3000,http://localhost:4000
   ```

3. **Verify your setup:**
   ```bash
   npm run verify
   ```
   
   This script checks:
   - ✅ Node.js version
   - ✅ Dependencies installed
   - ✅ Environment variables configured
   - ✅ All required files present

## 🔧 Configuration

### Generating a JWT Secret

You need a secure random string for JWT_SECRET. Use one of these methods:

**Option 1 - OpenSSL (Mac/Linux):**
```bash
openssl rand -base64 32
```

**Option 2 - Node.js (Any OS):**
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```

Copy the output and paste it into your `.env.local` file.

### Optional: Google OAuth Setup

If you want to enable Google Sign-In:

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing
3. Navigate to **APIs & Services → Credentials**
4. Create OAuth 2.0 Client ID
5. Add authorized redirect URI: `https://YOUR-PROJECT.supabase.co/auth/v1/callback`
6. Copy Client ID to `.env.local`:
   ```bash
   NEXT_PUBLIC_GOOGLE_CLIENT_ID=your_client_id.apps.googleusercontent.com
   ```
7. In Supabase Dashboard → **Authentication → Providers**, enable Google and add your credentials

## 🏃 Running the Application

### Development Mode

**Start both frontend and backend together (recommended):**
```bash
npm run dev:all
```

This starts:
- 🌐 Next.js frontend: http://localhost:3000
- 🔌 GraphQL backend: http://localhost:4000/graphql

**Or run separately in two terminals:**

Terminal 1 - Frontend:
```bash
npm run dev
```

Terminal 2 - Backend:
```bash
npm run server
```

### Production Build

```bash
# Build frontend
npm run build

# Build backend
npm run build:server

# Start production servers
npm run start          # Frontend
npm run start:server   # Backend
```

## 🎨 Core Features

### 1. Check-In Flow
Create inventory from donated medications:
- Create or select existing lot (donation source)
- Search drugs by NDC barcode or manual entry
- Create unit with quantity and expiry date
- Generate QR code for the unit
- Print labels

### 2. Check-Out Flow
Dispense medications to patients:
- Scan QR code or search by unit ID
- View unit details and available quantity
- Dispense medication with patient reference
- Automatic inventory updates
- Transaction logging

### 3. Scan/Lookup
Quick unit information:
- Quick unit information lookup
- View transaction history
- Direct link to check-out

### 4. Inventory Management
Complete stock visibility:
- View all units with pagination
- Search by drug name or notes
- See expiry dates and stock levels
- Color-coded status (expired, expiring soon)

### 5. Reports
Complete audit trail:
- Complete transaction audit trail
- Filter by date, type, patient reference
- Export capabilities (future enhancement)

### 6. Admin Panel
Location management:
- Create and manage storage locations
- Set temperature requirements (fridge/room temp)
- Delete protection for locations with inventory

### 7. Settings (Superadmin Only)
User management:
- Invite new users
- Assign roles (Admin, Employee)
- View all clinic users

## 👥 User Roles

| Role | Check-In | Check-Out | Inventory | Reports | Admin | Settings |
|------|----------|-----------|-----------|---------|-------|----------|
| **Superadmin** | ✅ Full | ✅ Full | ✅ Edit | ✅ Full | ✅ Full | ✅ Full |
| **Admin** | ✅ Yes | ✅ Yes | 👁️ Read | 👁️ Read | ✅ Locations | ❌ No |
| **Employee** | ✅ Yes | ✅ Yes | 👁️ View | ❌ No | ❌ No | ❌ No |

### Role Details

**Superadmin:**
- Full access to all features
- Can edit units and transactions
- User management
- Location management

**Admin:**
- Can check-in and check-out medications
- Read-only access to inventory and reports
- Can create locations
- Cannot edit existing data or manage users

**Employee:**
- Can check-in medications
- Can check-out medications
- View-only access to inventory
- No access to reports, admin, or settings

## 📁 Project Structure

```
DaanarRX/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── auth/              # Authentication (sign in/up)
│   │   ├── checkin/           # Medication check-in flow
│   │   ├── checkout/          # Medication check-out flow
│   │   ├── scan/              # QR code scanning & lookup
│   │   ├── inventory/         # Inventory management
│   │   ├── reports/           # Transaction reports
│   │   ├── admin/             # Location management
│   │   └── settings/          # User management
│   ├── components/            # Reusable React components
│   │   ├── ui/               # Shadcn UI components
│   │   └── layout/           # App shell & navigation
│   ├── lib/                   # Core utilities
│   │   ├── apollo.ts         # GraphQL client
│   │   └── supabase/         # Supabase client
│   ├── store/                 # Redux state management
│   ├── hooks/                 # Custom React hooks
│   └── types/                 # TypeScript definitions
├── server/
│   ├── graphql/               # GraphQL schema & resolvers
│   ├── services/              # Business logic layer
│   ├── middleware/            # Auth & validation
│   └── utils/                 # Server utilities
├── scripts/
│   ├── verify-setup.js       # Setup verification script
│   └── test-drug-api.js      # Drug API testing
├── supabase-schema.sql        # Database initialization
├── env-example.txt            # Environment variables template
└── package.json               # Dependencies & scripts
```

## 🚨 Troubleshooting

### "node_modules not found"

**Problem:** Dependencies not installed  
**Solution:**
```bash
npm install
```

### "Environment variables not configured"

**Problem:** `.env.local` file missing or incomplete  
**Solution:**
```bash
# 1. Copy the template
cp env-example.txt .env.local

# 2. Edit with your credentials
# 3. Verify setup
npm run verify
```

### "User record not found" error

**Problem:** Database schema not initialized  
**Solution:**
1. Open Supabase Dashboard → SQL Editor
2. Copy contents of `supabase-schema.sql`
3. Paste and run in SQL Editor
4. Verify RLS policies are enabled

### GraphQL endpoint not connecting

**Problem:** Backend server not running  
**Solution:**
```bash
# Check if port 4000 is in use
lsof -i :4000

# Start backend server
npm run server

# Or start both together
npm run dev:all
```

### TypeScript errors

**Problem:** Type definitions or dependencies missing  
**Solution:**
```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Verify TypeScript version
npx tsc --version  # Should be 5.6+
```

### Port already in use

**Problem:** Port 3000 or 4000 already in use  
**Solution:**
```bash
# Find and kill process on port 3000
lsof -ti:3000 | xargs kill -9

# Or use different port
PORT=3001 npm run dev
```

### Camera access denied for barcode scanning

**Problem:** Browser doesn't have camera permissions  
**Solution:**
- Barcode scanning requires HTTPS in production
- Use localhost for development (HTTPS not required)
- Check browser permissions: Settings → Privacy → Camera
- Try a different browser (Chrome recommended)

## 🧪 Testing

Run the setup verification:
```bash
npm run verify
```

Test the drug API integration:
```bash
npm run test:drug-api
```

Run unit tests (when available):
```bash
npm test              # Run once
npm run test:watch    # Watch mode
npm run test:coverage # With coverage
```

## 🗄️ Database Schema

### Key Tables

| Table | Description |
|-------|-------------|
| `clinics` | Clinic information and branding |
| `users` | User accounts with role-based access |
| `locations` | Storage locations with temperature tracking |
| `lots` | Donation batches linked to locations |
| `drugs` | Universal drug database (cached from APIs) |
| `units` | Individual medication units in inventory |
| `transactions` | Complete audit trail of all operations |

### Security Features

- **Row-Level Security (RLS)**: Automatic clinic data isolation
- **Encrypted Auth**: Supabase handles password hashing & JWT tokens
- **Audit Logs**: Every transaction is permanently recorded
- **Role-Based Access**: Fine-grained permissions per user role

## 🔌 API Integration

### RxNorm API
- NDC barcode lookup
- Drug name search
- Strength and form information
- **No API key required**

### openFDA API
- Fallback for NDC lookups
- Additional drug information
- **No API key required**

Both APIs are called automatically and results are cached locally.

## 🏗️ Technology Stack

### Frontend
- **Next.js 15** - React framework with App Router
- **React 18** - UI library
- **TypeScript** - Type safety
- **Tailwind CSS** - Utility-first styling
- **Shadcn UI** - Component library
- **Apollo Client** - GraphQL client
- **Redux Toolkit** - Global state management

### Backend
- **Express** - Web server
- **Apollo Server** - GraphQL API
- **Node.js 18+** - Runtime
- **TypeScript** - Type safety

### Database
- **Supabase/PostgreSQL** - Database with built-in auth
- **Row-Level Security** - Multi-tenancy
- **Real-time subscriptions** - Optional feature

### External APIs
- **RxNorm API** - Drug information
- **openFDA API** - Drug data fallback

## 📊 Key Scripts

| Command | Description |
|---------|-------------|
| `npm install` | Install dependencies with helpful post-install messages |
| `npm run verify` | Verify your development environment is properly configured |
| `npm run dev:all` | Start both frontend and backend servers |
| `npm run dev` | Start frontend only |
| `npm run server` | Start backend only |
| `npm run build` | Build for production |
| `npm run lint` | Run ESLint |
| `npm test` | Run tests |

## 🎓 First Time Setup Checklist

- [ ] Node.js 18+ installed
- [ ] Repository cloned
- [ ] Dependencies installed (`npm install`)
- [ ] Supabase project created
- [ ] `supabase-schema.sql` run in Supabase dashboard
- [ ] `.env.local` created with all credentials
- [ ] JWT_SECRET generated
- [ ] Setup verified (`npm run verify`)
- [ ] Application started (`npm run dev:all`)
- [ ] Can access http://localhost:3000
- [ ] Created first account (Superadmin)

## 🔒 HIPAA Compliance Notes

- All PHI is encrypted at rest (handled by Supabase)
- No sensitive data in network logs
- Complete audit trail via transactions table
- User access controls via RLS policies
- Session management with secure JWT tokens

**⚠️ Important:** Consult with legal and compliance teams for full HIPAA certification before production use.

## 📝 Additional Resources

- [Supabase Documentation](https://supabase.com/docs)
- [Next.js Documentation](https://nextjs.org/docs)
- [RxNorm API Documentation](https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html)
- [openFDA API Documentation](https://open.fda.gov/apis/)

## 🤝 Contributing

This is a private project for specific clinic use. For bugs or feature requests:

1. Document the issue clearly
2. Include steps to reproduce
3. Note your user role and permissions
4. Provide relevant error messages or screenshots

## 📄 License

Proprietary - All Rights Reserved

---

**Built with ❤️ for non-profit clinics providing essential healthcare services.**

## 💬 Need Help?

If you encounter issues during setup:

1. ✅ Run `npm run verify` to diagnose the problem
2. 📖 Check the [Troubleshooting](#-troubleshooting) section above
3. 🔍 Review error messages carefully - they often contain helpful hints
4. 📧 Contact the development team with specific error details

**Remember:** The `verify-setup.js` script is your friend! It will catch most common setup issues and provide clear instructions on how to fix them.
