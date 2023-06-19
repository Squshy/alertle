import {
  createContext,
  useRef,
  useEffect,
  useCallback,
  // types
  type ReactNode,
} from "react";

// eslint-disable-next-line
type Alert = {};

const AlertContext = createContext(null);

type AlertProviderProps = {
  children: ReactNode;
};

export function AlertProvider(props: AlertProviderProps) {
  const store = useRef(new Map<string, Alert>());
  const subscribers = useRef(new Set<() => void>());

  const subscribe = useCallback((cb: () => void) => {
    subscribers.current.add(cb);
    return () => subscribers.current.delete(cb);
  }, []);

  return (
    <AlertContext.Provider value={null}>{props.children}</AlertContext.Provider>
  );
}
