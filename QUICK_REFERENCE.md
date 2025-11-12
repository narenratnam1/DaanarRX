# DaanaRX Quick Reference Card

## Commands

### Development
```bash
npm run dev           # Start both servers
npm run server        # Backend only (port 5000)
npm run client        # Frontend only (port 3000)
npm run install-all   # Install all dependencies
```

### Production
```bash
npm run build         # Build frontend for production
npm start            # Start production server
```

## URLs

- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000/api
- **Health Check**: http://localhost:5000/api/health

## Keyboard Shortcuts

### Global
- `Ctrl+F` or `Cmd+F` - Search (in tables)
- `Tab` - Navigate between fields
- `Enter` - Submit forms

### With Barcode Scanner
- Scan into NDC input field (Check-In view)
- Scan into Unit ID field (Check-Out, Scan views)

## Common Workflows

### Initial Setup
1. **Admin** → Add location (e.g., "Shelf A-1")
2. Repeat for all storage areas

### Daily Check-In
1. **Check In** → Create Lot
2. Fill: Date, Source/Donor
3. **Add Unit** → Scan or enter NDC
4. Fill: Quantity, Expiry, Location
5. **Print Label** or click Done

### Quick Checkout
1. **Scan** → Enter Unit ID
2. View details → **Check Out This Item**
3. Enter quantity and patient ref
4. Submit

### End-of-Day Reports
1. **Reports** → Set date range
2. Review transactions
3. **Export CSV** for records

## Status Indicators

| Status | Meaning |
|--------|---------|
| `in_stock` | Full quantity available |
| `partial` | Some quantity dispensed |
| `dispensed` | Completely dispensed |
| `quarantined` | Flagged for review |
| `expired` | Past expiration date |
| `discarded` | Removed from inventory |

## Data Entry Tips

### NDC Format
- Standard: `0000-0000-00`
- Examples:
  - `0071-0570-23` (Prozac)
  - `0777-3105-02` (Lisinopril)

### Patient Reference
- No PHI (Protected Health Information)
- Use codes like: `JAX-2025-001`
- Format: `[SITE]-[YEAR]-[NUMBER]`

### Expiry Dates
- Always use calendar picker
- Format: `YYYY-MM-DD`
- System warns 90 days before expiration

## API Endpoints

### Health Check
```bash
GET /api/health
```

### NDC Lookup
```bash
GET /api/ndc/0071-0570-23
```

### Units
```bash
GET /api/units              # List all
GET /api/units/UNIT-123     # Get specific
```

### Locations
```bash
GET /api/locations          # List all
POST /api/locations         # Create new
Body: { "name": "A-1", "temp_type": "room" }
```

## File Locations

### Configuration
- `.env` - Environment variables
- `server/firebase-adminsdk.json` - Firebase Admin key (secret!)

### Logs
- Browser Console (F12) - Frontend errors
- Terminal - Backend logs

## Troubleshooting

### App Won't Start
```bash
# Check if ports are free
lsof -ti:5000  # Backend
lsof -ti:3000  # Frontend

# Kill processes
kill -9 $(lsof -ti:5000)
kill -9 $(lsof -ti:3000)
```

### Firebase Connection Error
1. Check `.env` file exists
2. Verify `firebase-adminsdk.json` in `server/`
3. Check Firebase console for service status

### Unit Not Found
- Verify Unit ID is correct (starts with "UNIT-")
- Check the unit hasn't been deleted
- Ensure you're using the QR code from the label

### Print Not Working
1. Check browser print dialog appeared
2. Verify printer is connected
3. Try "Print to PDF" first
4. Check browser print settings

### Data Not Updating
1. Refresh the page (F5)
2. Check internet connection
3. Verify Firebase is online
4. Check browser console for errors

## Keyboard Shortcuts for Developers

### Browser DevTools
- `Ctrl+Shift+I` or `Cmd+Opt+I` - Open DevTools
- `Ctrl+Shift+C` or `Cmd+Opt+C` - Inspect element
- `Ctrl+Shift+J` or `Cmd+Opt+J` - Open console

### VS Code
- `Ctrl+P` or `Cmd+P` - Quick file open
- `Ctrl+Shift+P` or `Cmd+Shift+P` - Command palette
- `Ctrl+`` or `Cmd+`` - Toggle terminal

## Important Files

| File | Purpose |
|------|---------|
| `README.md` | Full documentation |
| `SETUP_GUIDE.md` | Setup instructions |
| `GETTING_STARTED.md` | User guide |
| `ARCHITECTURE.md` | Technical architecture |
| `DEPLOYMENT.md` | Deployment guide |
| `CHANGELOG.md` | Version history |

## CSV Export Format

### Inventory Export
```
Medication, Unit ID, Qty, Status, Location, Expires, NDC
"Fluoxetine 20mg Capsule", UNIT-123, 30, in_stock, A-1, 2025-12-31, 0071-0570-23
```

