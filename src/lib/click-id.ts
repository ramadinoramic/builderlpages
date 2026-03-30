import { nanoid } from "nanoid";

export function generateClickId(): string {
  return nanoid(12);
}
