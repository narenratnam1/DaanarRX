import { InventoryFiltersState } from '@/types/inventory';

/**
 * Smart Search Parser
 * Parses natural language queries and converts them into inventory filters
 * 
 * Examples:
 * - "lisinopril expiring next week" → medication filter + expiration window
 * - "10mg at fridge location" → strength filter + location filter
 * - "ndc:12345" → NDC filter
 * - "expired medications" → expiration filter
 * - "metformin 500mg" → medication + strength filter
 */

interface ParsedQuery {
  filters: Partial<InventoryFiltersState>;
  searchTerms: string[];
}

export function parseSmartSearch(query: string): ParsedQuery {
  if (!query || typeof query !== 'string') {
    return { filters: {}, searchTerms: [] };
  }

  const filters: Partial<InventoryFiltersState> = {};
  const searchTerms: string[] = [];
  const lowerQuery = query.toLowerCase().trim();

  // Parse expiration windows
  const expirationPatterns = [
    { pattern: /\bexpired\b|\bhas expired\b/i, window: 'EXPIRED' as const },
    { pattern: /\bexpir(?:ing|es?)?\s+(?:in\s+)?(?:next\s+)?(?:1\s+)?week\b|\bexpir(?:ing|es?)?\s+(?:in\s+)?7\s+days?\b|\bexpir(?:ing|es?)?\s+soon\b/i, window: 'EXPIRING_7_DAYS' as const },
    { pattern: /\bexpir(?:ing|es?)?\s+(?:in\s+)?(?:next\s+)?(?:1\s+)?month\b|\bexpir(?:ing|es?)?\s+(?:in\s+)?30\s+days?\b/i, window: 'EXPIRING_30_DAYS' as const },
    { pattern: /\bexpir(?:ing|es?)?\s+(?:in\s+)?(?:next\s+)?60\s+days?\b|\bexpir(?:ing|es?)?\s+(?:in\s+)?2\s+months?\b/i, window: 'EXPIRING_60_DAYS' as const },
    { pattern: /\bexpir(?:ing|es?)?\s+(?:in\s+)?(?:next\s+)?90\s+days?\b|\bexpir(?:ing|es?)?\s+(?:in\s+)?3\s+months?\b/i, window: 'EXPIRING_90_DAYS' as const },
  ];

  for (const { pattern, window } of expirationPatterns) {
    if (pattern.test(lowerQuery)) {
      filters.expirationWindow = window;
      break;
    }
  }

  // Parse NDC code (format: ndc:12345 or ndc 12345)
  const ndcMatch = lowerQuery.match(/\bndc[:\s]+([0-9-]+)\b/i);
  if (ndcMatch) {
    filters.ndcId = ndcMatch[1];
  }

  // Parse strength (e.g., "10mg", "5 mg", "strength:10")
  const strengthPatterns = [
    /\bstrength[:\s]+(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units?)?\b/i,
    /\b(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units?)\b/i,
  ];

  for (const pattern of strengthPatterns) {
    const strengthMatch = lowerQuery.match(pattern);
    if (strengthMatch) {
      const value = parseFloat(strengthMatch[1]);
      if (!isNaN(value)) {
        // Set both min and max to the same value for exact match
        filters.minStrength = value;
        filters.maxStrength = value;
        
        // If unit is specified, store it
        if (strengthMatch[2]) {
          filters.strengthUnit = strengthMatch[2].toLowerCase();
        }
      }
      break;
    }
  }

  // Parse strength range (e.g., "strength 5-10mg", "between 10 and 20mg")
  const rangeMatch = lowerQuery.match(/\b(?:strength[:\s]+)?(\d+(?:\.\d+)?)\s*(?:-|to|and)\s*(\d+(?:\.\d+)?)\s*(mg|mcg|g|ml|units?)?\b/i);
  if (rangeMatch) {
    const min = parseFloat(rangeMatch[1]);
    const max = parseFloat(rangeMatch[2]);
    if (!isNaN(min) && !isNaN(max)) {
      filters.minStrength = Math.min(min, max);
      filters.maxStrength = Math.max(min, max);
      if (rangeMatch[3]) {
        filters.strengthUnit = rangeMatch[3].toLowerCase();
      }
    }
  }

  // Parse location keywords (e.g., "at fridge", "location:fridge", "room temp")
  const locationPatterns = [
    { pattern: /\b(?:at|in|location[:\s]+)?fridge\b|\bcold\s+storage\b/i, keyword: 'fridge' },
    { pattern: /\b(?:at|in|location[:\s]+)?room\s+temp(?:erature)?\b|\bambient\b/i, keyword: 'room temp' },
  ];

  for (const { pattern, keyword } of locationPatterns) {
    if (pattern.test(lowerQuery)) {
      // Store the location keyword to be matched against actual location names
      searchTerms.push(`location:${keyword}`);
      break;
    }
  }

  // Parse form/type (e.g., "tablets", "capsules", "liquid")
  const formPatterns = [
    /\b(tablet|tablets|tab|tabs)\b/i,
    /\b(capsule|capsules|cap|caps)\b/i,
    /\b(liquid|solution|syrup)\b/i,
    /\b(injection|injectable)\b/i,
    /\b(cream|ointment|gel)\b/i,
  ];

  for (const pattern of formPatterns) {
    const formMatch = lowerQuery.match(pattern);
    if (formMatch) {
      searchTerms.push(`form:${formMatch[1].toLowerCase()}`);
      break;
    }
  }

  // Parse sorting (e.g., "sort by expiry", "order by name")
  const sortPatterns = [
    { pattern: /\bsort(?:ed)?\s+by\s+expir(?:y|ation)?\b/i, sortBy: 'EXPIRY_DATE' as const },
    { pattern: /\bsort(?:ed)?\s+by\s+(?:medication\s+)?name\b/i, sortBy: 'MEDICATION_NAME' as const },
    { pattern: /\bsort(?:ed)?\s+by\s+quantity\b|\bsort(?:ed)?\s+by\s+stock\b/i, sortBy: 'QUANTITY' as const },
    { pattern: /\bsort(?:ed)?\s+by\s+strength\b/i, sortBy: 'STRENGTH' as const },
    { pattern: /\bsort(?:ed)?\s+by\s+(?:created|date)\b/i, sortBy: 'CREATED_DATE' as const },
  ];

  for (const { pattern, sortBy } of sortPatterns) {
    if (pattern.test(lowerQuery)) {
      filters.sortBy = sortBy;
      break;
    }
  }

  // Parse sort order
  if (/\bdescending\b|\bdesc\b|\bnewest\s+first\b|\bhighest\s+first\b/i.test(lowerQuery)) {
    filters.sortOrder = 'DESC';
  } else if (/\bascending\b|\basc\b|\boldest\s+first\b|\blowest\s+first\b/i.test(lowerQuery)) {
    filters.sortOrder = 'ASC';
  }

  // Extract remaining text as medication/generic name search
  // Remove all matched patterns from the query
  let remainingQuery = query;
  
  // Remove expiration patterns
  for (const { pattern } of expirationPatterns) {
    remainingQuery = remainingQuery.replace(pattern, ' ');
  }
  
  // Remove other patterns
  remainingQuery = remainingQuery
    .replace(/\bndc[:\s]+[0-9-]+\b/gi, ' ')
    .replace(/\bstrength[:\s]+\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?)?\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?)\b/gi, ' ')
    .replace(/\b\d+(?:\.\d+)?\s*(?:-|to|and)\s*\d+(?:\.\d+)?\s*(?:mg|mcg|g|ml|units?)?\b/gi, ' ')
    .replace(/\b(?:at|in|location[:\s]+)?(?:fridge|room\s+temp(?:erature)?|cold\s+storage|ambient)\b/gi, ' ')
    .replace(/\b(?:tablet|tablets|tab|tabs|capsule|capsules|cap|caps|liquid|solution|syrup|injection|injectable|cream|ointment|gel)s?\b/gi, ' ')
    .replace(/\bsort(?:ed)?\s+by\s+\w+\b/gi, ' ')
    .replace(/\b(?:descending|desc|ascending|asc|newest\s+first|oldest\s+first|highest\s+first|lowest\s+first)\b/gi, ' ')
    .trim();

  // Clean up extra spaces
  remainingQuery = remainingQuery.replace(/\s+/g, ' ').trim();

  // If there's remaining text, use it as medication name search
  if (remainingQuery && remainingQuery.length >= 2) {
    filters.medicationName = remainingQuery;
  }

  return { filters, searchTerms };
}

