import type { LocalNote, LocalNoteStore } from "../note-box.js";

const DB_NAME = "desk";
const STORE = "notes";

const request = <T>(req: IDBRequest<T>) =>
  new Promise<T>((resolve, reject) => {
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });

/** Notes on this device, in IndexedDB. They stay when the app is closed or offline. */
export class IndexedDbNoteStore implements LocalNoteStore {
  private readonly db: Promise<IDBDatabase>;

  constructor() {
    this.db = new Promise((resolve, reject) => {
      const open = indexedDB.open(DB_NAME, 1);
      open.onupgradeneeded = () => open.result.createObjectStore(STORE, { keyPath: "noteId" });
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
  }

  private async store(mode: IDBTransactionMode) {
    return (await this.db).transaction(STORE, mode).objectStore(STORE);
  }

  async put(note: LocalNote): Promise<void> {
    await request((await this.store("readwrite")).put(note));
  }

  async get(noteId: string): Promise<LocalNote | undefined> {
    return request((await this.store("readonly")).get(noteId) as IDBRequest<LocalNote | undefined>);
  }

  async list(): Promise<readonly LocalNote[]> {
    return request((await this.store("readonly")).getAll() as IDBRequest<LocalNote[]>);
  }

  async clear(): Promise<void> {
    await request((await this.store("readwrite")).clear());
  }
}
