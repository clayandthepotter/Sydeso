import { browserSupportsWebAuthn, startAuthentication, startRegistration } from "@simplewebauthn/browser";
import { createNoteBox, EmptyNoteError, type LocalNote, type NoteBox } from "../note-box.js";
import { api, ApiError, ERROR_TEXT, type User } from "./api.js";
import { BrowserConnectivity } from "./connectivity.js";
import { IndexedDbNoteStore } from "./idb.js";
import { HttpSyncTransport } from "./transport.js";

const USER_KEY = "desk.user";
const DEVICE_KEY = "desk.deviceId";
const MAX_NOTE_LENGTH = 20_000;
const RETRY_MS = 15_000;

/* Small DOM helpers. Text always goes in with textContent. */

type Attrs = Record<string, string | boolean | ((event: Event) => void)>;

function h<K extends keyof HTMLElementTagNameMap>(tag: K, attrs: Attrs = {}, ...children: Array<Node | string | null>) {
  const element = document.createElement(tag);
  for (const [key, value] of Object.entries(attrs)) {
    if (typeof value === "function") element.addEventListener(key.replace(/^on/, ""), value);
    else if (value === true) element.setAttribute(key, "");
    else if (value !== false) element.setAttribute(key, value);
  }
  for (const child of children) if (child !== null) element.append(child);
  return element;
}

const root = document.getElementById("app") as HTMLElement;
const show = (...nodes: Node[]) => root.replaceChildren(...nodes);

const storage = {
  get(key: string): string | null {
    try {
      return localStorage.getItem(key);
    } catch {
      return null;
    }
  },
  set(key: string, value: string) {
    try {
      localStorage.setItem(key, value);
    } catch {
      // Private mode can block storage. The app still works for this visit.
    }
  },
  remove(key: string) {
    try {
      localStorage.removeItem(key);
    } catch {
      // Nothing to do.
    }
  },
};

const cachedUser = (): User | null => {
  const raw = storage.get(USER_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as User;
  } catch {
    return null;
  }
};

const deviceId = () => {
  let id = storage.get(DEVICE_KEY);
  if (!id) {
    id = crypto.randomUUID();
    storage.set(DEVICE_KEY, id);
  }
  return id;
};

const errorText = (error: unknown) => {
  if (error instanceof ApiError) return ERROR_TEXT[error.code] ?? "Something went wrong. Try again.";
  if (error instanceof DOMException && error.name === "NotAllowedError") return "The passkey request was stopped. Try again.";
  return "Something went wrong. Try again.";
};

const notice = (text: string, kind: "error" | "info" = "error") => h("p", { class: `notice ${kind}`, role: "status" }, text);

const brand = () =>
  h("div", { class: "brand" }, h("img", { src: "/icons/icon.svg", alt: "", width: "28", height: "28" }), h("span", {}, "Desk"));

/* Sign-in */

function signInView(message?: string) {
  const status = h("div", { class: "slot" });
  if (message) status.append(notice(message, "info"));
  let pending: Promise<{ challengeId: string; options: unknown }> | null = null;
  // Get the challenge before the tap. Safari needs the passkey call to start from the tap.
  const prefetch = () => {
    pending = api.loginOptions();
    pending.catch(() => undefined);
  };
  if (navigator.onLine) prefetch();

  const button = h(
    "button",
    {
      class: "primary",
      type: "button",
      onclick: async () => {
        status.replaceChildren();
        if (!navigator.onLine) {
          status.append(notice("You are offline. Connect to sign in."));
          return;
        }
        button.toggleAttribute("disabled", true);
        try {
          const { challengeId, options } = await (pending ?? api.loginOptions());
          const response = await startAuthentication({ optionsJSON: options as never });
          const { user } = await api.loginVerify(challengeId, response);
          signedIn(user);
        } catch (error) {
          status.append(notice(errorText(error)));
          prefetch();
        } finally {
          button.toggleAttribute("disabled", false);
        }
      },
    },
    "Sign in with a passkey",
  );

  show(
    h(
      "main",
      { class: "auth" },
      brand(),
      h("h1", {}, "Sign in"),
      h("p", { class: "lede" }, "Capture notes. Plan your day. Your notes stay on this device when you are offline."),
      browserSupportsWebAuthn() ? button : notice("This browser does not support passkeys. Use a current browser."),
      status,
      h("p", { class: "fine" }, "New to Desk? Open the invite link that you got."),
    ),
  );
}

/* Join with an invite */

