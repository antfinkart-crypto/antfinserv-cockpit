import {
  ClientMasterRecord,
  ClientChangeLog,
  ClientImportBatch,
  AmbiguousClientMatch,
  SourceSystem
} from '../types';

export interface MatchingEngineResult {
  newClients: ClientMasterRecord[];
  updatedClients: ClientMasterRecord[];
  unchangedClients: ClientMasterRecord[];
  ambiguousMatches: AmbiguousClientMatch[];
  changeLogs: ClientChangeLog[];
  importBatch: ClientImportBatch;
}

// Normalize name string for matching comparison
export function normalizeNameForMatch(name: string): string {
  if (!name) return '';
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Executes Controlled Identity Matching & Non-Destructive Upsert
 */
export function matchAndUpsertClients(
  incomingRecords: Partial<ClientMasterRecord>[],
  existingClients: ClientMasterRecord[],
  sourceFilename: string,
  sourceSystem: SourceSystem = 'MFBOX',
  importedBy: string = 'ADVISOR'
): MatchingEngineResult {
  const importId = 'cimp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
  const now = new Date().toISOString();

  const newClients: ClientMasterRecord[] = [];
  const updatedClients: ClientMasterRecord[] = [];
  const unchangedClients: ClientMasterRecord[] = [];
  const ambiguousMatches: AmbiguousClientMatch[] = [];
  const changeLogs: ClientChangeLog[] = [];

  let missingPanCount = 0;
  let missingDobCount = 0;
  let missingMobileCount = 0;
  let missingEmailCount = 0;
  let errorCount = 0;
  const warnings: string[] = [];

  // In-memory working copy map keyed by client_id to prevent intra-batch duplication
  const clientPool = new Map<string, ClientMasterRecord>();
  existingClients.forEach(c => clientPool.set(c.client_id, { ...c }));

  for (let i = 0; i < incomingRecords.length; i++) {
    const raw = incomingRecords[i];
    if (!raw.investor_name) {
      errorCount++;
      warnings.push(`Row ${i + 1}: Skipped row due to missing investor name.`);
      continue;
    }

    if (!raw.pan) missingPanCount++;
    if (!raw.dob) missingDobCount++;
    if (!raw.mobile) missingMobileCount++;
    if (!raw.email) missingEmailCount++;

    const normName = normalizeNameForMatch(raw.investor_name);
    const poolList = Array.from(clientPool.values());

    // ----------------------------------------------------
    // CONTROLLED MATCHING HIERARCHY
    // ----------------------------------------------------
    let matchedClient: ClientMasterRecord | null = null;
    let matchReason = '';
    const candidateMatches: { client: ClientMasterRecord; reason: string }[] = [];

    // Priority 1: Exact source_system + source_user_id
    if (raw.source_user_id) {
      const matches = poolList.filter(
        c => c.source_system === sourceSystem && c.source_user_id === raw.source_user_id
      );
      matches.forEach(match => {
        if (!candidateMatches.some(m => m.client.client_id === match.client_id)) {
          candidateMatches.push({ client: match, reason: 'Exact source_system + source_user_id' });
        }
      });
    }

    // Priority 2: Exact valid PAN (when PAN exists)
    if (raw.pan) {
      const matches = poolList.filter(c => c.pan === raw.pan);
      matches.forEach(match => {
        if (!candidateMatches.some(m => m.client.client_id === match.client_id)) {
          candidateMatches.push({ client: match, reason: 'Exact valid PAN' });
        }
      });
    }

    // Priority 3: Strong composite: normalized mobile + DOB + normalized name
    if (raw.mobile && raw.dob && normName) {
      const matches = poolList.filter(
        c =>
          c.mobile === raw.mobile &&
          c.dob === raw.dob &&
          normalizeNameForMatch(c.investor_name) === normName
      );
      matches.forEach(match => {
        if (!candidateMatches.some(m => m.client.client_id === match.client_id)) {
          candidateMatches.push({ client: match, reason: 'Strong composite (Mobile + DOB + Name)' });
        }
      });
    }

    // Priority 4: Strong composite: normalized email + DOB + normalized name
    if (raw.email && raw.dob && normName) {
      const matches = poolList.filter(
        c =>
          c.email === raw.email &&
          c.dob === raw.dob &&
          normalizeNameForMatch(c.investor_name) === normName
      );
      matches.forEach(match => {
        if (!candidateMatches.some(m => m.client.client_id === match.client_id)) {
          candidateMatches.push({ client: match, reason: 'Strong composite (Email + DOB + Name)' });
        }
      });
    }

    // ----------------------------------------------------
    // AMBIGUITY CHECK (GUARDRAILS)
    // ----------------------------------------------------
    if (candidateMatches.length > 1) {
      // Conflicting matches detected! Send to Review Queue
      ambiguousMatches.push({
        id: 'amb_' + Date.now() + '_' + i,
        import_id: importId,
        incoming_record: raw,
        existing_matches: candidateMatches.map(m => m.client),
        reason: `Multiple possible identity matches found: ${candidateMatches.map(m => m.reason).join(', ')}`,
        created_at: now,
        status: 'PENDING'
      });
      continue; // Do NOT auto-merge
    } else if (candidateMatches.length === 1) {
      matchedClient = candidateMatches[0].client;
      matchReason = candidateMatches[0].reason;
    }

    // ----------------------------------------------------
    // NON-DESTRUCTIVE UPSERT LOGIC
    // ----------------------------------------------------
    if (matchedClient) {
      let isChanged = false;
      const existing = matchedClient;
      const updated: ClientMasterRecord = { ...existing };

      // Helper to apply non-destructive update
      const updateField = <K extends keyof ClientMasterRecord>(
        field: K,
        newVal: ClientMasterRecord[K] | undefined
      ) => {
        if (newVal === null || newVal === undefined || newVal === '') return; // NEVER overwrite with blank!

        // If client was manually edited, protect manual edits
        if (existing.is_manually_edited && field === 'pan' && existing.pan) return;

        if (existing[field] !== newVal) {
          isChanged = true;
          changeLogs.push({
            id: 'chg_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7),
            client_id: existing.client_id,
            field: String(field),
            old_value: existing[field],
            new_value: newVal,
            changed_at: now,
            changed_by: importedBy,
            source: sourceSystem,
            import_id: importId
          });
          updated[field] = newVal;
        }
      };

      // Non-destructive update across core fields
      updateField('investor_name', raw.investor_name);
      updateField('pan', raw.pan);
      updateField('dob', raw.dob);
      updateField('gender', raw.gender);
      updateField('mobile', raw.mobile);
      updateField('email', raw.email);
      updateField('address_line_1', raw.address_line_1);
      updateField('address_line_2', raw.address_line_2);
      updateField('address_line_3', raw.address_line_3);
      updateField('city', raw.city);
      updateField('pincode', raw.pincode);
      updateField('state', raw.state);
      updateField('branch', raw.branch);
      updateField('rm_name', raw.rm_name);
      updateField('associate_name', raw.associate_name);
      updateField('mapping_role', raw.mapping_role);
      updateField('family_id', raw.family_id);
      updateField('bse_nse_code', raw.bse_nse_code);
      updateField('broker_code', raw.broker_code);
      updateField('aum', raw.aum);
      updateField('first_investment_date', raw.first_investment_date);
      updateField('created_date', raw.created_date);

      if (raw.source_user_id && !existing.source_user_id) {
        updateField('source_user_id', raw.source_user_id);
      }

      updated.last_source_import_id = importId;
      updated.last_source_imported_at = now;
      updated.updated_at = now;

      // Update data quality flags
      if (raw.data_quality_flags) {
        updated.data_quality_flags = raw.data_quality_flags;
      }

      clientPool.set(updated.client_id, updated);

      if (isChanged) {
        updatedClients.push(updated);
      } else {
        unchangedClients.push(updated);
      }
    } else {
      // ----------------------------------------------------
      // CREATE NEW CLIENT MASTER RECORD
      // ----------------------------------------------------
      const newClientId = 'antos_cli_' + Date.now() + '_' + Math.random().toString(36).substring(2, 8);

      const record: ClientMasterRecord = {
        client_id: newClientId,
        source_system: sourceSystem,
        source_user_id: raw.source_user_id,
        family_id: raw.family_id,
        mapping_role: raw.mapping_role || 'Individual',
        pan: raw.pan || null,
        investor_name: raw.investor_name,
        dob: raw.dob || null,
        source_age: raw.source_age,
        gender: raw.gender || 'Not Specified',
        mobile: raw.mobile || '',
        email: raw.email || '',
        address_line_1: raw.address_line_1,
        address_line_2: raw.address_line_2,
        address_line_3: raw.address_line_3,
        city: raw.city,
        pincode: raw.pincode,
        state: raw.state,
        branch: raw.branch,
        rm_name: raw.rm_name,
        associate_name: raw.associate_name,
        bse_nse_code: raw.bse_nse_code,
        broker_code: raw.broker_code,
        aum: raw.aum,
        first_investment_date: raw.first_investment_date,
        created_date: raw.created_date,
        created_at: now,
        updated_at: now,
        last_source_import_id: importId,
        last_source_imported_at: now,
        is_manually_edited: false,
        data_quality_flags: raw.data_quality_flags || []
      };

      clientPool.set(record.client_id, record);
      newClients.push(record);
    }
  }

  const importBatch: ClientImportBatch = {
    import_id: importId,
    source_system: sourceSystem,
    source_filename: sourceFilename,
    imported_at: now,
    imported_by: importedBy,
    rows_processed: incomingRecords.length,
    new_count: newClients.length,
    updated_count: updatedClients.length,
    unchanged_count: unchangedClients.length,
    review_count: ambiguousMatches.length,
    error_count: errorCount,
    missing_pan_count: missingPanCount,
    missing_dob_count: missingDobCount,
    missing_mobile_count: missingMobileCount,
    missing_email_count: missingEmailCount,
    warnings: warnings
  };

  return {
    newClients,
    updatedClients,
    unchangedClients,
    ambiguousMatches,
    changeLogs,
    importBatch
  };
}
