import { localDb } from './indexedDB';
import { Lead, InsurancePolicy, ClientMasterRecord } from '../types';
import { getSupabase } from './supabase';

export interface DeviceSyncBundle {
  version: string;
  exportedAt: string;
  sourceDevice: string;
  leads: Lead[];
  customPosters: any[];
  insurancePolicies: InsurancePolicy[];
  clientMaster: ClientMasterRecord[];
}

/**
 * Exports all local CRM records (leads, custom posters, policies, client master)
 * into a portable sync bundle for transferring between phone and desktop.
 */
export async function exportDeviceSyncBundle(): Promise<string> {
  await localDb.init();
  const leads = await localDb.getAll<Lead>('leads');
  const insurancePolicies = await localDb.getAll<InsurancePolicy>('insurance_policies');
  const clientMaster = await localDb.getAll<ClientMasterRecord>('client_master');

  let customPosters: any[] = [];
  try {
    const raw = localStorage.getItem('antfinserv_custom_posters');
    if (raw) {
      customPosters = JSON.parse(raw);
    }
  } catch {
    // ignore
  }

  const bundle: DeviceSyncBundle = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    sourceDevice: typeof navigator !== 'undefined' && navigator.userAgent.includes('Mobile') ? 'Mobile Phone' : 'Desktop PC',
    leads,
    customPosters,
    insurancePolicies,
    clientMaster
  };

  return JSON.stringify(bundle, null, 2);
}

/**
 * Imports and merges a sync bundle from another device into the current device.
 */
export async function importDeviceSyncBundle(bundleJson: string): Promise<{
  success: boolean;
  importedLeadsCount: number;
  importedPostersCount: number;
  importedPoliciesCount: number;
  message: string;
}> {
  try {
    const data: DeviceSyncBundle = JSON.parse(bundleJson);
    if (!data || !data.version) {
      throw new Error('Invalid sync bundle format.');
    }

    await localDb.init();

    // 1. Merge Leads
    let leadsCount = 0;
    if (data.leads && Array.isArray(data.leads)) {
      for (const lead of data.leads) {
        if (lead.id) {
          await localDb.put('leads', lead);
          leadsCount++;
        }
      }
    }

    // 2. Merge Custom Posters / Birthday Greetings in localStorage
    let postersCount = 0;
    if (data.customPosters && Array.isArray(data.customPosters)) {
      try {
        const existingRaw = localStorage.getItem('antfinserv_custom_posters');
        const existing: any[] = existingRaw ? JSON.parse(existingRaw) : [];
        const existingIds = new Set(existing.map((p: any) => p.id));
        const merged = [...existing];

        for (const p of data.customPosters) {
          if (p.id && !existingIds.has(p.id)) {
            merged.push(p);
            existingIds.add(p.id);
            postersCount++;
          }
        }
        localStorage.setItem('antfinserv_custom_posters', JSON.stringify(merged));
      } catch {
        // ignore
      }
    }

    // 3. Merge Insurance Policies
    let policiesCount = 0;
    if (data.insurancePolicies && Array.isArray(data.insurancePolicies)) {
      for (const pol of data.insurancePolicies) {
        if (pol.id) {
          await localDb.put('insurance_policies', pol);
          policiesCount++;
        }
      }
    }

    // 4. Merge Client Master Records if newer
    if (data.clientMaster && Array.isArray(data.clientMaster) && data.clientMaster.length > 0) {
      await localDb.putMany('client_master', data.clientMaster);
    }

    return {
      success: true,
      importedLeadsCount: leadsCount,
      importedPostersCount: postersCount,
      importedPoliciesCount: policiesCount,
      message: `Successfully synchronized from ${data.sourceDevice || 'device'} (${leadsCount} leads, ${postersCount} greetings/posters, ${policiesCount} policies).`
    };
  } catch (err: any) {
    return {
      success: false,
      importedLeadsCount: 0,
      importedPostersCount: 0,
      importedPoliciesCount: 0,
      message: err.message || 'Failed to import sync bundle.'
    };
  }
}

/**
 * Two-way sync with Supabase cloud database if configured
 */
export async function performSupabaseCloudSync(): Promise<{ success: boolean; message: string }> {
  const supabase = getSupabase();
  if (!supabase) {
    return {
      success: false,
      message: 'Supabase is not configured. Please enter your Supabase URL and Anon Key in Settings.'
    };
  }

  try {
    await localDb.init();

    // 1. Sync Leads
    const localLeads = await localDb.getAll<Lead>('leads');
    for (const lead of localLeads) {
      // Upsert to Supabase leads table
      await supabase.from('leads').upsert({
        firm_name: lead.firm_name || lead.owner_name,
        owner_name: lead.owner_name,
        mobile: lead.mobile,
        pan_number: lead.pan_number,
        email: lead.email,
        status: lead.status,
        notes: lead.notes
      }, { onConflict: 'mobile' }).select();
    }

    // Fetch remote leads from Supabase and merge
    const { data: remoteLeads, error: leadsErr } = await supabase.from('leads').select('*');
    if (!leadsErr && remoteLeads) {
      for (const rl of remoteLeads) {
        const leadObj: Lead = {
          id: rl.id || `lead_remote_${rl.mobile}`,
          firm_name: rl.firm_name || rl.owner_name,
          owner_name: rl.owner_name,
          mobile: rl.mobile,
          pan_number: rl.pan_number,
          email: rl.email,
          status: (rl.status as any) || 'Warm Lead',
          notes: rl.notes,
          created_at: rl.created_at || new Date().toISOString()
        };
        await localDb.put('leads', leadObj);
      }
    }

    return {
      success: true,
      message: 'Cloud database synchronization completed successfully with Supabase!'
    };
  } catch (err: any) {
    return {
      success: false,
      message: `Cloud sync error: ${err.message}`
    };
  }
}
