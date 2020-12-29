export function hashCode(s: string): number {
  let hash = 0;
  if (s.length === 0) {
    return hash;
  }

  for (let i = 0; i < s.length; i++) {
    const char = s.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash &= hash; // Convert to 32bit integer
    // hash &= hash; // Convert to 32bit integer
  }

  return hash;
}