/**
 * Generate search suggestions based on partial query
 */
export function getSearchSuggestions(query: string): string[] {
  const suggestions: string[] = [];

  // Expiration suggestions
  if (/^exp|^expir/i.test(query)) {
    suggestions.push(
      'expired',
      'expiring next week',
      'expiring in 30 days',
      'expiring in 60 days',
      'expiring in 90 days'
    );
  }

  // Strength suggestions
  if (/^\d+m|^strength/i.test(query)) {
    suggestions.push(
      '10mg',
      '20mg',
      '50mg',
      '100mg',
      'strength: 5-20mg'
    );
  }

  // Location suggestions
  if (/^loc|^at |^in |^fridge|^room/i.test(query)) {
    suggestions.push(
      'location: fridge',
      'location: room temp'
    );
  }

  // NDC suggestions
  if (/^ndc/i.test(query)) {
    suggestions.push('ndc: [enter code]');
  }

  // Sort suggestions
  if (/^sort/i.test(query)) {
    suggestions.push(
      'sort by expiry',
      'sort by name',
      'sort by quantity',
      'sort by strength ascending',
      'sort by expiry descending'
    );
  }

  return suggestions;
}

/**
 * Get example queries for help text
 */
export function getExampleQueries(): string[] {
  return [
    'lisinopril expiring next week',
    'metformin 500mg',
    'expired medications',
    'ndc:0093-7214-01',
    '10mg at fridge location',
    'tablets expiring in 30 days',
    'sort by expiry ascending',
    'lisinopril 10-20mg',
  ];
}

