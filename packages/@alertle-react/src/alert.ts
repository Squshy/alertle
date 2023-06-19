export const AlertType = {
  SUCCESS: "success",
  ERROR: "error",
  WARNING: "warning",
  INFO: "info",
} as const;

export type AlertType = typeof AlertType[keyof typeof AlertType];

type AlertCbFn = ((node: Alert) => void) | undefined;

export type Alert<Type extends AlertType = AlertType> = {
  key: string;
  type: Type;
  title?: string | undefined;
  message: string;
  createdAt: number;
  expiresInMs: number | null;
  onNotify?: AlertCbFn;
  onExpire?: AlertCbFn;
  onDuplicated?: AlertCbFn;
  isDuplicate: boolean;
};

export function createAlert<Type extends AlertType = AlertType>({
  type,
  message,
  title,
  expiresInMs,
  onExpire,
  onNotify,
}: {
  type: Type;
  message: string;
  title?: string | undefined;
  expiresInMs?: number | null;
  onExpire?: AlertCbFn;
  onNotify?: AlertCbFn;
}): Alert {
  const messageKey = message.replace(/\s/g, "").toLocaleLowerCase();
  const titleKey = title?.replace(/\s/g, "").toLocaleLowerCase() || "";
  // TODO: Allow for duplicate keys
  const key = `${type}:${titleKey}:${messageKey}`;

  return {
    key,
    type,
    message,
    expiresInMs: expiresInMs || null,
    title,
    onNotify,
    onExpire,
    createdAt: Date.now(),
    isDuplicate: false,
  };
}
