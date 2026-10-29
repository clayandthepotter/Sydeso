import type { Clock, IdGenerator } from "@desk/domain";

/** A clock that only moves when a test moves it. */
export class FixedClock implements Clock {
  private current: Date;

  constructor(start: string | Date) {
    this.current = new Date(start);
  }

  now(): Date {
    return new Date(this.current);
  }

  set(to: string | Date): void {
    this.current = new Date(to);
  }

  advanceMinutes(minutes: number): void {
    this.current = new Date(this.current.getTime() + minutes * 60_000);
  }
}

/** Gives predictable IDs: prefix-1, prefix-2, and so on. */
export class SequentialIds implements IdGenerator {
  private count = 0;

  constructor(private readonly prefix: string) {}

  next(): string {
    this.count += 1;
    return `${this.prefix}-${this.count}`;
  }
}
