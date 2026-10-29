import type { Connectivity } from "../note-box.js";

export class BrowserConnectivity implements Connectivity {
  isOnline(): boolean {
    return navigator.onLine;
  }

  onOnline(listener: () => void): void {
    window.addEventListener("online", () => listener());
  }
}
