import {
  Client,
  ClientMasterRecord,
  ClientChangeLog,
  ClientImportBatch,
  AmbiguousClientMatch,
  MfHolding,
  ActiveSip,
  Lead,
  ProtectionAsset,
  ImportBatch,
  InsurancePolicy,
  PolicyMember,
  InsuranceVertical
} from '../types';

const DB_NAME = 'antfinserv_cockpit_db_v4';
const DB_VERSION = 3;

export class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // 1. Client Master (Immutable client_id primary key)
        if (!db.objectStoreNames.contains('client_master')) {
          const clientMasterStore = db.createObjectStore('client_master', { keyPath: 'client_id' });
          clientMasterStore.createIndex('source_user_id', 'source_user_id', { unique: false });
          clientMasterStore.createIndex('pan', 'pan', { unique: false });
          clientMasterStore.createIndex('family_id', 'family_id', { unique: false });
          clientMasterStore.createIndex('mobile', 'mobile', { unique: false });
          clientMasterStore.createIndex('email', 'email', { unique: false });
          clientMasterStore.createIndex('rm_name', 'rm_name', { unique: false });
          clientMasterStore.createIndex('mapping_role', 'mapping_role', { unique: false });
        }

        // 2. Client Audit History
        if (!db.objectStoreNames.contains('client_audit_history')) {
          const auditStore = db.createObjectStore('client_audit_history', { keyPath: 'id' });
          auditStore.createIndex('client_id', 'client_id', { unique: false });
        }

        // 3. Client Import History
        if (!db.objectStoreNames.contains('client_import_history')) {
          db.createObjectStore('client_import_history', { keyPath: 'import_id' });
        }

        // 4. Client Review Queue (Ambiguous matches)
        if (!db.objectStoreNames.contains('client_review_queue')) {
          const reviewStore = db.createObjectStore('client_review_queue', { keyPath: 'id' });
          reviewStore.createIndex('status', 'status', { unique: false });
        }

        // Legacy & Domain stores
        if (!db.objectStoreNames.contains('clients')) {
          db.createObjectStore('clients', { keyPath: 'pan_number' });
        }
        if (!db.objectStoreNames.contains('holdings')) {
          const holdStore = db.createObjectStore('holdings', { keyPath: 'id' });
          holdStore.createIndex('pan', 'pan', { unique: false });
          holdStore.createIndex('folio_number', 'folio_number', { unique: false });
        }
        if (!db.objectStoreNames.contains('sips')) {
          const sipStore = db.createObjectStore('sips', { keyPath: 'id' });
          sipStore.createIndex('pan_number', 'pan_number', { unique: false });
          sipStore.createIndex('sip_date', 'sip_date', { unique: false });
        }
        if (!db.objectStoreNames.contains('batches')) {
          db.createObjectStore('batches', { keyPath: 'id' });
        }
        if (!db.objectStoreNames.contains('leads')) {
          const leadStore = db.createObjectStore('leads', { keyPath: 'id' });
          leadStore.createIndex('status', 'status', { unique: false });
        }
        if (!db.objectStoreNames.contains('policies')) {
          db.createObjectStore('policies', { keyPath: 'policy_number' });
        }
        if (!db.objectStoreNames.contains('outbox')) {
          db.createObjectStore('outbox', { keyPath: 'id', autoIncrement: true });
        }

        // 5. Insurance CRM Specialized Object Stores
        if (!db.objectStoreNames.contains('insurance_policies')) {
          const polStore = db.createObjectStore('insurance_policies', { keyPath: 'id' });
          polStore.createIndex('policy_number', 'policy_number', { unique: false });
          polStore.createIndex('primary_client_id', 'primary_client_id', { unique: false });
          polStore.createIndex('insurer_name', 'insurer_name', { unique: false });
          polStore.createIndex('vertical', 'vertical', { unique: false });
          polStore.createIndex('status', 'status', { unique: false });
          polStore.createIndex('expiry_date', 'expiry_date', { unique: false });
          polStore.createIndex('renewal_due_date', 'renewal_due_date', { unique: false });
        }
        if (!db.objectStoreNames.contains('policy_documents')) {
          const docStore = db.createObjectStore('policy_documents', { keyPath: 'id' });
          docStore.createIndex('policy_id', 'policy_id', { unique: false });
          docStore.createIndex('sha256_hash', 'sha256_hash', { unique: false });
          docStore.createIndex('doc_type', 'doc_type', { unique: false });
        }
        if (!db.objectStoreNames.contains('policy_members')) {
          const memStore = db.createObjectStore('policy_members', { keyPath: 'id' });
          memStore.createIndex('policy_id', 'policy_id', { unique: false });
          memStore.createIndex('client_id', 'client_id', { unique: false });
          memStore.createIndex('dob', 'dob', { unique: false });
          memStore.createIndex('relationship_to_head', 'relationship_to_head', { unique: false });
        }
        if (!db.objectStoreNames.contains('insurance_claims')) {
          const claimStore = db.createObjectStore('insurance_claims', { keyPath: 'id' });
          claimStore.createIndex('policy_id', 'policy_id', { unique: false });
          claimStore.createIndex('claim_number', 'claim_number', { unique: false });
          claimStore.createIndex('status', 'status', { unique: false });
        }
        if (!db.objectStoreNames.contains('policy_renewals')) {
          const renStore = db.createObjectStore('policy_renewals', { keyPath: 'id' });
          renStore.createIndex('policy_id', 'policy_id', { unique: false });
          renStore.createIndex('renewal_due_date', 'renewal_due_date', { unique: false });
          renStore.createIndex('stage', 'stage', { unique: false });
        }
        if (!db.objectStoreNames.contains('insurance_audit_logs')) {
          const auditStore = db.createObjectStore('insurance_audit_logs', { keyPath: 'id' });
          auditStore.createIndex('policy_id', 'policy_id', { unique: false });
          auditStore.createIndex('performed_at', 'performed_at', { unique: false });
        }
        if (!db.objectStoreNames.contains('insurer_registry')) {
          db.createObjectStore('insurer_registry', { keyPath: 'id' });
        }
      };

      request.onsuccess = async () => {
        this.db = request.result;
        await this.migrateFromV3IfNeeded();
        await this.migrateLegacyPoliciesIfNeeded();
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
  }

  // Seamless migration from v3 to v4 so no user data is lost
  private async migrateFromV3IfNeeded(): Promise<void> {
    try {
      const v3Exists = await new Promise<boolean>((res) => {
        const req = indexedDB.open('antfinserv_cockpit_db_v3');
        req.onsuccess = (e) => {
          const db = (e.target as any).result;
          const hasStores = db.objectStoreNames.length > 0;
          db.close();
          res(hasStores);
        };
        req.onerror = () => res(false);
      });

      if (!v3Exists) return;

      const currentHoldings = await this.getAll<MfHolding>('holdings');
      if (currentHoldings.length > 0) return; // Already migrated or populated

      const v3Db = await new Promise<IDBDatabase>((res, rej) => {
        const req = indexedDB.open('antfinserv_cockpit_db_v3');
        req.onsuccess = () => res(req.result);
        req.onerror = () => rej(req.error);
      });

      const storesToCopy = ['holdings', 'sips', 'batches', 'leads', 'policies', 'clients'];
      for (const st of storesToCopy) {
        if (v3Db.objectStoreNames.contains(st)) {
          const items = await new Promise<any[]>((res) => {
            const tx = v3Db.transaction(st, 'readonly');
            const req = tx.objectStore(st).getAll();
            req.onsuccess = () => res(req.result || []);
            req.onerror = () => res([]);
          });
          if (items.length > 0) {
            await this.putMany(st, items);
          }
        }
      }
      v3Db.close();
    } catch (err) {
      console.warn('Migration from v3 skipped or completed:', err);
    }
  }

  // Seamless migration from legacy policies (ProtectionAsset) to InsurancePolicy domain
  private async migrateLegacyPoliciesIfNeeded(): Promise<void> {
    try {
      const existingNew = await this.getAll<InsurancePolicy>('insurance_policies');
      if (existingNew.length > 0) return;

      const legacy = await this.getAll<ProtectionAsset>('policies');
      if (legacy.length === 0) return;

      const migrated: InsurancePolicy[] = legacy.map((p) => {
        let vert: InsuranceVertical = 'HEALTH';
        const typeStr = (p.policy_type || '').toLowerCase();
        if (typeStr.includes('motor') || typeStr.includes('car')) vert = 'MOTOR';
        else if (typeStr.includes('term') || typeStr.includes('life')) vert = 'LIFE';

        const members: PolicyMember[] = [];
        if (p.primary_member_name || p.client_name) {
          members.push({
            id: `mem-${p.id}-0`,
            policy_id: p.id,
            member_name: p.primary_member_name || p.client_name,
            relationship_to_head: 'Self',
            dob: p.primary_member_dob || '',
            is_primary_insured: true,
            synced_to_client_master: false
          });
        }
        if (p.dep1_name) {
          members.push({
            id: `mem-${p.id}-1`,
            policy_id: p.id,
            member_name: p.dep1_name,
            relationship_to_head: (p.dep1_relation as any) || 'Spouse',
            dob: p.dep1_dob || '',
            is_primary_insured: false,
            synced_to_client_master: false
          });
        }
        if (p.dep2_name) {
          members.push({
            id: `mem-${p.id}-2`,
            policy_id: p.id,
            member_name: p.dep2_name,
            relationship_to_head: (p.dep2_relation as any) || 'Child',
            dob: p.dep2_dob || '',
            is_primary_insured: false,
            synced_to_client_master: false
          });
        }

        return {
          id: p.id || `antos_pol_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
          policy_number: p.policy_number,
          insurer_name: p.insurer || 'General Insurer',
          vertical: vert,
          product_name: p.policy_type || 'Standard Protection Policy',
          status: 'ACTIVE',
          client_name: p.client_name,
          proposer_name: p.client_name,
          sum_insured: p.sum_insured || 500000,
          gross_premium: p.net_premium ? Math.round(p.net_premium * 1.18) : 15000,
          net_premium: p.net_premium || 12000,
          taxes_gst: p.net_premium ? Math.round(p.net_premium * 0.18) : 2160,
          payment_frequency: 'ANNUAL',
          inception_date: new Date(Date.now() - 180 * 86400000).toISOString().split('T')[0],
          expiry_date: p.expiry_date || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          renewal_due_date: p.expiry_date || new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0],
          verification_status: 'VERIFIED',
          members,
          source_document_name: p.document_name,
          created_at: p.created_at || new Date().toISOString(),
          updated_at: p.updated_at || new Date().toISOString()
        };
      });

      if (migrated.length > 0) {
        await this.putMany('insurance_policies', migrated);
      }
    } catch (err) {
      console.warn('Legacy policy migration skipped:', err);
    }
  }

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.init();
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
      return [];
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.getAll();
        req.onsuccess = () => resolve(req.result || []);
        req.onerror = () => resolve([]);
      } catch (err) {
        console.warn(`getAll on ${storeName} caught error:`, err);
        resolve([]);
      }
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    await this.init();
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
      return undefined;
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, 'readonly');
        const store = tx.objectStore(storeName);
        const req = store.get(key);
        req.onsuccess = () => resolve(req.result);
        req.onerror = () => resolve(undefined);
      } catch (err) {
        console.warn(`get on ${storeName} caught error:`, err);
        resolve(undefined);
      }
    });
  }

  async put<T>(storeName: string, item: T): Promise<void> {
    await this.init();
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
      return;
    }
    return new Promise((resolve) => {
      try {
        const stores = [storeName];
        if (this.db!.objectStoreNames.contains('outbox')) {
          stores.push('outbox');
        }
        const tx = this.db!.transaction(stores, 'readwrite');
        const store = tx.objectStore(storeName);
        store.put(item);

        if (this.db!.objectStoreNames.contains('outbox')) {
          const outbox = tx.objectStore('outbox');
          outbox.add({
            table_name: storeName,
            action: 'UPSERT',
            payload: item,
            timestamp: new Date().toISOString()
          });
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (err) {
        console.warn(`put on ${storeName} caught error:`, err);
        resolve();
      }
    });
  }

  async putMany<T>(storeName: string, items: T[]): Promise<void> {
    await this.init();
    if (!items || items.length === 0) return;
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
      return;
    }
    return new Promise((resolve) => {
      try {
        const stores = [storeName];
        if (this.db!.objectStoreNames.contains('outbox')) {
          stores.push('outbox');
        }
        const tx = this.db!.transaction(stores, 'readwrite');
        const store = tx.objectStore(storeName);
        const outbox = this.db!.objectStoreNames.contains('outbox') ? tx.objectStore('outbox') : null;

        for (const item of items) {
          store.put(item);
          if (outbox) {
            outbox.add({
              table_name: storeName,
              action: 'UPSERT',
              payload: item,
              timestamp: new Date().toISOString()
            });
          }
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (err) {
        console.warn(`putMany on ${storeName} caught error:`, err);
        resolve();
      }
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    await this.init();
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
      return;
    }
    return new Promise((resolve) => {
      try {
        const stores = [storeName];
        if (this.db!.objectStoreNames.contains('outbox')) {
          stores.push('outbox');
        }
        const tx = this.db!.transaction(stores, 'readwrite');
        const store = tx.objectStore(storeName);
        store.delete(key);

        if (this.db!.objectStoreNames.contains('outbox')) {
          const outbox = tx.objectStore('outbox');
          outbox.add({
            table_name: storeName,
            action: 'DELETE',
            payload: { key },
            timestamp: new Date().toISOString()
          });
        }

        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (err) {
        console.warn(`delete on ${storeName} caught error:`, err);
        resolve();
      }
    });
  }

  async clear(storeName: string): Promise<void> {
    await this.init();
    if (!this.db || !this.db.objectStoreNames.contains(storeName)) {
      return;
    }
    return new Promise((resolve) => {
      try {
        const tx = this.db!.transaction(storeName, 'readwrite');
        const store = tx.objectStore(storeName);
        store.clear();
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch (err) {
        console.warn(`clear on ${storeName} caught error:`, err);
        resolve();
      }
    });
  }

  async getOutbox(): Promise<any[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox', 'readonly');
      const store = tx.objectStore('outbox');
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async clearOutbox(): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction('outbox', 'readwrite');
      const store = tx.objectStore('outbox');
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }
}

export const localDb = new LocalDatabase();
