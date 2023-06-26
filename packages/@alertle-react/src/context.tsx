import {
  createContext,
  useRef,
  useCallback,
  useEffect,
  useContext,
  useState,
  type ReactNode,
} from "react";
// Our imports
import {
  createAlert,
  AlertType,
  type Alert,
  type CreateAlertParams,
} from "./alert";

// Types
type AlertFnParams = CreateAlertParams;

type UpdateAlertFnParams = Partial<
  Pick<Alert, "expiresInMs" | "onExpire" | "isDuplicate" | "onDuplicated">
>;

type ExpireAlertFn = (alert: Alert) => void;
type UpdateAlertFn = (alert: Alert, args: UpdateAlertFnParams) => Alert;

type AlertContainerContext = {
  getAlertMap: () => Map<string, Alert>;
  subscribe: (cb: () => void) => () => boolean;
  expireAlert: ExpireAlertFn;
  updateAlert: UpdateAlertFn;
};

type AlertContext = {
  notify: (args: AlertFnParams) => Alert;
  notifySuccess: (args: Omit<AlertFnParams, "type">) => Alert;
  notifyError: (args: Omit<AlertFnParams, "type">) => Alert;
  notifyWarning: (args: Omit<AlertFnParams, "type">) => Alert;
  notifyInfo: (args: Omit<AlertFnParams, "type">) => Alert;
  expireAlert: ExpireAlertFn;
  updateAlert: UpdateAlertFn;
};

export const AlertContainerContext =
  createContext<AlertContainerContext | null>(null);
export const AlertContext = createContext<AlertContext | null>(null);

export type AlertConfig = {
  /**
   * Default value for `expiresInMs` of an alert.
   * If no value is provided for `expiresInMs` when an alert is created,
   * this value will be used.
   */
  defaultExpiresInMs?: number;
};

type AlertProviderProps = AlertConfig & {
  children: ReactNode;
  alertContainer: ReactNode;
};

export function AlertProvider(props: AlertProviderProps) {
  const timeoutsRef = useRef<Map<string, NodeJS.Timeout>>(new Map());
  const store = useRef(new Map<string, Alert>());
  const subscribers = useRef(new Set<() => void>());

  useEffect(() => {
    const timeouts = timeoutsRef.current;

    return () => {
      for (const timeout of Array.from(timeouts.values())) {
        clearTimeout(timeout);
      }
    };
  }, []);

  const getAlertMap = useCallback(() => store.current, []);

  const subscribe = useCallback((cb: () => void) => {
    subscribers.current.add(cb);
    return () => subscribers.current.delete(cb);
  }, []);

  const expireAlert = useCallback((alert: Alert) => {
    const deleted = store.current.delete(alert.key);

    if (!deleted) {
      return;
    }

    if (alert.onExpire) {
      alert.onExpire(alert);
    }

    timeoutsRef.current.delete(alert.key);
    store.current = new Map(store.current);
    subscribers.current.forEach((cb) => cb());
  }, []);

  const addAlert = useCallback(
    (alert: Alert) => {
      if (store.current.get(alert.key)) {
        alert.isDuplicate = true;

        if (alert.onDuplicated) {
          alert.onDuplicated(alert);
        }

        const timeout = timeoutsRef.current.get(alert.key);
        if (timeout) {
          timeoutsRef.current.delete(alert.key);
          clearTimeout(timeout);
        }
      }

      if (alert.onNotify) {
        alert.onNotify(alert);
      }

      if (alert.expiresInMs !== null && alert.expiresInMs !== Infinity) {
        if (alert.expiresInMs === 0) {
          return alert;
        }

        const timeout = setTimeout(() => {
          expireAlert(alert);
        }, alert.expiresInMs);

        timeoutsRef.current.set(alert.key, timeout);
      }

      store.current.set(alert.key, alert);
      store.current = new Map(store.current);
      subscribers.current.forEach((cb) => cb());

      return alert;
    },
    [expireAlert]
  );

  const updateAlert = useCallback(
    (alert: Alert, params: UpdateAlertFnParams) => {
      if (params.expiresInMs !== undefined) {
        const nodeTimeout = timeoutsRef.current.get(alert.key);
        if (nodeTimeout) {
          timeoutsRef.current.delete(alert.key);
          clearTimeout(nodeTimeout);
        }

        if (params.expiresInMs !== null && params.expiresInMs !== Infinity) {
          const timeout = setTimeout(() => {
            expireAlert(alert);
          }, params.expiresInMs);

          timeoutsRef.current.set(alert.key, timeout);
        }
      }

      if (params.onExpire) {
        alert.onExpire = params.onExpire;
      }

      if (params.onDuplicated) {
        alert.onDuplicated = params.onDuplicated;
      }

      if (params.isDuplicate !== undefined) {
        alert.isDuplicate = params.isDuplicate;
      }

      store.current.set(alert.key, alert);
      store.current = new Map(store.current);

      subscribers.current.forEach((cb) => cb());

      return alert;
    },
    [expireAlert]
  );

  // TODO: Add pause alert fn

  const notify = useCallback(
    (params: AlertFnParams): Alert => {
      const alert = createAlert({
        ...params,
        expiresInMs:
          params.expiresInMs !== undefined
            ? params.expiresInMs
            : props.defaultExpiresInMs,
      });
      return addAlert(alert);
    },
    [addAlert]
  );

  const notifySuccess = useCallback(
    (params: Omit<AlertFnParams, "type">): Alert => {
      return notify({ ...params, type: AlertType.SUCCESS });
    },
    [notify]
  );

  const notifyError = useCallback(
    (params: Omit<AlertFnParams, "type">): Alert => {
      return notify({ ...params, type: AlertType.ERROR });
    },
    [notify]
  );

  const notifyWarning = useCallback(
    (params: Omit<AlertFnParams, "type">): Alert => {
      return notify({ ...params, type: AlertType.WARNING });
    },
    [notify]
  );

  const notifyInfo = useCallback(
    (params: Omit<AlertFnParams, "type">): Alert => {
      return notify({ ...params, type: AlertType.INFO });
    },
    [notify]
  );

  return (
    <AlertContext.Provider
      value={{
        notify,
        notifyWarning,
        notifyError,
        notifySuccess,
        notifyInfo,
        expireAlert,
        updateAlert,
      }}
    >
      <AlertContainerContext.Provider
        value={{ getAlertMap, updateAlert, expireAlert, subscribe }}
      >
        {props.alertContainer}
      </AlertContainerContext.Provider>
      {props.children}
    </AlertContext.Provider>
  );
}

export function useAlertContainer() {
  const store = useContext(AlertContainerContext);

  if (!store) {
    throw new Error(
      "`useAlertContainer` can only be used within a `<AlertProvider /> provider."
    );
  }

  const [state, setState] = useState(store.getAlertMap());

  useEffect(() => {
    return store.subscribe(() => setState(store.getAlertMap())) as () => void;
  }, []);

  return {
    state,
    expireAlert: store.expireAlert,
    updateAlert: store.updateAlert,
  };
}

export function useAlert() {
  const context = useContext(AlertContext);

  if (!context) {
    throw new Error(
      "`useAlert` can only be used within a `<AlertProvider />` provider."
    );
  }

  return context;
}
