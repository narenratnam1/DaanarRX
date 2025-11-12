# QR Code Complete Workflow

## 🔄 End-to-End QR Code Flow

This document shows the complete journey of a QR code from generation to scanning.

---

## Part 1: Check-In & QR Generation

### Step 1: Enter Drug Information
```
┌────────────────────────────────────┐
│  CHECK IN                          │
├────────────────────────────────────┤
│  Step 2: Add Units to Lot          │
│                                    │
│  Generic Name: Fluoxetine          │
│  Strength:     20mg                │
│  Form:         Capsule             │
│  Quantity:     30                  │
│  Expires:      2025-12-31          │
│  Location:     Shelf A-1           │
│                                    │
│  [ Add Unit ]                      │
└────────────────────────────────────┘
```

### Step 2: QR Code Generated
```javascript
// In CheckIn.tsx
const qrData = JSON.stringify({
  u: "UNIT-1699876543210",      // Unique Unit ID
  l: "LOT-45678",                // Lot reference
  g: "Fluoxetine",               // Generic name
  s: "20mg",                     // Strength
  f: "Capsule",                  // Form
  x: "2025-12-31",               // Expiry
  loc: "Shelf A-1"               // Location
});

// Generate QR code image
QRCode.toDataURL(qrData, { width: 300 });
```

### Step 3: Saved to Database
```javascript
// Firestore document created
{
  unit_id: "UNIT-1699876543210",
  qr_code_value: "{\"u\":\"UNIT-1699876543210\",\"g\":\"Fluoxetine\",...}",
  med_generic: "Fluoxetine",
  med_brand: "Prozac",
  strength: "20mg",
  form: "Capsule",
  qty_total: 30,
  exp_date: "2025-12-31",
  location_id: "loc123",
  location_name: "Shelf A-1",
  status: "in_stock",
  lot_id: "LOT-45678...",
  check_in_date: "2025-11-12",
  // ... more fields
}
```

### Step 4: Label Printed
```
┌───────────────────────────┐
│  DaanaRX Inventory        │
│                           │
│  Fluoxetine 20mg Capsule  │
│  Qty: 30                  │
│  Exp: 2025-12-31          │
│  Loc: Shelf A-1           │
│                           │
│   ┌─────────────────┐     │
│   │  █▀▀▀█ ▄▄▀█ █   │     │
│   │  █   █ ▀ ▄▀ █   │     │  ← QR Code
│   │  █▄▄▄█ █▀█ ▀█   │     │     (JSON data)
│   │  ▄▄▄▄▄ ▄ ▄▀ ▄   │     │
│   └─────────────────┘     │
│                           │
│  UNIT-1699876543210       │
└───────────────────────────┘
```

---

## Part 2: Scanning & Lookup

### Step 1: Open Scanner
```
┌────────────────────────────────────┐
│  SCAN / LOOKUP                     │
├────────────────────────────────────┤
│  [Unit ID Input]      [Lookup]     │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  📷 Scan QR Code with Camera │  │
│  └──────────────────────────────┘  │
│      ↑                             │
│  Click this button                 │
└────────────────────────────────────┘
```

### Step 2: Camera Activated
```
┌────────────────────────────────────┐
│  Scan QR Code / Barcode            │
├────────────────────────────────────┤
│                                    │
│  ┌────────────────────────────┐   │
│  │  📹 Live Camera Feed       │   │
│  │                            │   │
│  │     ┌──────────────┐       │   │
│  │     │  Detection   │       │   │  ← Scanning frame
│  │     │    Frame     │       │   │
│  │     └──────────────┘       │   │
│  │                            │   │
│  └────────────────────────────┘   │
│                                    │
│  Point at QR code...               │
│                                    │
│  [ Close ]                         │
└────────────────────────────────────┘
```

### Step 3: QR Code Detected
```javascript
// In BarcodeScanner.tsx
onScan(result.getText());
// Returns: "{\"u\":\"UNIT-1699876543210\",\"g\":\"Fluoxetine\",\"s\":\"20mg\",...}"
```

