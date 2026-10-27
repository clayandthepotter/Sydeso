"use client";

import { useRouter } from "next/navigation";
import { useEffect, useMemo, useRef, useState } from "react";

import { Icon, type IconName } from "./icons";

export interface Command {
  href: string;
  label: string;
  group: string;
  icon?: IconName;
}

/**
 * ⌘K navigation. The commands are the pages the current shell links to; typing filters them,
 * arrows move, Enter opens. Opened from the sidebar search button or the keyboard.
 */
export function CommandBar({ commands }: { commands: Command[] }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);
  const input = useRef<HTMLInputElement>(null);

  const matches = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? commands.filter(command => `${command.group} ${command.label}`.toLowerCase().includes(q)) : commands;
  }, [commands, query]);

  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setOpen(value => !value);
      } else if (event.key === "Escape") {
        setOpen(false);
      }
    };
    const onOpen = () => setOpen(true);
    window.addEventListener("keydown", onKey);
    window.addEventListener("sydeso:command", onOpen);
    return () => {
      window.removeEventListener("keydown", onKey);
      window.removeEventListener("sydeso:command", onOpen);
    };
  }, []);

  useEffect(() => {
    if (open) {
      setQuery("");
      setActive(0);
      requestAnimationFrame(() => input.current?.focus());
    }
  }, [open]);

  useEffect(() => {
    setActive(0);
  }, [query]);

  if (!open) return null;

  const go = (command: Command | undefined) => {
    if (!command) return;
    setOpen(false);
    router.push(command.href);
  };

  return (
    <div className="cmd" role="dialog" aria-modal="true" aria-label="Go to" onMouseDown={event => event.target === event.currentTarget && setOpen(false)}>
      <div className="cmd__box">
        <input
          ref={input}
          className="cmd__input"
          placeholder="Go to…"
          value={query}
          onChange={event => setQuery(event.target.value)}
          onKeyDown={event => {
            if (event.key === "ArrowDown") {
              event.preventDefault();
              setActive(value => Math.min(value + 1, matches.length - 1));
            } else if (event.key === "ArrowUp") {
              event.preventDefault();
              setActive(value => Math.max(value - 1, 0));
            } else if (event.key === "Enter") {
              event.preventDefault();
              go(matches[active]);
            }
          }}
          role="combobox"
          aria-expanded="true"
          aria-controls="cmd-list"
          aria-activedescendant={matches[active] ? `cmd-${active}` : undefined}
        />
        <div className="cmd__list" id="cmd-list" role="listbox">
          {matches.length === 0 && <p className="cmd__empty">Nothing matches “{query}”.</p>}
          {matches.map((command, index) => (
            <button
              key={command.href}
              id={`cmd-${index}`}
              className="cmd__item"
              type="button"
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onClick={() => go(command)}
            >
              <Icon name={command.icon ?? "chevron-right"} />
              <span>{command.label}</span>
              <span className="muted">{command.group}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

/** The sidebar's search button; it only raises the event the bar listens for. */
export function CommandButton({ wide = false }: { wide?: boolean }) {
  const open = () => window.dispatchEvent(new Event("sydeso:command"));
  if (wide) {
    return (
      <button className="btn search-btn" type="button" onClick={open}>
        <Icon name="search" size={14} />
        <span>Go to…</span>
        <kbd className="key mono">⌘K</kbd>
      </button>
    );
  }
  return (
    <button className="btn btn--icon" type="button" aria-label="Go to (⌘K)" title="Go to (⌘K)" onClick={open}>
      <Icon name="search" />
    </button>
  );
}
