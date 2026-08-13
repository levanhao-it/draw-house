// crypto.randomUUID() per copilot-instructions.md — no nanoid dependency
export function markerId(): string {
  return 'm_' + crypto.randomUUID().slice(0, 8);
}
