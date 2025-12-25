#!/usr/bin/env node

/**
 * DaanaRx Setup Verification Script
 * 
 * This script checks if the development environment is properly configured
 * and provides helpful error messages for common setup issues.
 */

const fs = require('fs');
const path = require('path');

const colors = {
  reset: '\x1b[0m',
  red: '\x1b[31m',
  green: '\x1b[32m',
  yellow: '\x1b[33m',
  blue: '\x1b[34m',
  cyan: '\x1b[36m',
};

function log(message, color = 'reset') {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

function logSection(title) {
  console.log('\n' + '='.repeat(60));
  log(title, 'cyan');
  console.log('='.repeat(60));
}

function logSuccess(message) {
  log(`✓ ${message}`, 'green');
}

function logError(message) {
  log(`✗ ${message}`, 'red');
}

function logWarning(message) {
  log(`⚠ ${message}`, 'yellow');
}

function logInfo(message) {
  log(`ℹ ${message}`, 'blue');
}

let hasErrors = false;
let hasWarnings = false;

// Check Node.js version
logSection('Checking Node.js Version');
const nodeVersion = process.version;
const majorVersion = parseInt(nodeVersion.slice(1).split('.')[0]);

if (majorVersion >= 18) {
  logSuccess(`Node.js ${nodeVersion} is installed (required: 18+)`);
} else {
  logError(`Node.js ${nodeVersion} is too old. Please upgrade to v18 or higher.`);
  logInfo('Visit: https://nodejs.org/');
  hasErrors = true;
}

// Check for node_modules
logSection('Checking Dependencies');
const nodeModulesPath = path.join(__dirname, 'node_modules');

if (fs.existsSync(nodeModulesPath)) {
  logSuccess('node_modules directory exists');
  
  // Check if package-lock.json exists
  const packageLockPath = path.join(__dirname, 'package-lock.json');
  if (fs.existsSync(packageLockPath)) {
    logSuccess('package-lock.json exists');
  } else {
    logWarning('package-lock.json not found');
    logInfo('Run: npm install');
    hasWarnings = true;
  }
} else {
  logError('node_modules directory not found');
  logInfo('Run: npm install');
  hasErrors = true;
}

// Check for .env.local file
logSection('Checking Environment Configuration');
const envLocalPath = path.join(__dirname, '.env.local');
const envExamplePath = path.join(__dirname, 'env-example.txt');

if (fs.existsSync(envLocalPath)) {
  logSuccess('.env.local file exists');
  
  // Read and validate .env.local
  const envContent = fs.readFileSync(envLocalPath, 'utf8');
  const requiredVars = [
    'NEXT_PUBLIC_SUPABASE_URL',
    'NEXT_PUBLIC_SUPABASE_ANON_KEY',
    'SUPABASE_SERVICE_KEY',
    'JWT_SECRET'
  ];
  
  const missingVars = [];
  const placeholderVars = [];
  
  requiredVars.forEach(varName => {
    const regex = new RegExp(`^${varName}=(.*)$`, 'm');
    const match = envContent.match(regex);
    
    if (!match || !match[1].trim()) {
      missingVars.push(varName);
    } else if (match[1].includes('your_') || match[1].includes('here')) {
      placeholderVars.push(varName);
    }
  });
  
  if (missingVars.length > 0) {
    logError(`Missing required environment variables: ${missingVars.join(', ')}`);
    hasErrors = true;
  } else if (placeholderVars.length > 0) {
    logWarning(`These variables still have placeholder values: ${placeholderVars.join(', ')}`);
    logInfo('Please update them with your actual Supabase credentials');
    hasErrors = true;
  } else {
    logSuccess('All required environment variables are set');
  }
  
} else {
  logError('.env.local file not found');
  logInfo(`1. Copy env-example.txt to .env.local`);
  logInfo(`2. Fill in your Supabase credentials from: https://app.supabase.com/`);
  logInfo(`3. Generate JWT_SECRET with: openssl rand -base64 32`);
  hasErrors = true;
}

// Check for Supabase schema file
logSection('Checking Database Setup Files');
const schemaPath = path.join(__dirname, 'supabase-schema.sql');

if (fs.existsSync(schemaPath)) {
  logSuccess('supabase-schema.sql exists');
  logInfo('Make sure you\'ve run this SQL in your Supabase dashboard');
} else {
  logError('supabase-schema.sql not found');
  hasErrors = true;
}

// Check TypeScript configuration
logSection('Checking TypeScript Configuration');
const tsconfigPath = path.join(__dirname, 'tsconfig.json');
const tsconfigServerPath = path.join(__dirname, 'tsconfig.server.json');

if (fs.existsSync(tsconfigPath)) {
  logSuccess('tsconfig.json exists');
} else {
  logError('tsconfig.json not found');
  hasErrors = true;
}

if (fs.existsSync(tsconfigServerPath)) {
  logSuccess('tsconfig.server.json exists');
} else {
  logError('tsconfig.server.json not found');
  hasErrors = true;
}

// Check Next.js configuration
logSection('Checking Next.js Configuration');
const nextConfigPath = path.join(__dirname, 'next.config.js');

if (fs.existsSync(nextConfigPath)) {
  logSuccess('next.config.js exists');
} else {
  logError('next.config.js not found');
  hasErrors = true;
}

// Check for key directories
logSection('Checking Project Structure');
const requiredDirs = [
  'src/app',
  'src/components',
  'src/lib',
  'server/graphql',
  'server/services',
];

requiredDirs.forEach(dir => {
  const dirPath = path.join(__dirname, dir);
  if (fs.existsSync(dirPath)) {
    logSuccess(`${dir}/ exists`);
  } else {
    logError(`${dir}/ not found`);
    hasErrors = true;
  }
});

// Final summary
logSection('Setup Verification Summary');

if (!hasErrors && !hasWarnings) {
  logSuccess('All checks passed! Your environment is ready.');
  console.log('\nNext steps:');
  logInfo('1. Make sure you\'ve run supabase-schema.sql in Supabase dashboard');
  logInfo('2. Start the development servers: npm run dev:all');
  logInfo('3. Open http://localhost:3000 in your browser');
  process.exit(0);
} else if (!hasErrors && hasWarnings) {
  logWarning('Setup is mostly complete, but there are some warnings.');
  logInfo('Review the warnings above and address them if needed.');
  process.exit(0);
} else {
  logError('Setup is incomplete. Please fix the errors above.');
  console.log('\nQuick setup guide:');
  logInfo('1. Run: npm install');
  logInfo('2. Copy env-example.txt to .env.local');
  logInfo('3. Fill in your Supabase credentials');
  logInfo('4. Run this script again: node scripts/verify-setup.js');
  process.exit(1);
}

