# DaanaRX - Pharmaceutical Inventory Management System

A modern web application for managing pharmaceutical inventory with features for check-in, check-out, scanning, reporting, and administration. Built with React, Node.js, and Firebase.

## Features

- 📦 **Check In/Out**: Manage stock with lot tracking and FEFO (First Expired, First Out) compliance
- 🔍 **Scan & Lookup**: Quick unit lookup with QR code support
- 📊 **Inventory Management**: Real-time inventory tracking with status monitoring
- 📈 **Reports**: Transaction logs with date filtering and CSV export
- 🏥 **RxNorm Integration**: Automatic drug information lookup via RxNorm API (NIH/NLM) with fuzzy search and autocomplete
- 🏷️ **Label Generation**: Printable QR code labels for units
- ⚠️ **Quarantine**: Flag units for review
- 🌡️ **Location Management**: Track storage locations (room temp/fridge)

## Technology Stack

### Frontend
- React 18 with TypeScript
- Tailwind CSS for styling
- Firebase SDK for authentication and real-time data
- Lucide React for icons
- QRCode.js for label generation

### Backend
- Node.js with Express
- Firebase Admin SDK
- CORS support
- Environment-based configuration

### Database
- Firebase Firestore (NoSQL)

## Prerequisites

Before you begin, ensure you have the following installed:
- Node.js (v16 or higher)
- npm (v7 or higher)
- A Firebase account (free tier works fine)

## Installation & Setup

### 1. Clone the Repository

```bash
cd /Users/rithik/Code/DaanarRX
```

### 2. Firebase Setup

#### Create a Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Click "Add project" and follow the wizard
3. Enable Google Analytics (optional)

#### Enable Firestore Database

1. In your Firebase project, go to "Build" → "Firestore Database"
2. Click "Create database"
3. Start in **test mode** (you can update security rules later)
4. Choose a location close to your users

#### Enable Authentication

1. Go to "Build" → "Authentication"
2. Click "Get started"
3. Enable "Anonymous" sign-in method

#### Get Firebase Configuration

1. Go to Project Settings (gear icon)
2. Scroll to "Your apps" and click the Web icon (`</>`)
3. Register your app with a nickname (e.g., "DaanaRX Web")
4. Copy the `firebaseConfig` object

#### Download Admin SDK Key

1. In Project Settings, go to "Service accounts"
2. Click "Generate new private key"
3. Save the JSON file as `firebase-adminsdk.json` in the `server` directory

### 3. Environment Configuration

#### Backend Environment

Create a `.env` file in the project root:

```bash
cp .env.example .env
```

Edit `.env` and add your Firebase configuration:

```env
PORT=4000
NODE_ENV=development

# Note: RxNorm API from NIH/NLM is free and requires no API key
# https://lhncbc.nlm.nih.gov/RxNav/APIs/RxNormAPIs.html

# Firebase Admin SDK - path to your service account key
FIREBASE_ADMIN_SDK_PATH=./server/firebase-adminsdk.json

# Client Firebase Config (from Firebase Console)
REACT_APP_FIREBASE_API_KEY=your_api_key_here
REACT_APP_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
REACT_APP_FIREBASE_PROJECT_ID=your_project_id
REACT_APP_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
REACT_APP_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
REACT_APP_FIREBASE_APP_ID=your_app_id
REACT_APP_FIREBASE_MEASUREMENT_ID=your_measurement_id
```

#### Place Admin SDK Key

Move your `firebase-adminsdk.json` file to:
```bash
/Users/rithik/Code/DaanarRX/server/firebase-adminsdk.json
```

### 4. Install Dependencies

Install all dependencies for both backend and frontend:

```bash
# Install root dependencies
npm install

# Install client dependencies
cd client
npm install
cd ..
```

### 5. Start the Application

#### Option 1: Run Both Servers Concurrently (Recommended)

```bash
npm run dev
```

This will start:
- Backend server on `http://localhost:4000`
- React dev server on `http://localhost:3000`

#### Option 2: Run Servers Separately

Terminal 1 (Backend):
```bash
npm run server
```

Terminal 2 (Frontend):
```bash
npm run client
```

