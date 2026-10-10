/** Pending first, then newest first (the API already returns newest first; the sort is stable). */
export const pendingFirst = (leaves) =>
  [...(leaves ?? [])].sort((a, b) => (a.status === 'PENDING' ? 0 : 1) - (b.status === 'PENDING' ? 0 : 1));