### Transaction Export
```
Timestamp, Type, Unit ID, Qty, Patient Ref, Notes
"2024-11-12 10:30:00", check_out, UNIT-123, 10, JAX-001, "Provider dispense"
```

## Default Test Data

### Test NDCs
- `0071-0570-23` - Prozac (Fluoxetine 20mg)
- `0777-3105-02` - Lisinopril 10mg
- `0093-0058-01` - Amoxicillin 500mg

### Sample Patient Refs
- `CLINIC-2024-001`
- `ER-2024-045`
- `FLOOR2-2024-089`

## FEFO (First Expired, First Out)

The system automatically:
1. Checks for older units when checking out
2. Warns if a unit with earlier expiry exists
3. Allows override with confirmation

**Best Practice**: Always use the oldest stock first!

## Security Best Practices

### Development
- ✅ Use test mode for Firestore
- ✅ Keep `.env` in `.gitignore`
- ✅ Use localhost for testing

### Production
- ✅ Enable Firestore security rules
- ✅ Use environment variables
- ✅ Enable HTTPS
- ✅ Regular backups
- ✅ Monitor access logs

## Performance Tips

### For Best Performance
- Close unused browser tabs
- Clear browser cache regularly
- Use latest Chrome/Firefox/Safari
- Ensure stable internet connection
- Keep only necessary data in Firestore

### Optimize Database
- Archive old transactions quarterly
- Remove expired units after review
- Keep location list under 50 items
- Regular data cleanup

## Support Resources

### Documentation
- 📚 README.md - Start here
- 🚀 GETTING_STARTED.md - User guide  
- 🔧 SETUP_GUIDE.md - Installation
- 🏗️ ARCHITECTURE.md - Technical details

### Online Resources
- Firebase Docs: https://firebase.google.com/docs
- React Docs: https://react.dev
- Tailwind CSS: https://tailwindcss.com/docs

### Getting Help
1. Check documentation files
2. Review error messages in console
3. Search Stack Overflow
4. Check Firebase status page
5. Review GitHub issues

## Keyboard Navigation

| Key | Action |
|-----|--------|
| `Tab` | Next field |
| `Shift+Tab` | Previous field |
| `Enter` | Submit form |
| `Esc` | Close modal |
| `Ctrl+P` | Print (when label modal open) |

## Field Validation

### Required Fields

**Lot Creation:**
- Date Received ✓
- Source/Donor ✓

**Unit Creation:**
- Selected Lot ✓
- Generic Name ✓
- Strength ✓
- Form ✓
- Quantity ✓
- Expiry Date ✓
- Location ✓

**Check Out:**
- Unit ID ✓
- Quantity ✓
- Patient Ref ✓

## Barcode Scanner Setup

### USB Scanner
1. Plug in scanner
2. Test in a text field
3. Adjust scanner settings if needed:
   - Enable "Enter" key after scan
   - Set to keyboard wedge mode

### Bluetooth Scanner
1. Pair with computer
2. Test in text field
3. Same settings as USB

### Scanner Recommendations
- **Budget**: NADAMOO Wireless Barcode Scanner
- **Professional**: Zebra DS2208
- **Mobile**: Phone camera with barcode app

## Unit ID Format

```
UNIT-{timestamp}
Example: UNIT-1699876543210
```

- Always starts with "UNIT-"
- Followed by Unix timestamp
- Unique per unit
- Auto-generated

## QR Code Content

The QR code contains:
```json
{
  "u": "UNIT-123...",      // Unit ID
  "l": "LOT-456...",       // Lot ID (first 10 chars)
  "g": "Fluoxetine",       // Generic name
  "s": "20mg",             // Strength
  "f": "Capsule",          // Form
  "x": "2025-12-31",       // Expiry
  "loc": "A-1"             // Location
}
```

## Common Error Messages

| Error | Solution |
|-------|----------|
| "Unit not found" | Check Unit ID, verify it exists |
| "NDC not found" | Try manual entry |
| "Insufficient quantity" | Check available quantity |
| "Firebase error" | Check internet, verify config |
| "Authentication error" | Refresh page, check Firebase |

## Maintenance Schedule

### Daily
- Review expiring items (Status Bar)
- Check transaction log

### Weekly
- Export inventory CSV
- Review quarantined items

### Monthly
- Update expiring medications
- Archive old transactions
- Review location usage

### Quarterly
- Update security rules
- Review user access
- Backup database

## Version Info

To check versions:
```bash
node --version          # Node.js version
npm --version           # npm version
cat package.json        # App version
```

## Emergency Procedures

### Data Loss
1. Check Firebase Console
2. Restore from backup
3. Review transaction log

### System Down
1. Check Firebase status
2. Verify internet connection
3. Check server logs
4. Contact support

### Incorrect Data
1. Don't delete immediately
2. Mark as quarantined
3. Review in Admin
4. Adjust or delete after review

---

**Quick Tip**: Bookmark this file for instant reference! 📌

**Need More Help?** See the full README.md or GETTING_STARTED.md