### 6. Access the Application

Open your browser and navigate to:
```
http://localhost:3000
```

## Project Structure

```
DaanarRX/
├── client/                 # React frontend
│   ├── public/            # Static files
│   ├── src/
│   │   ├── components/    # React components
│   │   │   ├── shared/   # Reusable components
│   │   │   └── views/    # Page components
│   │   ├── context/      # React Context (Firebase)
│   │   ├── firebase/     # Firebase configuration
│   │   ├── types/        # TypeScript types
│   │   ├── App.tsx       # Main app component
│   │   └── index.tsx     # Entry point
│   ├── package.json
│   └── tsconfig.json
├── server/                # Node.js backend
│   ├── index.js          # Express server
│   └── firebase-adminsdk.json  # (You add this)
├── .env                  # Environment variables (You create this)
├── .env.example         # Example environment file
├── package.json         # Root package.json
└── README.md           # This file
```

## Firebase Security Rules

For production, update your Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Allow authenticated users to read/write
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
  }
}
```

## API Endpoints

The backend provides the following endpoints:

- `GET /api/health` - Health check
- `GET /api/ndc/:ndc` - Lookup NDC code with fuzzy matching (supports multiple NDC formats)
- `GET /api/search/generic/:name` - Search drugs by generic name via RxNorm API (NIH/NLM)
- `GET /api/unit/:daanaId` - Lookup unit by Daana ID

**RxNorm API Features:**
- Free API from National Library of Medicine (no API key required)
- Fuzzy search with approximate term matching
- Comprehensive drug database with RXCUI identifiers
- Auto-complete support for drug name search

## Usage Guide

### Initial Setup

1. **Add Locations**: Go to Admin → Add storage locations (e.g., "Shelf A-1", "Fridge-1")
2. **Check In Stock**:
   - Create a new lot (date, source/donor)
   - Scan NDC barcode or enter manually
   - Add unit details (quantity, expiry, location)
   - Print the generated label

### Daily Operations

- **Check Out**: Scan unit QR code, enter quantity and patient reference
- **Scan/Lookup**: Quickly find unit information
- **Inventory**: View all units, export to CSV, quarantine items
- **Reports**: View transaction log, filter by date, export to CSV

### FEFO Compliance

The system automatically checks for older units when checking out and warns if a unit with an earlier expiration date is available.

## Troubleshooting

### Firebase Connection Issues

- Verify your Firebase configuration in `.env`
- Check that Firestore and Authentication are enabled
- Ensure security rules allow read/write for authenticated users

### Backend Won't Start

- Verify `firebase-adminsdk.json` is in the `server` directory
- Check that PORT 4000 is not in use (or change PORT in `.env`)
- Run `npm install` in the root directory

### Frontend Build Errors

- Delete `node_modules` and `package-lock.json` in `client/`
- Run `npm install` again in `client/`
- Ensure all environment variables start with `REACT_APP_`

### Drug Search Not Working

- Check your internet connection (RxNorm API requires internet)
- Ensure the backend server is running on port 4000
- Check browser console for CORS or network errors
- Verify RxNorm API is accessible: https://rxnav.nlm.nih.gov/REST/approximateTerm.json?term=aspirin
- If RxNorm is down, only local Firestore search will work

## Development

### Running Tests

```bash
cd client
npm test
```

### Building for Production

```bash
# Build the React app
cd client
npm run build

# The build folder is ready to be deployed
```

### Environment Variables

The application uses environment variables for configuration:
- Backend variables are in `.env` (root)
- Frontend variables must start with `REACT_APP_`

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

This project is licensed under the ISC License.

## Support

For issues, questions, or contributions, please open an issue on the GitHub repository.

## Acknowledgments

- [RxNorm API](https://lhncbc.nlm.nih.gov/RxNav/) by National Library of Medicine (NIH) for comprehensive, free pharmaceutical database
- [Firebase](https://firebase.google.com/) for backend infrastructure and real-time database
- [Tamagui](https://tamagui.dev/) for cross-platform UI components
- [Lucide React](https://lucide.dev/) for beautiful icons
- [QRCode.js](https://github.com/soldair/node-qrcode) for QR code generation

