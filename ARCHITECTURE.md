# DaanaRX Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────┐
│                         Browser                              │
│  ┌───────────────────────────────────────────────────────┐  │
│  │           React App (localhost:3000)                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Components                                      │  │  │
│  │  │  ├── Home                                        │  │  │
│  │  │  ├── CheckIn                                     │  │  │
│  │  │  ├── CheckOut                                    │  │  │
│  │  │  ├── Scan                                        │  │  │
│  │  │  ├── Inventory                                   │  │  │
│  │  │  ├── Reports                                     │  │  │
│  │  │  └── Admin                                       │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  │                      ↕                                  │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  Firebase Context (Global State)                │  │  │
│  │  │  - locations, lots, units, transactions         │  │  │
│  │  │  - Real-time listeners                          │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                      ↕                           ↕
         ┌────────────────────────┐    ┌──────────────────────┐
         │  Node.js Backend       │    │  Firebase Services   │
         │  (localhost:4000)      │    │                      │
         │  ┌──────────────────┐  │    │  ┌────────────────┐ │
         │  │  Express Routes  │  │    │  │  Firestore DB  │ │
         │  │  - /api/health   │  │    │  │  Collections:  │ │
         │  │  - /api/ndc/*    │←─┼────┼→ │  - locations   │ │
         │  │  - /api/units/*  │  │    │  │  - lots        │ │
         │  │  - /api/lots/*   │  │    │  │  - units       │ │
         │  │  - /api/trans..  │  │    │  │  - trans...    │ │
         │  └──────────────────┘  │    │  │  - ndc_form..  │ │
         │         ↕               │    │  └────────────────┘ │
         │  ┌──────────────────┐  │    │  ┌────────────────┐ │
         │  │  Firebase Admin  │←─┼────┼→ │  Auth          │ │
         │  │  SDK             │  │    │  │  (Anonymous)   │ │
         │  └──────────────────┘  │    │  └────────────────┘ │
         └────────────────────────┘    └──────────────────────┘
                      ↕
         ┌────────────────────────┐
         │   External APIs        │
         │  ┌──────────────────┐  │
         │  │  openFDA API     │  │
         │  │  (NDC Lookup)    │  │
         │  └──────────────────┘  │
         └────────────────────────┘
```

## Data Flow

### Check-In Flow
```
User Input (Check-In View)
    ↓
1. Create Lot
    ↓
   [POST /api/lots] → Firebase Admin SDK → Firestore
    ↓
2. NDC Lookup (Optional)
    ↓
   [GET /api/ndc/:ndc] → openFDA API → Return drug info
    ↓
3. Add Unit
    ↓
   Batch Write:
   - Create unit document
   - Create transaction document
   - Save to ndc_formulary (if manual)
    ↓
   Generate QR Code → Display Print Modal
```

### Check-Out Flow
```
User Input (Check-Out View)
    ↓
1. Lookup Unit by ID
    ↓
   Query Firestore → Find unit document
    ↓
2. Validate
    ↓
   - Check quantity available
   - Check status
   - FEFO compliance check
    ↓
3. Update & Log
    ↓
   Batch Write:
   - Update unit quantity/status
   - Create transaction document
    ↓
   Show success message
```

### Real-time Updates
```
Component Mounts
    ↓
Firebase Context initializes listeners
    ↓
onSnapshot() for each collection:
  - locations
  - lots  
  - units
  - transactions
    ↓
State updates automatically
    ↓
Components re-render with new data
```

## Component Hierarchy

```
App (FirebaseProvider)
├── AppContent
│   ├── Header
│   │   └── Status indicator
│   ├── StatusBar
│   │   ├── In Stock count
│   │   ├── Expiring Soon count
│   │   └── Checked Out Today count
│   └── Current View (one of):
│       ├── Home
│       │   └── Navigation buttons (6)
│       ├── CheckIn
│       │   ├── Lot Form
│       │   ├── NDC Lookup
│       │   ├── Unit Form
│       │   └── PrintLabelModal
│       ├── CheckOut
│       │   ├── Checkout Form
│       │   └── ConfirmModal (FEFO)
│       ├── Scan
│       │   ├── Search input
│       │   └── Result display
│       ├── Inventory
│       │   ├── Table view
│       │   └── ConfirmModal (Quarantine)
│       ├── Reports
│       │   ├── Date filters
│       │   └── Transaction table
│       └── Admin
│           ├── Location form
│           └── Location table
```

## State Management

### Global State (Firebase Context)
```typescript
{
  user: User | null,
  loading: boolean,
  locations: Location[],
  lots: Lot[],
  units: Unit[],
  transactions: Transaction[],
  userId: string | null
}
```

### Local State (Component Level)
Each view component manages its own form state:
- Input values
- Validation errors
- Loading states
- Modal visibility

## Database Schema

### Collections

#### locations
```javascript
{
  id: string,              // Auto-generated
  name: string,            // e.g., "Shelf A-1"
  temp_type: "room"|"fridge",
  is_active: boolean,
  created_at: Timestamp
}
```

#### lots
```javascript
{
  id: string,              // Auto-generated
  date_received: string,   // ISO date
  source_donor: string,
  notes: string,
  received_by_user_id: string,
  created_at: Timestamp
}
```

#### units
```javascript
{
  id: string,              // Firestore doc ID
  unit_id: string,         // "UNIT-{timestamp}"
  lot_id: string,          // Reference to lot
  med_generic: string,
  med_brand: string,
  strength: string,
  form: string,
  ndc: string,
  qty_total: number,
  exp_date: string,        // ISO date
  location_id: string,     // Reference to location
  location_name: string,   // Denormalized
  status: "in_stock"|"partial"|"dispensed"|"expired"|"discarded"|"quarantined",
  qr_code_value: string,   // JSON string
  created_at: Timestamp,
  updated_at: Timestamp
}
```

#### transactions
```javascript
{
  id: string,              // Auto-generated
  unit_id: string,         // Unit reference
  type: "check_in"|"check_out"|"adjust"|"move",
  qty: number,
  by_user_id: string,
  patient_ref: string,     // Optional
  reason_note: string,     // Optional
  timestamp: Timestamp
}
```

#### ndc_formulary
```javascript
{
  id: string,              // NDC number (document ID)
  ndc: string,
  med_generic: string,
  med_brand: string,
  strength: string,
  form: string,
  last_updated: Timestamp
}
```

## API Endpoints

### Backend Routes

| Method | Endpoint | Description | Auth Required |
|--------|----------|-------------|---------------|
| GET | /api/health | Health check | No |
| GET | /api/ndc/:ndc | Lookup NDC in openFDA | No |
| GET | /api/locations | Get all locations | No* |
| POST | /api/locations | Create location | No* |
| GET | /api/lots | Get all lots | No* |
| POST | /api/lots | Create lot | No* |
| GET | /api/units | Get all units | No* |
| GET | /api/units/:unitId | Get unit by ID | No* |
| GET | /api/transactions | Get all transactions | No* |
| GET | /api/ndc-formulary/:ndc | Get from local formulary | No* |
| GET | /api/ndc-formulary/search/:name | Search formulary | No* |

*Note: Auth should be implemented for production

## Security Considerations

### Current State (Development)
- Anonymous authentication enabled
- Firestore in test mode (open read/write)
- CORS enabled for all origins
- Environment variables in .env file

### Production Recommendations
```javascript
// Firestore Security Rules
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /{document=**} {
      allow read, write: if request.auth != null;
    }
    
    // Or more granular:
    match /units/{unit} {
      allow read: if request.auth != null;
      allow write: if request.auth != null 
                   && request.auth.token.role == 'admin';
    }
  }
}
```

## Performance Optimizations

### Frontend
- **Memoization**: `useMemo` for expensive calculations (stats)
- **Callback Memoization**: `useCallback` for event handlers
- **Real-time Updates**: Direct Firestore listeners (no polling)
- **Code Splitting**: React.lazy() for route-based splitting (future)

### Backend
- **Connection Pooling**: Firebase Admin SDK handles this
- **Caching**: Consider Redis for frequently accessed data (future)
- **Rate Limiting**: Implement for API endpoints (future)

### Database
- **Indexing**: Create indexes for common queries
- **Denormalization**: location_name stored in units for faster reads
- **Batch Operations**: Used for multi-document updates

## Deployment Architecture

### Development
```
localhost:3000 (React Dev Server)
      ↓
localhost:4000 (Express Server)
      ↓
Firebase (Cloud)
```

### Production (Recommended)
```
Static Hosting (Vercel/Netlify/Firebase Hosting)
      ↓
Node.js Host (Heroku/Railway/Google Cloud Run)
      ↓
Firebase (Cloud)
```

## Technology Stack Summary

| Layer | Technology | Purpose |
|-------|-----------|---------|
| Frontend Framework | React 18 | UI components |
| Language | TypeScript | Type safety |
| Styling | Tailwind CSS | Utility-first CSS |
| State Management | React Context | Global state |
| Icons | Lucide React | Icon library |
| QR Codes | qrcode package | Label generation |
| Backend Framework | Express | REST API |
| Runtime | Node.js | Server runtime |
| Database | Firestore | NoSQL database |
| Auth | Firebase Auth | Anonymous auth |
| External API | openFDA | Drug information |

## File Structure

```
DaanarRX/
├── client/                    # Frontend (React)
│   ├── public/               # Static assets
│   │   ├── index.html       # HTML template
│   │   └── manifest.json    # PWA manifest
│   ├── src/
│   │   ├── components/      # React components
│   │   │   ├── shared/     # Reusable components
│   │   │   │   ├── Header.tsx
│   │   │   │   ├── StatusBar.tsx
│   │   │   │   ├── Modal.tsx
│   │   │   │   ├── ConfirmModal.tsx
│   │   │   │   └── PrintLabelModal.tsx
│   │   │   └── views/      # Page components
│   │   │       ├── Home.tsx
│   │   │       ├── CheckIn.tsx
│   │   │       ├── CheckOut.tsx
│   │   │       ├── Scan.tsx
│   │   │       ├── Inventory.tsx
│   │   │       ├── Reports.tsx
│   │   │       └── Admin.tsx
│   │   ├── context/        # React Context
│   │   │   └── FirebaseContext.tsx
│   │   ├── firebase/       # Firebase config
│   │   │   └── config.ts
│   │   ├── types/          # TypeScript types
│   │   │   └── index.ts
│   │   ├── App.tsx         # Main component
│   │   ├── index.tsx       # Entry point
│   │   └── index.css       # Global styles
│   ├── package.json        # Frontend dependencies
│   ├── tsconfig.json       # TypeScript config
│   ├── tailwind.config.js  # Tailwind config
│   └── postcss.config.js   # PostCSS config
├── server/                  # Backend (Node.js)
│   ├── index.js            # Express server
│   └── firebase-adminsdk.json # Service account (not in repo)
├── .env                     # Environment variables (not in repo)
├── .env.example            # Example env file
├── .gitignore              # Git ignore rules
├── package.json            # Root dependencies
├── README.md               # Documentation
├── SETUP_GUIDE.md         # Setup instructions
├── GETTING_STARTED.md     # User guide
├── PROJECT_SUMMARY.md     # Project overview
├── ARCHITECTURE.md        # This file
└── CHANGELOG.md           # Version history
```

## Development Workflow

```
1. Edit code
    ↓
2. Save file
    ↓
3. Hot reload (automatic)
    ↓
4. View changes in browser
    ↓
5. Check console for errors
    ↓
6. Test functionality
    ↓
7. Commit changes
```

## Testing Strategy (Recommended)

### Unit Tests
- Component rendering
- Pure functions (calculations, formatting)
- API endpoints

### Integration Tests
- Form submissions
- Data flow (component → API → database)
- Real-time updates

### End-to-End Tests
- Complete user workflows
- Check-in → Scan → Check-out flow
- Report generation

## Monitoring (Future)

Recommended tools:
- **Firebase Analytics**: User behavior tracking
- **Sentry**: Error tracking
- **Firebase Performance Monitoring**: Performance metrics
- **Custom Logging**: Backend request/response logging

---

This architecture provides a solid foundation for a scalable, maintainable pharmaceutical inventory management system.