### Step 4: Data Parsed
```javascript
// In Scan.tsx - handleScanLookup()
const scannedData = scanInput.trim();

try {
  // Try to parse as JSON
  const parsedData = JSON.parse(scannedData);
  
  console.log('📱 Parsed QR code data:', parsedData);
  // Output:
  // {
  //   u: "UNIT-1699876543210",
  //   l: "LOT-45678",
  //   g: "Fluoxetine",
  //   s: "20mg",
  //   f: "Capsule",
  //   x: "2025-12-31",
  //   loc: "Shelf A-1"
  // }
  
  // Extract unit_id
  const unitId = parsedData.u;
  console.log('✅ Using Unit ID from QR code:', unitId);
  
} catch {
  console.log('🔍 Not a QR code, treating as plain Unit ID');
}
```

### Step 5: Database Query
```javascript
// Search Firebase
const q = query(
  collection(db, 'units'), 
  where('unit_id', '==', 'UNIT-1699876543210')
);
const snapshot = await getDocs(q);

// If not found by unit_id, try qr_code_value
if (snapshot.empty) {
  const q2 = query(
    collection(db, 'units'), 
    where('qr_code_value', '==', scannedData)
  );
  const snapshot2 = await getDocs(q2);
}
```

### Step 6: Results Displayed
```
┌────────────────────────────────────┐
│  Fluoxetine 20mg Capsule           │
├────────────────────────────────────┤
│                                    │
│  Qty Remaining:  30                │
│  Status:         In Stock          │
│  Expires:        2025-12-31        │
│  Location:       Shelf A-1         │
│                                    │
│  ┌──────────────────────────────┐  │
│  │  ✓ Check Out This Item       │  │
│  └──────────────────────────────┘  │
│                                    │
│  [ Move (Not Implemented) ]        │
│  [ Adjust (Not Implemented) ]      │
│  [ View History (Not Impl.) ]      │
│                                    │
└────────────────────────────────────┘
```

---

## Complete Data Flow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                     CHECK-IN FLOW                            │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  User enters drug info   │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Generate Unit ID        │
              │  "UNIT-1699876543210"    │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Create QR JSON data     │
              │  {u: "UNIT-...", ...}    │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Generate QR code image  │
              │  (using qrcode library)  │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Save to Firebase:       │
              │  - unit_id               │
              │  - qr_code_value (JSON)  │
              │  - med_generic           │
              │  - strength              │
              │  - form                  │
              │  - qty_total             │
              │  - exp_date              │
              │  - location_id           │
              │  - status                │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Display print modal     │
              │  with QR code label      │
              └──────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                      SCANNING FLOW                           │
└─────────────────────────────────────────────────────────────┘
                            │
                            ▼
              ┌──────────────────────────┐
              │  User clicks camera btn  │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Request camera access   │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Start video stream      │
              │  (BrowserMultiFormatRdr) │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Detect QR code          │
              │  Extract text            │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Pass to onScan handler  │
              │  scanInput = QR data     │
              └────────────┬─────────────┘
                           │
                           ▼
              ┌──────────────────────────┐
              │  Try parse as JSON       │
              └────┬──────────────┬──────┘
                   │              │
                 Success         Fail
                   │              │
                   ▼              ▼
        ┌──────────────┐    ┌──────────┐
        │ Extract u:   │    │ Use as   │
        │ (unit_id)    │    │ plain ID │
        └──────┬───────┘    └────┬─────┘
               │                 │
               └────────┬────────┘
                        │
                        ▼
          ┌────────────────────────────┐
          │  Query Firebase:           │
          │  where('unit_id', '==', x) │
          └────────────┬───────────────┘
                       │
                  ┌────┴────┐
                Found       Not Found
                  │            │
                  │            ▼
                  │    ┌───────────────┐
                  │    │ If QR: Try    │
                  │    │ qr_code_value │
                  │    └───────┬───────┘
                  │            │
                  │       ┌────┴────┐
                  │     Found    Not Found
                  │       │          │
                  └───┬───┘          │
                      │              │
                      ▼              ▼
            ┌──────────────┐   ┌─────────┐
            │ Load unit    │   │ Show    │
            │ data from    │   │ "Not    │
            │ Firebase     │   │ Found"  │
            └──────┬───────┘   └─────────┘
                   │
                   ▼
            ┌──────────────┐
            │ Display unit │
            │ details with │
            │ check-out    │
            │ option       │
            └──────────────┘
```

---

## Real-World Usage Example

### Scenario: Pharmacist checks in new stock

**9:00 AM** - Receive shipment
```
📦 New shipment arrives:
   - Fluoxetine 20mg Capsules x100 bottles
