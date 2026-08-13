// Single-slot session persistence: localStorage (meta) + IndexedDB (image blobs)
import type { Marker, BrandKit, ImageKind } from '../types/index';
import type { AppState } from '../hooks/useScene';

const STORAGE_KEY = 'vecan:session';
const IDB_DB = 'vecan';
const IDB_VER = 1;
const IDB_STORE = 'images';

interface PersistedImage { id: string; kind: ImageKind; w: number; h: number }

export interface SessionSnapshot {
  markers: Marker[];
  ratio: AppState['ratio'];
  preset: AppState['preset'];
  displayMode: AppState['displayMode'];
  spotlightMode: AppState['spotlightMode'];
  brand: BrandKit;
  disclaimer: string;
  image: PersistedImage | null;
}

export interface RestoredSession {
  snapshot: SessionSnapshot;
  displaySrc: string | null;   // null when image blobs not found
  originalSrc: string | null;
}

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(IDB_DB, IDB_VER);
    req.onupgradeneeded = () => req.result.createObjectStore(IDB_STORE);
    req.onsuccess = () => resolve(req.result);
    req.onerror   = () => reject(req.error);
  });
}

async function putBlobs(displayBlob: Blob, originalBlob: Blob): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(IDB_STORE, 'readwrite');
    tx.objectStore(IDB_STORE).put({ displayBlob, originalBlob }, 'current');
    tx.oncomplete = () => { db.close(); resolve(); };
    tx.onerror    = () => { db.close(); reject(tx.error); };
  });
}

async function getBlobs(): Promise<{ displayBlob: Blob; originalBlob: Blob } | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx  = db.transaction(IDB_STORE, 'readonly');
    const req = tx.objectStore(IDB_STORE).get('current');
    req.onsuccess = () => { db.close(); resolve((req.result as { displayBlob: Blob; originalBlob: Blob } | undefined) ?? null); };
    req.onerror   = () => { db.close(); reject(req.error); };
  });
}

export async function saveSession(state: AppState): Promise<void> {
  const snapshot: SessionSnapshot = {
    markers:      state.markers,
    ratio:        state.ratio,
    preset:       state.preset,
    displayMode:  state.displayMode,
    spotlightMode: state.spotlightMode,
    brand:        state.brand,
    disclaimer:   state.disclaimer,
    image: state.image
      ? { id: state.image.id, kind: state.image.kind, w: state.image.w, h: state.image.h }
      : null,
  };

  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(snapshot)); } catch { /* quota */ }

  if (state.image) {
    try {
      const [dBlob, oBlob] = await Promise.all([
        fetch(state.image.displaySrc).then(r => r.blob()),
        fetch(state.image.originalSrc).then(r => r.blob()),
      ]);
      await putBlobs(dBlob, oBlob);
    } catch { /* revoked URL or quota — non-critical */ }
  }
}

export async function loadSession(): Promise<RestoredSession | null> {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return null;

  let snapshot: SessionSnapshot;
  try { snapshot = JSON.parse(raw) as SessionSnapshot; } catch { return null; }

  if (!snapshot.image) return { snapshot, displaySrc: null, originalSrc: null };

  try {
    const blobs = await getBlobs();
    if (!blobs) return { snapshot, displaySrc: null, originalSrc: null };
    return {
      snapshot,
      displaySrc:  URL.createObjectURL(blobs.displayBlob),
      originalSrc: URL.createObjectURL(blobs.originalBlob),
    };
  } catch {
    return { snapshot, displaySrc: null, originalSrc: null };
  }
}
