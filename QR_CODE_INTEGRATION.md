# QR Code Database Integration

## ✅ Enhanced QR Code System

The QR codes generated during check-in are now **fully integrated** with the Firebase database and scanning system!

## How It Works

### 1. QR Code Generation (Check-In)

When you add a unit during check-in, a QR code is automatically generated containing:

```json
{
  "u": "UNIT-1699876543210",     // Unit ID (primary key)
  "l": "LOT-45678...",            // Lot ID (first 10 chars)
  "g": "Fluoxetine",              // Generic name
  "s": "20mg",                    // Strength
  "f": "Capsule",                 // Form
  "x": "2025-12-31",              // Expiry date
  "loc": "Shelf A-1"              // Location name
}
```

This JSON data is:
- ✅ Stored in `qr_code_value` field in Firestore
- ✅ Encoded in the printable QR code
- ✅ Used for verification during scanning

### 2. QR Code Scanning (Scan View)

When you scan a QR code, the system:

**Step 1**: Detects QR code with camera
```
Scan QR → Raw data extracted
```

**Step 2**: Parses JSON data
```javascript
try {
  parsedData = JSON.parse(scannedData);
  // Success: It's a DaanaRX QR code!
} catch {
  // Not JSON: Treat as plain Unit ID
}
```

**Step 3**: Searches database (two strategies)
```
Strategy 1: Search by unit_id (from parsedData.u)
  ↓
If not found:
  ↓
Strategy 2: Search by qr_code_value (full JSON string)
```

**Step 4**: Displays unit details
```
Found! → Show medication info, quantity, status, location
```

## Database Fields

### units Collection

Each unit document contains:

| Field | Type | Description | Example |
|-------|------|-------------|---------|
| `unit_id` | string | Unique identifier | `"UNIT-1699876543210"` |
| `qr_code_value` | string | Full QR JSON data | `"{\"u\":\"UNIT-...\",\"g\":...}"` |
| `med_generic` | string | Generic drug name | `"Fluoxetine"` |
| `med_brand` | string | Brand name | `"Prozac"` |
| `strength` | string | Drug strength | `"20mg"` |
| `form` | string | Dosage form | `"Capsule"` |
| `qty_total` | number | Quantity | `30` |
| `exp_date` | string | Expiry date | `"2025-12-31"` |
| `location_id` | string | Location ref | `"loc123"` |
| `location_name` | string | Location name | `"Shelf A-1"` |
| `status` | string | Current status | `"in_stock"` |

### Indexed Fields for Fast Lookup

To optimize searching:

1. **Primary Index**: `unit_id`
   - Fastest lookup
   - Direct match

2. **Secondary Index**: `qr_code_value`
   - Fallback for full QR scan
   - Handles edge cases

## Search Logic Flow

```
┌─────────────────────────────────────┐
│  User scans QR code                 │
└──────────────┬──────────────────────┘
               │
               ▼
      ┌────────────────┐
      │  Parse QR data │
      └────┬───────────┘
           │
           ├─── Is JSON? ────┐
           │                  │
          Yes                No
           │                  │
           ▼                  ▼
    ┌─────────────┐    ┌──────────────┐
    │ Extract     │    │ Use as plain │
    │ unit_id     │    │ Unit ID      │
    └──────┬──────┘    └──────┬───────┘
           │                  │
           └──────────┬───────┘
                      │
                      ▼
           ┌────────────────────┐
           │ Search by unit_id  │
           └──────┬─────────────┘
                  │
            ┌─────┴─────┐
           Found?        Not Found
            │               │
            ▼               ▼
      ┌─────────┐    ┌──────────────────┐
      │ Display │    │ If QR: Search by│
      │ Unit    │    │ qr_code_value    │
      └─────────┘    └──────┬───────────┘
                             │
                        ┌────┴────┐
                       Found?     Not Found
                        │           │
                        ▼           ▼
                   ┌────────┐  ┌─────────┐
                   │Display │  │ Error   │
                   │ Unit   │  │ Message │
                   └────────┘  └─────────┘
```

## Usage Examples

### Example 1: Scanning Generated Label

**Scenario**: You just checked in a unit and printed the label

1. Go to **Scan / Lookup**
2. Click **"Scan QR Code with Camera"**
3. Point at printed label
4. QR code scans: 
   ```json
   {"u":"UNIT-1699876543210","g":"Fluoxetine","s":"20mg","f":"Capsule","x":"2025-12-31","loc":"Shelf A-1"}
   ```
5. System extracts: `unit_id = "UNIT-1699876543210"`
6. Searches database by `unit_id`
7. **Found!** Displays full unit details

**Console Output**:
```
📱 Parsed QR code data: {u: "UNIT-1699876543210", g: "Fluoxetine", ...}
✅ Using Unit ID from QR code: UNIT-1699876543210
✅ QR code verified!
   Generic: Fluoxetine
   Strength: 20mg
   Form: Capsule
   Expires: 2025-12-31
   Location: Shelf A-1
   Found unit: Fluoxetine
```

