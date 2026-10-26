/** Small deterministic PRNG. Runtime seeds vary; tests supply fixed seeds. */
export function random(seed: number): { value: number; seed: number } {
  const next = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
  return { value: next / 4294967296, seed: next };
}
