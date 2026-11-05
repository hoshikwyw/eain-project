"use client";

import { useEffect, useState, useSyncExternalStore } from "react";

/** Changes closer together than this are one step: a burst of typing, one drag. */
const BURST_MS = 700;
const LIMIT = 100;

/**
 * Undo and redo over snapshots of a value. It lives outside React state so
 * recording a change never causes a render of its own; only the two "can"
 * flags are subscribed to.
 */
class HistoryStore<T> {
  private past: T[] = [];
  private future: T[] = [];
  private last: T;
  private lastAt = 0;
  /** The snapshot an undo or redo just asked for, so its arrival is not recorded as a new change. */
  private applied: string | null = null;
  private listeners = new Set<() => void>();

  constructor(initial: T) {
    this.last = initial;
  }

  subscribe = (listener: () => void) => {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  };

  /** Bit 1: can undo. Bit 2: can redo. */
  flags = () => (this.past.length > 0 ? 1 : 0) | (this.future.length > 0 ? 2 : 0);

  private emit() {
    this.listeners.forEach((listener) => listener());
  }

  record(value: T) {
    if (value === this.last) return;
    if (this.applied !== null) {
      const arrived = JSON.stringify(value) === this.applied;
      this.applied = null;
      if (arrived) {
        this.last = value;
        return;
      }
    }
    const now = Date.now();
    if (now - this.lastAt > BURST_MS) {
      this.past.push(this.last);
      if (this.past.length > LIMIT) this.past.shift();
    }
    this.future = [];
    this.last = value;
    this.lastAt = now;
    this.emit();
  }

  private step(from: T[], to: T[], apply: (value: T) => void) {
    const target = from.pop();
    if (target === undefined) return;
    to.push(this.last);
    this.last = target;
    this.lastAt = 0;
    this.applied = JSON.stringify(target);
    apply(target);
    this.emit();
  }

  undo(apply: (value: T) => void) {
    this.step(this.past, this.future, apply);
  }

  redo(apply: (value: T) => void) {
    this.step(this.future, this.past, apply);
  }
}

/**
 * Undo and redo for `value`. Every change to it is recorded; `apply` puts a
 * snapshot back. The value must be serialisable and change identity when it
 * changes.
 */
export function useHistory<T>(value: T, apply: (value: T) => void) {
  const [store] = useState(() => new HistoryStore(value));
  useEffect(() => store.record(value), [store, value]);
  const flags = useSyncExternalStore(store.subscribe, store.flags, () => 0);
  return {
    canUndo: (flags & 1) !== 0,
    canRedo: (flags & 2) !== 0,
    undo: () => store.undo(apply),
    redo: () => store.redo(apply),
  };
}
