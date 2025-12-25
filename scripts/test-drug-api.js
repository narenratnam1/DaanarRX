#!/usr/bin/env node

/**
 * Drug API Integration Test Script
 * 
 * This script tests the drug API service to ensure all endpoints are working correctly.
 * Run with: node scripts/test-drug-api.js
 * Or: npm run test:drug-api
 */

const axios = require('axios');

const BASE_URL = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';

// ANSI color codes for terminal output
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  blue: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testDrugSearch() {
  log('\n📋 Testing Drug Search API...', 'blue');
  
  const testCases = [
    { query: 'ibuprofen', expectedResults: true },
    { query: 'acetaminophen', expectedResults: true },
    { query: 'lisinopril', expectedResults: true },
    { query: 'xyzabc123impossible', expectedResults: false },
  ];

  for (const testCase of testCases) {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/drugs/search?q=${encodeURIComponent(testCase.query)}&limit=5`
      );

      if (response.data.success) {
        const hasResults = response.data.count > 0;
        
        if (hasResults === testCase.expectedResults) {
          log(`  ✓ "${testCase.query}": Found ${response.data.count} result(s)`, 'green');
          
          if (hasResults && response.data.results[0]) {
            const firstResult = response.data.results[0];
            log(`    → ${firstResult.medicationName} (${firstResult.strength}${firstResult.strengthUnit} ${firstResult.form})`, 'reset');
            log(`    → Source: ${firstResult.source}, NDC: ${firstResult.ndcId || 'N/A'}`, 'reset');
          }
        } else {
          log(`  ✗ "${testCase.query}": Unexpected result count`, 'red');
        }
      } else {
        log(`  ✗ "${testCase.query}": API returned error`, 'red');
      }
    } catch (error) {
      log(`  ✗ "${testCase.query}": ${error.message}`, 'red');
    }
  }
}

async function testNDCLookup() {
  log('\n🔍 Testing NDC Lookup API...', 'blue');
  
  const testCases = [
    { ndc: '0573-0164-70', description: 'Advil/Ibuprofen' },
    { ndc: '0093-7214-01', description: 'Lisinopril 10mg' },
    { ndc: '99999-9999-99', description: 'Invalid NDC (should fail)' },
  ];

  for (const testCase of testCases) {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/drugs/ndc?code=${encodeURIComponent(testCase.ndc)}`
      );

      if (response.data.success && response.data.result) {
        const result = response.data.result;
        log(`  ✓ NDC ${testCase.ndc}: ${result.medicationName}`, 'green');
        log(`    → ${result.strength}${result.strengthUnit} ${result.form}`, 'reset');
      } else {
        log(`  ℹ NDC ${testCase.ndc}: Not found (${testCase.description})`, 'yellow');
      }
    } catch (error) {
      if (error.response?.status === 404) {
        log(`  ℹ NDC ${testCase.ndc}: Not found (${testCase.description})`, 'yellow');
      } else {
        log(`  ✗ NDC ${testCase.ndc}: ${error.message}`, 'red');
      }
    }
  }
}

async function testRelatedMedications() {
  log('\n🔗 Testing Related Medications API...', 'blue');
  
  const testCases = [
    { drug: 'lisinopril', description: 'ACE inhibitor' },
    { drug: 'atorvastatin', description: 'Statin' },
    { drug: 'metformin', description: 'Antidiabetic' },
  ];

  for (const testCase of testCases) {
    try {
      const response = await axios.get(
        `${BASE_URL}/api/drugs/related?drug=${encodeURIComponent(testCase.drug)}`
      );

      if (response.data.success) {
        const count = response.data.count || 0;
        
        if (count > 0) {
          log(`  ✓ "${testCase.drug}": Found ${count} related medication(s)`, 'green');
          
          response.data.related.slice(0, 3).forEach(med => {
            log(`    → ${med.name} (${med.relationship})`, 'reset');
            if (med.description) {
              log(`      ${med.description}`, 'reset');
            }
          });
        } else {
          log(`  ℹ "${testCase.drug}": No related medications found`, 'yellow');
          log(`    This is normal for some drugs with limited RxNorm data`, 'yellow');
        }
      } else {
        log(`  ✗ "${testCase.drug}": API returned error`, 'red');
      }
    } catch (error) {
      log(`  ✗ "${testCase.drug}": ${error.message}`, 'red');
    }
  }
}

async function runTests() {
  log('═══════════════════════════════════════════════════', 'blue');
  log('  Drug API Integration Tests', 'blue');
  log('═══════════════════════════════════════════════════', 'blue');
  log(`\nTesting against: ${BASE_URL}`, 'yellow');
  log('\nNote: These tests query live external APIs (OpenFDA, RxNav)');
  log('Results may vary based on API availability and data updates.\n');

  try {
    await testDrugSearch();
    await testNDCLookup();
    await testRelatedMedications();
    
    log('\n═══════════════════════════════════════════════════', 'blue');
    log('  Tests Complete! ✓', 'green');
    log('═══════════════════════════════════════════════════', 'blue');
    log('\nNext steps:');
    log('1. Check the results above for any failures');
    log('2. Test the UI in the browser at /checkin and /inventory');
    log('3. Try searching for drugs and using the barcode scanner');
    log('4. Test the Related Medications feature in inventory filters\n');
    
  } catch (error) {
    log('\n✗ Test suite failed with error:', 'red');
    log(error.message, 'red');
    process.exit(1);
  }
}

// Run tests
runTests().catch(error => {
  log('\n✗ Unexpected error:', 'red');
  console.error(error);
  process.exit(1);
});

