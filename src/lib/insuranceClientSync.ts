import { ClientMasterRecord } from '../types';
import { InsurancePolicy, PolicyMember } from '../types/insurance';

/**
 * Synchronizes covered insurance policy members (especially from Health Floater plans)
 * directly into the Golden Client Master database.
 * 
 * - Tags family members with the household family_id
 * - Records relationship_to_head (e.g. 'Spouse', 'Son', 'Daughter', 'Father', 'Mother')
 * - Preserves exact Date of Birth (DOB) for Birthday Wishes in Content Studio
 * - Adheres strictly to the Zero Fake PAN rule (pan: null for minors/dependents)
 */
export function syncPolicyMembersToClientMaster(
  policy: InsurancePolicy,
  existingClients: ClientMasterRecord[]
): {
  updatedClients: ClientMasterRecord[];
  newMembersAdded: ClientMasterRecord[];
  alreadyExistingCount: number;
} {
  const updatedClients = [...existingClients];
  const newMembersAdded: ClientMasterRecord[] = [];
  let alreadyExistingCount = 0;

  // Find primary client in master record
  const primaryClient = existingClients.find(
    c => (c.client_id && c.client_id === policy.primary_client_id) ||
         (c.investor_name && c.investor_name.toUpperCase() === policy.client_name.toUpperCase())
  );

  const effectiveFamilyId = policy.family_id || primaryClient?.family_id || `FAM_${policy.client_name.replace(/\s+/g, '_')}`;
  const effectiveHeadId = primaryClient?.client_id || `antos_cli_${policy.client_name.toLowerCase().replace(/\s+/g, '_')}`;

  // If primary client exists and has no family_id, assign family_id
  if (primaryClient && !primaryClient.family_id) {
    primaryClient.family_id = effectiveFamilyId;
    primaryClient.mapping_role = 'Head';
  }

  for (const member of policy.members) {
    const cleanMemberName = member.member_name.trim().toUpperCase();

    // Check if this member is already in client master under the same household or matching name
    const existing = updatedClients.find(
      c => c.investor_name.toUpperCase() === cleanMemberName ||
           (c.family_id === effectiveFamilyId && c.relationship_to_head === member.relationship_to_head && c.dob === member.dob)
    );

    if (existing) {
      alreadyExistingCount++;
      // If existing has missing DOB, non-destructively enrich it from insurance record
      if (!existing.dob && member.dob) {
        existing.dob = member.dob;
        existing.updated_at = new Date().toISOString();
      }
      if (!existing.relationship_to_head && member.relationship_to_head !== 'Self') {
        existing.relationship_to_head = member.relationship_to_head;
      }
      continue;
    }

    // Skip creating duplicate of primary head if already represented
    if (member.is_primary_insured || member.relationship_to_head === 'Self') {
      if (primaryClient) continue;
    }

    // Create new individual ClientMasterRecord for the family member
    const newClientRecord: ClientMasterRecord = {
      client_id: `antos_cli_ins_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      source_system: 'INSURANCE',
      source_user_id: `INS_MEM_${member.id}`,
      family_id: effectiveFamilyId,
      family_head_id: effectiveHeadId,
      mapping_role: member.is_primary_insured ? 'Head' : 'Member',
      relationship_to_head: member.relationship_to_head,
      linked_health_policy_number: policy.policy_number,

      // Core Identity (Strict zero fake PAN rule)
      pan: null,
      investor_name: cleanMemberName,
      dob: member.dob || null,
      gender: member.gender || 'Not Specified',

      // Inherited Contact & Branch
      mobile: policy.proposer_mobile || primaryClient?.mobile || '',
      email: policy.proposer_email || primaryClient?.email || '',
      branch: primaryClient?.branch,
      rm_name: primaryClient?.rm_name,

      // Timestamps & Quality Flags
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      data_quality_flags: ['MISSING_PAN']
    };

    updatedClients.push(newClientRecord);
    newMembersAdded.push(newClientRecord);
    member.synced_to_client_master = true;
    member.client_id = newClientRecord.client_id;
  }

  return {
    updatedClients,
    newMembersAdded,
    alreadyExistingCount
  };
}
