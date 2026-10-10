import { Chips, useAuth } from '@ssa/shared';
import { createContext, useContext, useMemo, useState } from 'react';

const ChildContext = createContext(null);

/** Which of the parent's children the screens are showing. Defaults to the first child. */
export function ChildProvider({ children: content }) {
  const { children } = useAuth();
  const [selectedId, setSelectedId] = useState(null);
  const child = children.find((c) => c.id === selectedId) ?? children[0] ?? null;
  const value = useMemo(() => ({ child, children, setChildId: setSelectedId }), [child, children]);
  return <ChildContext.Provider value={value}>{content}</ChildContext.Provider>;
}

export function useChild() {
  return useContext(ChildContext);
}

/** Child picker shown at the top of child-specific screens (hidden with only one child). */
export function ChildSwitcher() {
  const { child, children, setChildId } = useChild();
  if (children.length < 2) return null;
  return (
    <Chips
      options={children.map((c) => ({ label: `${c.name.split(' ')[0]} · ${c.className}`, value: c.id }))}
      value={child?.id}
      onChange={setChildId}
    />
  );
}
