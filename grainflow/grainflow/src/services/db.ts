const DB_NAME = 'grainflow';
const DB_VERSION = 1;

type StoreName = 'users' | 'products' | 'transactions' | 'meta';

let db: IDBDatabase | null = null;

function openDb(): Promise<IDBDatabase> {
  if (db) return Promise.resolve(db);

  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const database = request.result;

      if (!database.objectStoreNames.contains('users')) {
        const store = database.createObjectStore('users', { keyPath: 'id', autoIncrement: true });
        store.createIndex('email', 'email', { unique: true });
      }

      if (!database.objectStoreNames.contains('products')) {
        const store = database.createObjectStore('products', { keyPath: 'id', autoIncrement: true });
        store.createIndex('user_id', 'user_id', { unique: false });
      }

      if (!database.objectStoreNames.contains('transactions')) {
        const store = database.createObjectStore('transactions', { keyPath: 'id', autoIncrement: true });
        store.createIndex('user_id', 'user_id', { unique: false });
      }

      if (!database.objectStoreNames.contains('meta')) {
        database.createObjectStore('meta', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      db = request.result;
      resolve(db);
    };
    request.onerror = () => reject(request.error);
  });
}

function tx<T>(store: StoreName, mode: IDBTransactionMode, fn: (store: IDBObjectStore) => IDBRequest<T> | Promise<T>): Promise<T> {
  return openDb().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(store, mode);
        const objectStore = transaction.objectStore(store);
        const result = fn(objectStore);

        if (result instanceof Promise) {
          result.then(resolve).catch(reject);
          return;
        }

        result.onsuccess = () => resolve(result.result as T);
        result.onerror = () => reject(result.error);
      })
  );
}

export async function getAll<T>(store: StoreName): Promise<T[]> {
  return tx(store, 'readonly', (s) => s.getAll());
}

export async function getById<T>(store: StoreName, id: number): Promise<T | undefined> {
  return tx(store, 'readonly', (s) => s.get(id));
}

export async function getByIndex<T>(store: StoreName, index: string, value: IDBValidKey): Promise<T | undefined> {
  return tx(store, 'readonly', (s) => s.index(index).get(value));
}

export async function getAllByIndex<T>(store: StoreName, index: string, value: IDBValidKey): Promise<T[]> {
  return tx(store, 'readonly', (s) => s.index(index).getAll(value));
}

export async function put<T extends object>(store: StoreName, value: T): Promise<T & { id?: number }> {
  return openDb().then(
    (database) =>
      new Promise((resolve, reject) => {
        const transaction = database.transaction(store, 'readwrite');
        const objectStore = transaction.objectStore(store);
        const request = objectStore.put(value);
        request.onsuccess = () => {
          const id = request.result;
          resolve(typeof id === 'number' && !('id' in value && (value as { id?: number }).id) ? ({ ...value, id } as T & { id?: number }) : (value as T & { id?: number }));
        };
        request.onerror = () => reject(request.error);
      })
  );
}

export async function remove(store: StoreName, id: number): Promise<void> {
  return tx(store, 'readwrite', (s) => s.delete(id)).then(() => undefined);
}

export async function getMeta<T>(key: string): Promise<T | undefined> {
  const row = await tx<{ key: string; value: T } | undefined>('meta', 'readonly', (s) => s.get(key));
  return row?.value;
}

export async function setMeta<T>(key: string, value: T): Promise<void> {
  await put('meta', { key, value });
}
