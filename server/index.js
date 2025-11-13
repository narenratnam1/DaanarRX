const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const path = require('path');

// Load environment variables from server directory
dotenv.config({ path: path.join(__dirname, '.env') });

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

// RxNorm API configuration (National Library of Medicine - Free API)
const RXNORM_API_BASE = 'https://rxnav.nlm.nih.gov/REST';

// Generic Drug Name Search endpoint (uses RxNorm API)
app.get('/api/search/generic/:name', async (req, res) => {
  const { name } = req.params;
  const limit = parseInt(req.query.limit) || 25;
  const axios = require('axios');

  console.log(`🔍 Generic drug name search: ${name}`);

  if (!name || name.length < 1) {
    return res.status(400).json({
      success: false,
      message: 'Search term is required'
    });
  }

  try {
    const searchTerm = name.trim();

    // Call RxNorm API for approximate term matching (fuzzy search)
    const approximateUrl = `${RXNORM_API_BASE}/approximateTerm.json`;
    const response = await axios.get(approximateUrl, {
      params: {
        term: searchTerm,
        maxEntries: limit,
        option: 1 // Return only terms from valid RxNorm concepts
      },
      timeout: 5000
    });

    const candidates = response.data?.approximateGroup?.candidate || [];

    // For each candidate, get detailed drug information
    const detailedResults = await Promise.all(
      candidates.slice(0, limit).map(async (candidate) => {
        try {
          const rxcui = candidate.rxcui;
          const score = candidate.score;

          // Get RxNorm concept properties for detailed info
          const propsUrl = `${RXNORM_API_BASE}/rxcui/${rxcui}/properties.json`;
          const propsResponse = await axios.get(propsUrl, { timeout: 3000 });

          const properties = propsResponse.data?.properties;

          return {
            genericName: properties?.name || candidate.term || 'N/A',
            brandName: properties?.synonym || properties?.name || 'N/A',
            form: properties?.tty || 'N/A', // Term Type (e.g., SCD, SBD, GPCK)
            strength: properties?.suppress || 'N/A',
            ndc: 'N/A', // RxNorm doesn't directly provide NDC, would need additional lookup
            rxcui: rxcui,
            score: score,
            source: 'rxnorm'
          };
        } catch (detailError) {
          console.error(`Error fetching details for RXCUI ${candidate.rxcui}:`, detailError.message);
          // Return basic info if detailed fetch fails
          return {
            genericName: candidate.term || 'N/A',
            brandName: candidate.term || 'N/A',
            form: 'N/A',
            strength: 'N/A',
            ndc: 'N/A',
            rxcui: candidate.rxcui,
            score: candidate.score,
            source: 'rxnorm'
          };
        }
      })
    );

    console.log(`✅ Found ${detailedResults.length} matches from RxNorm`);

    return res.json({
      success: true,
      data: detailedResults,
      count: detailedResults.length,
      source: 'rxnorm'
    });

  } catch (error) {
    console.error('❌ Error searching RxNorm:', error.message);

    // Return empty results instead of error to allow graceful degradation
    return res.json({
      success: true,
      data: [],
      count: 0,
      message: `RxNorm search error: ${error.message}`,
      source: 'rxnorm'
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

