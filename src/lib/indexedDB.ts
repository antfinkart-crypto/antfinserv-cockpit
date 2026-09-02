import { Client, MfHolding, ActiveSip, Lead, ProtectionAsset, ImportBatch } from '../types';

const DB_NAME = 'antfinserv_cockpit_db_v3';
const DB_VERSION = 1;

export class LocalDatabase {
  private db: IDBDatabase | null = null;

  async init(): Promise<void> {
    if (this.db) return;

    return new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
        const db = (event.target as IDBOpenDBRequest).result;

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

      request.onsuccess = () => {
        this.db = request.result;
        resolve();
      };

      request.onerror = () => reject(request.error);
    });
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