```

**9:05 AM** - Check In
```
1. Open DaanaRX → Check In
2. Create new lot: "LOT-45678"
3. For each bottle:
   - Scan NDC with camera: 0071057023
   - System fills: Fluoxetine 20mg Capsule
   - Enter qty: 30
   - Enter expiry: 2025-12-31
   - Select location: Shelf A-1
   - Click "Add Unit"
   - Print QR label
   - Stick label on bottle
```

**9:30 AM** - Stock bottles on shelf
```
📍 Place on Shelf A-1
🏷️  Each bottle now has DaanaRX QR label
```

**2:00 PM** - Pharmacist needs to dispense
```
1. Open DaanaRX → Scan/Lookup
2. Click "Scan QR Code with Camera"
3. Scan bottle's QR label
4. System shows:
   ✓ Fluoxetine 20mg Capsule
   ✓ Qty: 30 (full bottle)
   ✓ Expires: 2025-12-31
   ✓ Location: Shelf A-1
5. Click "Check Out This Item"
6. Enter qty to dispense: 15
7. Complete check-out
```

**2:01 PM** - Bottle updated
```
Database now shows:
   ✓ Qty: 15 (partial bottle)
   ✓ Status: "partial"
   ✓ Same QR code still valid
```

**4:00 PM** - Need to find that bottle again
```
1. Scan same QR label
2. System shows:
   ✓ Fluoxetine 20mg Capsule
   ✓ Qty: 15 (updated!)
   ✓ Status: Partial
3. Can dispense remaining 15
```

---

## Technical Implementation Details

### QR Data Structure

**Why JSON?**
- Compact yet readable
- Self-describing
- Easy to parse
- Extensible

**Field Abbreviations** (save space):
- `u` = unit_id (unique)
- `l` = lot_id (first 10 chars)
- `g` = generic name
- `s` = strength
- `f` = form
- `x` = expiry (x = expires)
- `loc` = location

**Size**: ~150-200 bytes
**QR Version**: 3-4 (29x29 to 33x33 modules)
**Error Correction**: Medium (15%)

### Database Queries

**Query 1**: By unit_id (fastest)
```javascript
query(collection(db, 'units'), where('unit_id', '==', unitId))
```
- Uses primary index
- O(log n) lookup
- Sub-100ms response

**Query 2**: By qr_code_value (fallback)
```javascript
query(collection(db, 'units'), where('qr_code_value', '==', qrJson))
```
- Full string match
- Slower but reliable
- Handles edge cases

### Performance Metrics

| Step | Time |
|------|------|
| QR generation | 50-100ms |
| Camera startup | 500-1000ms |
| QR detection | 500-2000ms |
| JSON parsing | <1ms |
| Database query | 50-200ms |
| **Total scan-to-display** | **1-3 seconds** |

---

## Troubleshooting Guide

### Issue 1: QR Won't Generate
**Symptoms**: No QR code in print modal
**Causes**: 
- Missing unit_id
- QRCode library not loaded
**Fix**: Check browser console for errors

### Issue 2: QR Won't Scan
**Symptoms**: Camera works but doesn't detect QR
**Causes**:
- Poor lighting
- Damaged print
- Wrong barcode format
**Fix**: 
- Improve lighting
- Reprint label
- Ensure using DaanaRX label

### Issue 3: Scans But Not Found
**Symptoms**: QR scans but says "Unit not found"
**Causes**:
- Unit deleted from database
- Different Firebase project
- Typo in unit_id
**Fix**: 
- Check console: see extracted unit_id
- Verify in Firebase Console
- Regenerate label if needed

### Issue 4: Wrong Unit Displayed
**Symptoms**: Scans show different medication
**Causes**:
- Labels swapped
- Database entry error
**Fix**:
- Verify label matches bottle
- Check database consistency
- Reprint correct label

---

## Summary

✅ **QR codes generated** during check-in  
✅ **Stored in Firebase** (`qr_code_value` field)  
✅ **Scanned by camera** in Scan view  
✅ **Parsed as JSON** to extract unit_id  
✅ **Queried from database** with two strategies  
✅ **Displayed instantly** with full details  

**Result**: Fast, accurate, hands-free inventory lookup! 🎉

