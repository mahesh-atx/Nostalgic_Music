const DB_NAME = "dhaba-background";
const STORE_NAME = "background";
const KEY_IMAGE = "custom-image";
const KEY_NAME = "custom-name";

const listeners = new Set<() => void>();

let dbPromise: Promise<IDBDatabase> | null = null;

function getDb(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    request.onupgradeneeded = () => {
      if (!request.result.objectStoreNames.contains(STORE_NAME)) {
        request.result.createObjectStore(STORE_NAME);
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => {
      dbPromise = null;
      reject(request.error);
    };
  });
  return dbPromise;
}

async function idbGet<T>(key: string): Promise<T | null> {
  try {
    const db = await getDb();
    return await new Promise<T | null>((resolve, reject) => {
      const request = db
        .transaction(STORE_NAME, "readonly")
        .objectStore(STORE_NAME)
        .get(key);
      request.onsuccess = () => resolve((request.result as T | undefined) ?? null);
      request.onerror = () => reject(request.error);
    });
  } catch {
    return null;
  }
}

async function idbSet(key: string, value: unknown): Promise<void> {
  const db = await getDb();
  await new Promise<void>((resolve, reject) => {
    const request = db
      .transaction(STORE_NAME, "readwrite")
      .objectStore(STORE_NAME)
      .put(value, key);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

async function idbDelete(key: string): Promise<void> {
  try {
    const db = await getDb();
    await new Promise<void>((resolve, reject) => {
      const request = db
        .transaction(STORE_NAME, "readwrite")
        .objectStore(STORE_NAME)
        .delete(key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch {
    // nothing stored yet
  }
}

export async function getBackgroundImage(): Promise<Blob | null> {
  if (typeof window === "undefined") return null;
  return idbGet<Blob>(KEY_IMAGE);
}

let cachedName: string | null = null;
let nameLoaded = false;

function refreshName() {
  try {
    cachedName = window.localStorage.getItem(KEY_NAME);
  } catch {
    cachedName = null;
  }
  nameLoaded = true;
}

export function getSavedBackgroundName(): string | null {
  if (typeof window === "undefined") return null;
  if (!nameLoaded) refreshName();
  return cachedName;
}

export async function saveBackground(blob: Blob, name: string) {
  await idbSet(KEY_IMAGE, blob);
  try {
    window.localStorage.setItem(KEY_NAME, name);
  } catch {
    // image still works for this session
  }
  refreshName();
  emitBackgroundChange();
}

export async function clearBackground() {
  await idbDelete(KEY_IMAGE);
  try {
    window.localStorage.removeItem(KEY_NAME);
  } catch {
    // ignore
  }
  refreshName();
  emitBackgroundChange();
}

function emitBackgroundChange() {
  listeners.forEach((listener) => listener());
}

export function subscribeBackground(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}