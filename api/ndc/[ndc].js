// Vercel serverless function for NDC lookup
const axios = require('axios');

// Helper function to normalize NDC
function normalizeNDC(ndc) {
  const digitsOnly = ndc.replace(/\D/g, '');
  const formats = [ndc, digitsOnly];
  
  if (digitsOnly.length === 11) {
    formats.push(
      `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 9)}-${digitsOnly.slice(9)}`,
      `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}-${digitsOnly.slice(8)}`,
      `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 8)}-${digitsOnly.slice(8)}`
    );
  } else if (digitsOnly.length === 10) {
    formats.push(
      `${digitsOnly.slice(0, 4)}-${digitsOnly.slice(4, 8)}-${digitsOnly.slice(8)}`,
      `${digitsOnly.slice(0, 5)}-${digitsOnly.slice(5, 8)}-${digitsOnly.slice(8)}`
    );
  }
  
  return [...new Set(formats)];
}

module.exports = async (req, res) => {
  // Enable CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  if (req.method !== 'GET') {
    return res.status(405).json({ success: false, message: 'Method not allowed' });
  }

  const { ndc } = req.query;
  
  if (!ndc) {
    return res.status(400).json({ success: false, message: 'NDC parameter is required' });
  }

  console.log(`🔍 NDC Lookup request: ${ndc}`);
  
  try {
    const ndcFormats = normalizeNDC(ndc);
    console.log(`📋 Trying NDC formats:`, ndcFormats);
    
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
          return res.status(200).json({ success: true, data: drugData });
        }
      } catch (err) {
        console.log(`❌ Format ${format} failed, trying next...`);
        continue;
      }
    }
    
    console.log(`⚠️  NDC not found in any format`);
    return res.status(404).json({ 
      success: false, 
      message: `NDC not found. Tried formats: ${ndcFormats.join(', ')}` 
    });
    
  } catch (error) {
    console.error('❌ Error fetching NDC data:', error.message);
    return res.status(500).json({ 
      success: false, 
      message: `Error fetching NDC data: ${error.message}` 
    });
  }
};


