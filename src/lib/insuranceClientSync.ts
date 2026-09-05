import { ClientMasterRecord } from '../types';
import { InsurancePolicy, PolicyMember } from '../types/insurance';
import { findMatchingClient, isSamePersonOrEntity } from './entityResolution';

/**
 * Synchronizes covered insurance policy members (especially from Health Floater plans)
 * directly into the Golden Client Master database.
 * 
 * - Leverages the Foolproof 3-Tier Entity Resolution Engine:
 *   Prevents merging family members (Wife, Son, Daughter) while strictly unifying
 *   aliases of the same person (e.g. A SWAMINATHAN <-> SWAMINATHAN ARUNACHALAM).
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

  // Find primary client in master record using Foolproof Entity Resolution
  const primaryClient = findMatchingClient(
    {
      client_id: policy.primary_client_id,
      name: policy.client_name,
      proposer_name: policy.proposer_name,
      pan: policy.proposer_pan,
      mobile: policy.proposer_mobile,
      email: policy.proposer_email,
      address: (policy.vertical_data as any)?.risk_location_address
    },
    updatedClients
  );

  const effectiveFamilyId =
    policy.family_id ||
    primaryClient?.family_id ||
    `FAM_${policy.client_name.replace(/\s+/g, '_')}`;
  const effectiveHeadId =
    primaryClient?.client_id ||
    `antos_cli_${policy.client_name.toLowerCase().replace(/\s+/g, '_')}`;

  // If primary client exists and has no family_id, assign family_id
  if (primaryClient && !primaryClient.family_id) {
    primaryClient.family_id = effectiveFamilyId;
    primaryClient.mapping_role = 'Head';
  }

  for (const member of policy.members) {
    const cleanMemberName = member.member_name.trim().toUpperCase();

    // Check if this member matches an existing client using 3-Tier Entity Resolution
    const existing = findMatchingClient(
      {
        client_id: member.client_id,
        name: cleanMemberName,
        dob: member.dob,
        gender: member.gender,
        relationship_to_head: member.relationship_to_head,
        mobile: policy.proposer_mobile,
        email: policy.proposer_email,
        pan: (member.is_primary_insured || member.relationship_to_head === 'Self') ? policy.proposer_pan : null
      },
      updatedClients
    );

    if (existing) {
      alreadyExistingCount++;
      // Non-destructively enrich existing record
      if (!existing.dob && member.dob) {
        existing.dob = member.dob;
        existing.updated_at = new Date().toISOString();
      }
      if (!existing.relationship_to_head && member.relationship_to_head !== 'Self') {
        existing.relationship_to_head = member.relationship_to_head;
      }
      if (!existing.family_id) {
        existing.family_id = effectiveFamilyId;
      }
      member.synced_to_client_master = true;
      member.client_id = existing.client_id;
      continue;
    }

    // Skip creating duplicate of primary head if already represented
    if (member.is_primary_insured || member.relationship_to_head === 'Self') {
      if (primaryClient) {
        alreadyExistingCount++;
        member.synced_to_client_master = true;
        member.client_id = primaryClient.client_id;
        continue;
      }
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
      pan: (member.is_primary_insured || member.relationship_to_head === 'Self') ? policy.proposer_pan || null : null,
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