function joinView(inviteCode: string) {
  const status = h("div", { class: "slot" });
  const detectedZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
  const email = h("input", { type: "email", name: "email", autocomplete: "username webauthn", required: true, maxlength: "254" });
  const name = h("input", { type: "text", name: "name", autocomplete: "name", required: true, maxlength: "80" });
  const zone = h("input", { type: "text", name: "timeZone", value: detectedZone, required: true, spellcheck: "false" });
  const steps = h("div", { class: "slot" });

  const form = h(
    "form",
    {
      class: "stack",
      onsubmit: async (event: Event) => {
        event.preventDefault();
        status.replaceChildren();
        steps.replaceChildren();
        const submit = form.querySelector("button");
        submit?.toggleAttribute("disabled", true);
        try {
          const { challengeId, options } = await api.registerOptions({
            inviteCode,
            email: email.value,
            displayName: name.value,
            timeZone: zone.value.trim(),
          });
          // A second tap starts the passkey. Safari needs the passkey call to start from a tap.
          const create = h(
            "button",
            {
              class: "primary",
              type: "button",
              onclick: async () => {
                status.replaceChildren();
                create.toggleAttribute("disabled", true);
                try {
                  const response = await startRegistration({ optionsJSON: options as never });
                  const { user } = await api.registerVerify(challengeId, response);
                  history.replaceState(null, "", "/");
                  signedIn(user);
                } catch (error) {
                  status.append(notice(errorText(error)));
                  steps.replaceChildren();
                  submit?.toggleAttribute("disabled", false);
                }
              },
            },
            "Create passkey",
          );
          steps.append(h("p", { class: "fine" }, "Your device saves the passkey. You sign in with Face ID, a fingerprint, or your screen lock."), create);
        } catch (error) {
          status.append(notice(errorText(error)));
          submit?.toggleAttribute("disabled", false);
        }
      },
    },
    h("label", {}, h("span", {}, "Email"), email),
    h("label", {}, h("span", {}, "Name"), name),
    h("label", {}, h("span", {}, "Time zone"), zone),
    h("button", { type: "submit", class: "secondary" }, "Continue"),
  );

  show(
    h(
      "main",
      { class: "auth" },
      brand(),
      h("h1", {}, "Join Desk"),
      h("p", { class: "lede" }, "Make your account. Desk uses a passkey. There is no password."),
      browserSupportsWebAuthn() ? form : notice("This browser does not support passkeys. Use a current browser."),
      steps,
      status,
    ),
  );
}

/* Notes */

let noteBox: NoteBox | null = null;
let local: IndexedDbNoteStore | null = null;
/** True when a sync got 401. The banner asks the person to sign in again. */
let sessionEnded = false;
/** Draws the notes view again. It is a no-op when the notes view is not on screen. */
let rerender: () => Promise<void> = async () => undefined;

/** Makes the note box and its listeners once per page load. */
function ensureNoteBox(user: User): { box: NoteBox; store: IndexedDbNoteStore } {
  local ??= new IndexedDbNoteStore();
  const store = local;
  if (!noteBox) {
    const box = createNoteBox({
      local: store,
      transport: new HttpSyncTransport(deviceId(), () => {
        sessionEnded = true;
        void rerender();
      }),
      connectivity: new BrowserConnectivity(),
      clock: { now: () => new Date() },
      ids: { next: () => crypto.randomUUID() },
      timeZone: user.timeZone,
    });
    box.onChange(() => void rerender());
    window.addEventListener("online", () => void rerender());
    window.addEventListener("offline", () => void rerender());
    document.addEventListener("visibilitychange", () => {
      if (document.visibilityState === "visible") void box.sync();
    });
    setInterval(() => void box.sync(), RETRY_MS);
    noteBox = box;
  }
  return { box: noteBox, store };
}

