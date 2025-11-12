# NDC Lookup Testing Guide

## What's Improved

✅ **Fuzzy NDC Matching**: The system now tries multiple NDC formats automatically  
✅ **Better Error Messages**: See exactly what formats were tried  
✅ **Console Logging**: Backend logs show each attempt  
✅ **Local DB Normalization**: Tries with and without dashes  

## How It Works

When you enter an NDC like `0071-0570-23`, the system will:

1. **Check Local Formulary**:
   - Try: `0071-0570-23` (with dashes)
   - Try: `00710570023` (without dashes)

2. **Check openFDA API** (if not in local):
   - Try: `0071-0570-23` (original)
   - Try: `00710570023` (all digits)
   - Try: `00071-0570-23` (5-4-2 format)
   - Try: `00071-057-023` (5-3-2 format)
   - Try: `0071-0570-023` (4-4-2 format)

## Test NDCs

Try these real NDCs from openFDA:

### Working Examples
| NDC | Drug | Format |
|-----|------|--------|
| `0071-0570-23` | Prozac (Fluoxetine 20mg) | With dashes |
| `00710570023` | Prozac (Fluoxetine 20mg) | Without dashes |
| `0777-3105-02` | Lisinopril 10mg | With dashes |
| `0093-0058-01` | Amoxicillin 500mg | With dashes |
| `0378-6159-93` | Metformin 500mg | With dashes |
| `0591-0405-01` | Atorvastatin 20mg | With dashes |

### Testing Different Formats

**Same drug, different formats** (all should work):
- `0071-0570-23`
- `00710570023`
- `71-570-23`
- `71057023`

## Viewing Logs

### Backend Logs (Terminal)
The backend will show:
```
🔍 NDC Lookup request: 0071-0570-23
📋 Trying NDC formats: [ '0071-0570-23', '00710570023', ... ]
🌐 Trying: https://api.fda.gov/drug/ndc.json?search=product_ndc:"0071-0570-23"&limit=1
✅ Found drug: Prozac
```

### Frontend Status
The UI will show:
- `🔍 Searching Local DB...`
- `🌐 Searching openFDA (trying multiple formats)...`
- `✅ Found: Prozac (openFDA)`
- Or: `❌ NDC not found. Tried formats: ...`

## Testing Steps

### 1. Test Valid NDC
1. Go to **Check In**
2. Click **NDC Lookup** section
3. Enter: `0071-0570-23`
4. Click **Lookup**
5. Should auto-fill: Fluoxetine, Prozac, etc.

### 2. Test Without Dashes
1. Enter: `00710570023`
2. Click **Lookup**
3. Should work the same!

### 3. Test Invalid NDC
1. Enter: `9999-9999-99`
2. Click **Lookup**
3. Should show error and fallback search options

### 4. Test Backend Directly

Open in browser or curl:
```bash
curl http://localhost:5000/api/ndc/0071-0570-23
```

Should return:
```json
{
  "success": true,
  "data": {
    "genericName": "FLUOXETINE HYDROCHLORIDE",
    "brandName": "Prozac",
    "form": "CAPSULE",
    "strength": "20 mg/1",
    "ndc": "0071-0570-23"
  }
}
```

## Common Issues

### "NDC not found"
- The NDC might not be in openFDA database
- Try a different format
- Use the fallback "Search by name" option
- Or click "Enter Manually Instead"

### Backend timeout
- openFDA API might be slow
- Wait 5-10 seconds
- Check your internet connection
- Check backend terminal for errors

### No response
- Make sure backend is running (`npm run server`)
- Check http://localhost:5000/api/health
- Look for CORS errors in browser console

## Debugging Tips

### Check Backend Status
```bash
# Is backend running?
curl http://localhost:5000/api/health

# Should return:
{"status":"ok","message":"DaanaRX API is running"}
```

### Test NDC Directly
```bash
# Test with curl
curl http://localhost:5000/api/ndc/0071-0570-23

# Or in browser
http://localhost:5000/api/ndc/0071-0570-23
```

### Check Browser Console
1. Open DevTools (F12)
2. Go to Console tab
3. Enter an NDC and click Lookup
4. Look for:
   - Fetch requests to `/api/ndc/...`
   - Error messages
   - Network failures

### Check Backend Terminal
The backend logs every attempt:
- `🔍` = Received request
- `📋` = Formats being tried
- `🌐` = API call being made
- `✅` = Success!
- `❌` = Format failed, trying next
- `⚠️` = None worked

## Performance Notes

- Local DB lookup: ~50-100ms
- openFDA API: 500-2000ms
- Multiple format attempts: May take up to 5 seconds
- Results are cached in local formulary after first lookup

## Next Steps

After successful lookup:
1. Fields auto-fill with drug info
2. Enter quantity
3. Select expiry date
4. Choose location
5. Click "Add Unit"

## Need More Help?

- See browser console for detailed errors
- See backend terminal for API logs
- Check openFDA status: https://open.fda.gov/apis/
- Try the fallback search by drug name

