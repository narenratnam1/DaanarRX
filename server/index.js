const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');

// Load environment variables
dotenv.config();

const app = express();
const PORT = process.env.PORT || 4000;

// Middleware
app.use(cors());
app.use(express.json());

console.log('✅ Server initialized successfully');
console.log('ℹ️  Note: Using client-side Firebase SDK. All database operations will be handled by the frontend.');

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', message: 'DaanaRX API is running' });
});

// Helper function to normalize NDC
function normalizeNDC(ndc) {
  // Remove all non-digit characters
  const digitsOnly = ndc.replace(/\D/g, '');
  
  // Return various formats to try
  const formats = [
    ndc, // Original format
    digitsOnly, // All digits
  ];
  
  // Try common NDC formats: 5-4-2, 5-3-2, 4-4-2
  if (digitsOnly.length === 11) {
    formats.push(
      `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 9)}-${digitsOnly.slice(9)}`, // 5-4-2
      `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}-${digitsOnly.slice(8)}`, // 5-3-2
      `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 8)}-${digitsOnly.slice(8)}`  // 4-4-2
    );
  } else if (digitsOnly.length === 10) {
    formats.push(
      `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 8)}-${digitsOnly.slice(8)}`, // 4-4-2
      `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}-${digitsOnly.slice(8)}`  // 5-3-2
    );
  }
  
  return [...new Set(formats)]; // Remove duplicates
}

// NDC Lookup endpoint (proxy to openFDA API with fuzzy matching)
app.get('/api/ndc/:ndc', async (req, res) => {
  const { ndc } = req.params;
  const axios = require('axios');
  
  console.log(`🔍 NDC Lookup request: ${ndc}`);
  
  try {
    const ndcFormats = normalizeNDC(ndc);
    console.log(`📋 Trying NDC formats:`, ndcFormats);
    
    // Try each format
    for (const format of ndcFormats) {
      try {
        const searchUrl = `https://api.fda.gov/drug/ndc.json?search=product_ndc:"${format}"&limit=1`;
        console.log(`🌐 Trying: ${searchUrl}`);
        
        const response = await axios.get(searchUrl, { timeout: 4000 });
        
        if (response.data.results && response.data.results.length > 0) {
          const drug = response.data.results[0];
          const drugData = {
            genericName: drug.generic_name || 'N/A',
            brandName: drug.brand_name || 'N/A',
            form: drug.dosage_form || 'N/A',
            strength: drug.active_ingredients?.[0]?.strength || 'N/A',
            ndc: format
          };
          console.log(`✅ Found drug: ${drugData.brandName}`);
          return res.json({ success: true, data: drugData });
        }
      } catch (err) {
        // Continue to next format
        console.log(`❌ Format ${format} failed, trying next...`);
        continue;
      }
    }
    
    // If we get here, none of the formats worked
    console.log(`⚠️  NDC not found in any format`);
    res.status(404).json({ 
      success: false, 
      message: `NDC not found. Tried formats: ${ndcFormats.join(', ')}` 
    });
    
  } catch (error) {
    console.error('❌ Error fetching NDC data:', error.message);
    res.status(500).json({ 
      success: false, 
      message: `Error fetching NDC data: ${error.message}` 
    });
  }
});

// Unit ID Lookup endpoint (returns unit information for preview)
app.get('/api/unit/:daanaId', async (req, res) => {
  const { daanaId } = req.params;
  
  console.log(`🔍 Daana ID Lookup request: ${daanaId}`);
  
  try {
    // Note: This endpoint is optional since the frontend can query Firebase directly
    // However, it's provided for consistency and potential future backend processing
    res.json({ 
      success: true, 
      message: 'Unit lookup should be handled by frontend Firebase query',
      daanaId: daanaId
    });
  } catch (error) {
    console.error('❌ Error in unit lookup:', error.message);
    res.status(500).json({ 
      success: false, 
      message: `Error looking up unit: ${error.message}` 
    });
  }
});

// Note: Most CRUD operations are handled directly by the frontend via Firebase SDK
// These endpoints are optional and can be removed if not needed

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ success: false, message: 'Something went wrong!' });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on port ${PORT}`);
  console.log(`📡 API available at http://localhost:${PORT}/api`);
});

module.exports = app;