function timeLabel(capturedAt: string, timeZone: string) {
  return new Intl.DateTimeFormat(undefined, {
    timeZone,
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(capturedAt));
}

async function mergeServerNotes(store: IndexedDbNoteStore) {
  const { notes } = await api.notes();
  for (const note of notes) {
    if (!(await store.get(note.noteId))) await store.put({ ...note, syncState: "synced" });
  }
}

function notesView(user: User) {
  const { box, store } = ensureNoteBox(user);

  const chip = h("span", { class: "chip" });
  const banner = h("div", { class: "slot" });
  const list = h("ul", { class: "notes", "aria-live": "polite" });
  const text = h("textarea", {
    name: "note",
    rows: "4",
    maxlength: String(MAX_NOTE_LENGTH),
    placeholder: "Type a note. For example: send Dana the SOW by Friday",
    "aria-label": "Note",
    autofocus: location.pathname === "/capture",
  });
  const formStatus = h("div", { class: "slot" });

  const render = async () => {
    const notes = await box.list();
    const pending = notes.filter((note) => note.syncState === "pending").length;
    const online = navigator.onLine;
    // navigator.onLine can be true on a bad connection. So the chip shows pending notes, not only the network state.
    chip.textContent = !online ? (pending ? `Offline, ${pending} on device` : "Offline") : pending ? `${pending} waiting to sync` : "Synced";
    chip.className = `chip ${online ? (pending ? "warn" : "ok") : "warn"}`;
    banner.replaceChildren();
    if (sessionEnded) {
      banner.append(
        h(
          "div",
          { class: "notice info" },
          h("span", {}, "Your session ended. Your notes are safe on this device. "),
          h(
            "button",
            {
              type: "button",
              class: "link",
              onclick: () => {
                rerender = async () => undefined;
                signInView("Sign in to sync your notes.");
              },
            },
            "Sign in",
          ),
        ),
      );
    }
    list.replaceChildren(
      ...(notes.length === 0
        ? [h("li", { class: "empty" }, "No notes yet. Type one above.")]
        : notes.map((note: LocalNote) =>
            h(
              "li",
              {},
              h("p", { class: "text" }, note.text),
              h(
                "p",
                { class: "meta" },
                h("time", { datetime: note.capturedAt }, timeLabel(note.capturedAt, user.timeZone)),
                h("span", { class: note.syncState === "synced" ? "state ok" : "state warn" }, note.syncState === "synced" ? "Synced" : "On this device"),
              ),
            ),
          )),
    );
  };

  const save = async () => {
    formStatus.replaceChildren();
    try {
      const saving = box.save(text.value);
      text.value = "";
      await saving;
    } catch (error) {
      if (error instanceof EmptyNoteError) formStatus.append(notice("Type a note first."));
      else formStatus.append(notice("The note was not saved. Try again."));
    }
    text.focus();
  };

  text.addEventListener("keydown", (event) => {
    if (event.key === "Enter" && (event.metaKey || event.ctrlKey)) {
      event.preventDefault();
      void save();
    }
  });

  rerender = render;

  const signOut = async () => {
    const pending = (await box.list()).filter((note) => note.syncState === "pending").length;
    if (pending > 0 && !confirm(`${pending} notes are only on this device. Sign out removes them. Continue?`)) return;
    await api.logout().catch(() => undefined);
    await store.clear();
    storage.remove(USER_KEY);
    location.replace("/");
  };

  show(
    h(
      "main",
      { class: "desk" },
      h(
        "header",
        {},
        brand(),
        chip,
        h("button", { type: "button", class: "ghost", onclick: () => void signOut(), title: `Signed in as ${user.email}` }, "Sign out"),
      ),
      banner,
      h(
        "form",
        {
          class: "capture",
          onsubmit: (event: Event) => {
            event.preventDefault();
            void save();
          },
        },
        text,
        h("div", { class: "row" }, h("span", { class: "fine" }, "Saved on this device first."), h("button", { type: "submit", class: "primary" }, "Save note")),
        formStatus,
      ),
      h("h2", {}, "Notes"),
      list,
    ),
  );

  void render();
  if (navigator.onLine) {
    void box.sync();
    mergeServerNotes(store)
      .then(render)
      .catch(() => undefined);
  }
}

function signedIn(user: User) {
  storage.set(USER_KEY, JSON.stringify(user));
  sessionEnded = false;
  notesView(user);
  void noteBox?.sync();
}

async function start() {
  const url = new URL(location.href);
  if (url.pathname === "/join") {
    const code = url.searchParams.get("code") ?? "";
    if (code) return joinView(code);
  }

  const cached = cachedUser();
  // Offline: trust the cached account, so the note box works in a meeting with no signal.
  if (cached) notesView(cached);
  if (!navigator.onLine) {
    if (!cached) signInView("You are offline. Connect once to sign in.");
    return;
  }
  try {
    const { user } = await api.me();
    if (!cached || cached.email !== user.email || cached.timeZone !== user.timeZone) signedIn(user);
    else storage.set(USER_KEY, JSON.stringify(user));
  } catch (error) {
    if (error instanceof ApiError && error.status === 401) {
      if (cached) {
        // Keep the note box. The banner asks the person to sign in again.
        void noteBox?.sync();
      } else signInView();
    } else if (!cached) signInView();
  }
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => undefined);
  });
}

void start();