### Example 2: Manual Unit ID Entry

**Scenario**: You type in a Unit ID

1. Go to **Scan / Lookup**
2. Type: `UNIT-1699876543210`
3. Click **Lookup**
4. System treats as plain Unit ID
5. Searches database by `unit_id`
6. **Found!** Displays unit details

**Console Output**:
```
🔍 Treating as plain Unit ID: UNIT-1699876543210
```

### Example 3: Scanning Non-DaanaRX Barcode

**Scenario**: You scan an NDC barcode in Scan view

1. Go to **Scan / Lookup**
2. Scan NDC: `0071057023`
3. System tries to parse as JSON → Fails (not JSON)
4. Treats as plain Unit ID
5. Searches database → Not found (NDC ≠ Unit ID)
6. **Not Found** message

**Console Output**:
```
🔍 Treating as plain Unit ID: 0071057023
Unit ID "0071057023" not found.
```

## Benefits of This Integration

### 1. Fast Lookup ⚡
- Direct database query by `unit_id`
- No need to scan all records
- Sub-second response time

### 2. Data Verification ✅
- QR code contains unit data
- Verified against database
- Prevents label swapping

### 3. Offline Capability 📱
- QR code shows key info even offline
- Can verify medication details without database
- Database sync when online

### 4. Dual Search Strategy 🔄
- Primary: Search by `unit_id` (fastest)
- Fallback: Search by full `qr_code_value`
- Handles edge cases gracefully

### 5. Rich Logging 📊
- Console shows what was scanned
- Verification status
- Debug information

## Testing

### Test the Complete Flow

**1. Check In a Unit**:
```
Check In → Create Lot → Add Unit
  ↓
Enter: Fluoxetine 20mg Capsule, Qty: 30
  ↓
Generate Label (QR code created)
  ↓
QR contains: {"u":"UNIT-...", "g":"Fluoxetine", ...}
  ↓
Saved to Firebase: qr_code_value field
```

**2. Scan the Label**:
```
Scan/Lookup → Click Camera → Scan QR
  ↓
QR detected: {"u":"UNIT-...", ...}
  ↓
Parse JSON → Extract unit_id
  ↓
Query Firebase: where('unit_id', '==', extractedId)
  ↓
Found! Display unit details
```

**3. Verify in Console**:
```
Open DevTools (F12) → Console tab
See:
  📱 Parsed QR code data
  ✅ Using Unit ID from QR code
  ✅ QR code verified!
  ✅ Found unit: [medication name]
```

## Firebase Indexing

For optimal performance, create these indexes in Firebase Console:

### Composite Index (Optional)
```
Collection: units
Fields:
  - unit_id (Ascending)
  - status (Ascending)
```

### Single Field Indexes
```
Collection: units
Fields:
  - unit_id
  - qr_code_value
  - status
  - exp_date
```

**To create**:
1. Go to Firebase Console
2. Firestore Database → Indexes
3. Click "Create Index"
4. Add fields above

## Security Considerations

### Data in QR Code
- ✅ No PHI (Protected Health Information)
- ✅ Only medication and inventory data
- ✅ Can be displayed publicly
- ✅ Unit ID is system-generated (random)

### Database Security
- ✅ Firestore rules control access
- ✅ Only authenticated users can read
- ✅ Audit trail via transactions collection

## Troubleshooting

### QR Code Won't Scan

**Problem**: Camera detects QR but lookup fails

**Solutions**:
1. Check console for error messages
2. Verify QR code is from DaanaRX (should be JSON)
3. Ensure `unit_id` in QR matches database
4. Check Firestore rules allow read access

### Unit Not Found After Scan

**Problem**: QR scans but says "not found"

**Possible Causes**:
1. Unit was deleted from database
2. QR code from different Firebase project
3. Database connection issue

**Debug Steps**:
```javascript
// Check console:
📱 Parsed QR code data: {...}
✅ Using Unit ID from QR code: UNIT-xxx
🔄 Trying QR code value search...
```

If you see the fallback search, the `unit_id` might not match exactly.

### Console Errors

**Error**: `Permission denied`
- **Fix**: Update Firestore security rules

**Error**: `Field not indexed`
- **Fix**: Create index in Firebase Console

## Future Enhancements

Potential improvements:
- [ ] Add timestamp to QR for version control
- [ ] Include batch number in QR data
- [ ] QR code signature for tamper detection
- [ ] Support for multiple QR formats
- [ ] Offline QR verification mode
- [ ] QR code regeneration if damaged

## Summary

✅ **QR codes are stored** in Firebase (`qr_code_value` field)  
✅ **Scanning is integrated** with database lookup  
✅ **Dual search strategy** for reliability  
✅ **JSON parsing** extracts unit_id automatically  
✅ **Rich logging** for debugging  
✅ **Fast performance** with indexed queries  

Your QR code system is now **fully integrated** with the database! 🎉📱🔍

