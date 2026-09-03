import { Client, ClientMasterRecord, ClientChangeLog, ClientImportBatch, AmbiguousClientMatch, MfHolding, ActiveSip, Lead, ProtectionAsset, ImportBatch } from '../types';

const DB_NAME = 'antfinserv_cockpit_db_v4';
const DB_VERSION = 1;

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
      };

      request.onsuccess = async () => {
        this.db = request.result;
        await this.migrateFromV3IfNeeded();
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

  async getAll<T>(storeName: string): Promise<T[]> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  }

  async get<T>(storeName: string, key: IDBValidKey): Promise<T | undefined> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readonly');
      const store = tx.objectStore(storeName);
      const req = store.get(key);
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => reject(req.error);
    });
  }

  async put<T>(storeName: string, item: T): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([storeName, 'outbox'], 'readwrite');
      const store = tx.objectStore(storeName);
      store.put(item);

      const outbox = tx.objectStore('outbox');
      outbox.add({
        table_name: storeName,
        action: 'UPSERT',
        payload: item,
        timestamp: new Date().toISOString()
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async putMany<T>(storeName: string, items: T[]): Promise<void> {
    await this.init();
    if (!items || items.length === 0) return;
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([storeName, 'outbox'], 'readwrite');
      const store = tx.objectStore(storeName);
      const outbox = tx.objectStore('outbox');

      for (const item of items) {
        store.put(item);
        outbox.add({
          table_name: storeName,
          action: 'UPSERT',
          payload: item,
          timestamp: new Date().toISOString()
        });
      }

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async delete(storeName: string, key: IDBValidKey): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction([storeName, 'outbox'], 'readwrite');
      const store = tx.objectStore(storeName);
      store.delete(key);

      const outbox = tx.objectStore('outbox');
      outbox.add({
        table_name: storeName,
        action: 'DELETE',
        payload: { key },
        timestamp: new Date().toISOString()
      });

      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
    });
  }

  async clear(storeName: string): Promise<void> {
    await this.init();
    return new Promise((resolve, reject) => {
      const tx = this.db!.transaction(storeName, 'readwrite');
      const store = tx.objectStore(storeName);
      store.clear();
      tx.oncomplete = () => resolve();
      tx.onerror = () => reject(tx.error);
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
