/**
 * Drug Service
 * Handles drug search and database operations
 * Uses RxNorm API via rxnormService for external drug data
 */

import { supabaseServer } from '../utils/supabase';
import { DrugSearchResult } from '@/types';
import { searchDrugsByTerm } from './rxnormService';

const RXNORM_API_BASE = 'https://rxnav.nlm.nih.gov/REST';

/**
 * Normalize NDC code from various formats to standard format
 * Formats: 4-4-2, 5-3-2, 5-4-1, 5-4-2 -> standardized
 */
export function normalizeNDC(ndc: string): string {
  // Remove all non-numeric characters
  const cleaned = ndc.replace(/[^0-9]/g, '');

  // Return cleaned NDC (RxNorm accepts various formats)
  return cleaned;
}

/**
 * Search for drug by NDC code
 * Tries internal database first, then RxNorm API
 */
export async function searchDrugByNDC(ndc: string): Promise<DrugSearchResult | null> {
  const normalizedNDC = normalizeNDC(ndc);

  // First, check internal database
  const { data: existingDrug } = await supabaseServer
    .from('drugs')
    .select('*')
    .eq('ndc_id', normalizedNDC)
    .single();

  if (existingDrug) {
    return {
      drugId: existingDrug.drug_id,
      medicationName: existingDrug.medication_name,
      genericName: existingDrug.generic_name,
      strength: existingDrug.strength,
      strengthUnit: existingDrug.strength_unit,
      ndcId: existingDrug.ndc_id,
      form: existingDrug.form,
    };
  }

  // Search RxNorm API by NDC
  try {
    const rxnormResult = await searchRxNormByNDC(normalizedNDC);
    if (rxnormResult) {
      // Save to database for future use
      await saveDrugToDatabase(rxnormResult);
      return rxnormResult;
    }
  } catch (error) {
    console.error('RxNorm NDC search error:', error);
  }

  return null;
}

/**
 * Search RxNorm API by NDC code
 * Uses the proper RxNorm NDC lookup endpoint
 */
