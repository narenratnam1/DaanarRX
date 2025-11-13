# Getting Started with DaanaRX

Welcome! This guide will have you up and running in under 10 minutes.

## What You're Building

DaanaRX is a pharmaceutical inventory management system that helps you:
- Track medication inventory with lot numbers
- Check in and check out stock
- Generate printable QR code labels
- View real-time reports and analytics
- Manage storage locations

## Prerequisites

Before starting, make sure you have:

1. **Node.js** installed (v16 or higher)
   - Check: `node --version`
   - Download: https://nodejs.org/

2. **A Firebase account** (free)
   - Sign up: https://firebase.google.com/

3. **A code editor** (optional but recommended)
   - VS Code, Sublime Text, or any editor you prefer

## Quick Start (3 Steps)

### Step 1: Firebase Setup

1. Create a new Firebase project at https://console.firebase.google.com/
2. Enable **Firestore Database** (Start in test mode)
3. Enable **Anonymous Authentication**
4. Get your web config (Project Settings → Your apps → Add web app)
5. Download the Admin SDK key (Project Settings → Service Accounts → Generate new private key)

### Step 2: Configure Your App

1. **Place the Admin SDK key:**
   - Save the downloaded JSON file as `firebase-adminsdk.json`
   - Move it to: `/Users/rithik/Code/DaanarRX/server/firebase-adminsdk.json`

2. **Update environment variables:**
   - The `.env.example` file is already configured with the Firebase keys from your original HTML file
   - If those keys still work, you can skip this step!
   - If not, create a `.env` file and add your new Firebase config

### Step 3: Install & Run

Open a terminal in the project directory and run:

```bash
# Install dependencies for both backend and frontend
npm run install-all

# Start both servers (backend + frontend)
npm run dev
```

That's it! The app will open at http://localhost:3000

## First Time Using the App?

### 1. Set Up a Location
- Click **Admin** on the home screen
- Add a location like "Shelf A-1" and select "Room Temp"
- Click **Add**

### 2. Check In Your First Item
- Go back to home and click **Check In**
- **Create a Lot:**
  - Use today's date
  - Enter a source/donor name (e.g., "Main Warehouse")
  - Click "Create Lot"
- **Add a Unit:**
  - Select the lot you just created
  - Try the NDC lookup with "0071-0570-23" (Prozac example)
  - Or click "Enter Manually Instead" to type in drug info
  - Add quantity (e.g., 30)
  - Select expiry date
  - Choose the location you created
  - Click "Add Unit & Generate DaanaRX Label"
- Print the label (or just click "Done" to skip)

### 3. View Your Inventory
- Click **Inventory** from home
- You should see your unit listed!

### 4. Try Check Out
- Click **Check Out** from home
- Enter the Unit ID (starts with "UNIT-...")
- Enter quantity to dispense
- Add a patient reference code
- Click "Dispense Stock"

### 5. Check the Reports
- Click **Reports** from home
- See all your transactions logged

## Understanding the Workflow

```
1. ADMIN: Set up locations first
         ↓
2. CHECK IN: Create lots → Add units → Print labels
         ↓
3. SCAN: Look up units by scanning/entering Unit ID
         ↓
4. CHECK OUT: Dispense medication with patient tracking
         ↓
5. REPORTS: View all transactions and export data
```

## Common Questions

**Q: Do I need to use real medication data?**
A: No! You can enter test data to learn the system.

**Q: What if the NDC lookup doesn't work?**
A: Click "Enter Manually Instead" to type in the drug information yourself.

**Q: Can I use a barcode scanner?**
A: The app accepts keyboard input, so USB barcode scanners work great! They'll type directly into the input fields.

**Q: Where is my data stored?**
A: In your Firebase Firestore database. It's cloud-based and real-time.

**Q: Is this production-ready?**
A: Almost! You'll want to update Firebase security rules before deploying to production. See the README for details.

## Troubleshooting

### "Cannot find module" error
```bash
# Delete and reinstall dependencies
rm -rf node_modules client/node_modules
npm run install-all
```

### Backend won't connect to Firebase
- Check that `firebase-adminsdk.json` is in the `server/` folder
- Verify the file is valid JSON
- Make sure you downloaded the correct service account key

### Port 4000 already in use
```bash
# Kill whatever's using port 4000
lsof -ti:4000 | xargs kill -9

# Or change the port in .env
PORT=4001
```

### React app won't load
```bash
# Make sure both servers are running
npm run dev

# Check the terminal for errors
# Frontend runs on http://localhost:3000
# Backend runs on http://localhost:4000
```

## Next Steps

Once you're comfortable with the basics:

1. **Customize**: Modify the styling, add your logo
2. **Secure**: Update Firebase security rules for production
3. **Deploy**: Host on Firebase Hosting, Vercel, or your preferred platform
4. **Extend**: Add features like barcode scanning, email notifications, etc.

## Need More Help?

- See **SETUP_GUIDE.md** for detailed setup instructions
- See **README.md** for comprehensive documentation
- See **PROJECT_SUMMARY.md** for technical details

## Tips for Success

✅ Start with test data to learn the system
✅ Set up multiple locations to see how inventory is organized
✅ Use the CSV export to backup your data
✅ Check out the FEFO warning when you have multiple units of the same drug
✅ Use the Scan feature for quick lookups

Happy inventory management! 🎉