async function searchRxNormByNDC(ndc: string): Promise<DrugSearchResult | null> {
  try {
    // Step 1: Get RXCUI from NDC using the correct endpoint
    // Documentation: https://lhncbc.nlm.nih.gov/RxNav/APIs/api-RxNorm.getRxcuiByNDC.html
    const rxcuiResponse = await fetch(
      `${RXNORM_API_BASE}/rxcui.json?idtype=NDC&id=${encodeURIComponent(ndc)}`
    );

    if (!rxcuiResponse.ok) {
      console.error(`RxNorm RXCUI lookup failed: ${rxcuiResponse.status}`);
      return null;
    }

    const rxcuiData = await rxcuiResponse.json();
    const rxcuiList = rxcuiData.idGroup?.rxnormId;

    if (!rxcuiList || rxcuiList.length === 0) {
      console.log(`No RXCUI found for NDC: ${ndc}`);
      return null;
    }

    // Take the first RXCUI
    const rxcui = rxcuiList[0];

    // Step 2: Get drug properties for this RXCUI
    const propsResponse = await fetch(
      `${RXNORM_API_BASE}/rxcui/${rxcui}/allProperties.json?prop=all`
    );

    if (!propsResponse.ok) {
      console.error(`RxNorm properties lookup failed: ${propsResponse.status}`);
      return null;
    }

    const propsData = await propsResponse.json();
    const properties = propsData.propConceptGroup?.propConcept || [];

    // Extract drug information from properties
    const propertyMap = new Map<string, string>();
    for (const prop of properties) {
      propertyMap.set(prop.propName, prop.propValue);
    }

    const medicationName =
      propertyMap.get('RxNorm Name') ||
      propertyMap.get('Display Name') ||
      'Unknown Medication';
    const strengthRaw = propertyMap.get('Strength') || '';
    const doseForm = propertyMap.get('Dose Form') || 'Tablet';

    // Parse strength (e.g., "10 mg" -> strength: 10, unit: "mg")
    const { strength, unit } = parseStrength(strengthRaw);

    // Extract generic name (first word)
    const genericName = medicationName.trim().split(/[\s,\-\/\(]/)[0] || medicationName;

    return {
      medicationName,
      genericName,
      strength,
      strengthUnit: unit,
      ndcId: ndc,
      form: doseForm,
    };
  } catch (error) {
    console.error('RxNorm NDC search error:', error);
    return null;
  }
}

/**
 * Parse strength string into number and unit
 */
function parseStrength(strengthStr: string): { strength: number; unit: string } {
  if (!strengthStr || strengthStr.trim() === '') {
    return { strength: 0, unit: 'mg' };
  }

  // Match pattern: number (with optional decimal) followed by optional whitespace and unit (including /)
  const match = strengthStr.match(/(\d+\.?\d*)\s*([\w\/]+)?/);

  if (match) {
    const strength = parseFloat(match[1]);
    const unit = match[2] || 'mg';
    return { strength, unit };
  }

  return { strength: 0, unit: 'mg' };
}

/**
 * Search for drugs by name (uses RxNorm service)
 */
export async function searchDrugsByName(query: string): Promise<DrugSearchResult[]> {
  if (!query || query.trim().length < 3) {
    return [];
  }

  // Search internal database first
  const { data: localDrugs } = await supabaseServer
    .from('drugs')
    .select('*')
    .or(`generic_name.ilike.%${query}%,medication_name.ilike.%${query}%`)
    .limit(10);

  const results: DrugSearchResult[] =
    localDrugs?.map((drug) => ({
      drugId: drug.drug_id,
      medicationName: drug.medication_name,
      genericName: drug.generic_name,
      strength: drug.strength,
      strengthUnit: drug.strength_unit,
      ndcId: drug.ndc_id,
      form: drug.form,
    })) || [];

  // If we have enough results, return them
  if (results.length >= 5) {
    return results;
  }

  // Otherwise, search RxNorm for more using our RxNorm service
  try {
    const rxnormResults = await searchDrugsByTerm(query, { maxResults: 10 });

    // Convert RxNorm results to DrugSearchResult format
    const convertedResults: DrugSearchResult[] = rxnormResults.map((drug) => ({
      medicationName: drug.medicationName,
      genericName: drug.genericName,
      strength: drug.strength,
      strengthUnit: drug.strengthUnit,
      ndcId: drug.ndcId,
      form: drug.form,
    }));

    // Combine and deduplicate by NDC
    const allResults = [...results, ...convertedResults];
    const uniqueResults = new Map<string, DrugSearchResult>();

    for (const result of allResults) {
      if (result.ndcId && !uniqueResults.has(result.ndcId)) {
        uniqueResults.set(result.ndcId, result);
      }
    }

    return Array.from(uniqueResults.values()).slice(0, 10);
  } catch (error) {
    console.error('RxNorm name search error:', error);
    return results;
  }
}

/**
 * Save drug to database
 */
async function saveDrugToDatabase(drug: DrugSearchResult): Promise<void> {
  try {
    // Check if drug with this NDC already exists
    const { data: existing } = await supabaseServer
      .from('drugs')
      .select('drug_id')
      .eq('ndc_id', drug.ndcId)
      .single();

    if (existing) {
      // Drug already exists, skip
      return;
    }

    await supabaseServer.from('drugs').insert({
      medication_name: drug.medicationName,
      generic_name: drug.genericName,
      strength: drug.strength,
      strength_unit: drug.strengthUnit,
      ndc_id: drug.ndcId,
      form: drug.form,
    });
  } catch (error) {
    // Ignore duplicate key errors
    console.error('Error saving drug to database:', error);
  }
}

/**
 * Get or create drug in database
 */
export async function getOrCreateDrug(
  drugData: Omit<DrugSearchResult, 'drugId'>
): Promise<string> {
  // Check if drug exists by NDC
  if (drugData.ndcId) {
    const { data: existingDrug } = await supabaseServer
      .from('drugs')
      .select('drug_id')
      .eq('ndc_id', drugData.ndcId)
      .single();

    if (existingDrug) {
      return existingDrug.drug_id;
    }
  }

  // Check if similar drug exists by name and strength
  const { data: similarDrug } = await supabaseServer
    .from('drugs')
    .select('drug_id')
    .eq('generic_name', drugData.genericName)
    .eq('strength', drugData.strength)
    .eq('strength_unit', drugData.strengthUnit)
    .eq('form', drugData.form)
    .single();

  if (similarDrug) {
    return similarDrug.drug_id;
  }

  // Create new drug
  const { data: newDrug, error } = await supabaseServer
    .from('drugs')
    .insert({
      medication_name: drugData.medicationName,
      generic_name: drugData.genericName,
      strength: drugData.strength,
      strength_unit: drugData.strengthUnit,
      ndc_id: drugData.ndcId || `MANUAL-${Date.now()}`,
      form: drugData.form,
    })
    .select('drug_id')
    .single();

  if (error) {
    throw new Error(`Failed to create drug: ${error.message}`);
  }

  return newDrug.drug_id;
}
