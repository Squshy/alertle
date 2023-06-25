import { describe, it, expect, vi } from "vitest";
import { render, screen, act } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
//
import {
  AlertProvider,
  useAlert,
  useAlertContainer,
  AlertConfig,
} from "./context";
import { Alert, AlertType } from "./alert";

const DataTestId = {
  ALERT_CONTAINER: "alert-container",
  ALERT: (v = 0) => `alert-${v}`,
  ALERT_ERROR_BTN: "alert-error-btn",
  ALERT_SUCCESS_BTN: "alert-success-btn",
  ALERT_WARNING_BTN: "alert-warning-btn",
  ALERT_INFO_BTN: "alert-info-btn",
  ALERT_BTN: "alert-btn",
  EXPIRE_ALERT_BTN: "expire-alert-btn",
} as const;

type DataTestId = typeof DataTestId[keyof typeof DataTestId];

async function waitForExpiry(expiresInMs: number) {
  await act(async () => {
    await new Promise((r) => setTimeout(r, expiresInMs));
  });
}

function BaseAlert({ alert, idx }: { alert: Alert; idx: number }) {
  return (
    <div data-testid={DataTestId.ALERT(idx)}>
      {alert.title && <p>{alert.title}</p>}
      <p>{alert.message}</p>
      <p>type: {alert.type}</p>
    </div>
  );
}

function createAlertContainer() {
  return function () {
    const { state } = useAlertContainer();

    return (
      <div data-testid={DataTestId.ALERT_CONTAINER}>
        {Array.from(state.values()).map((alert, i) => (
          <BaseAlert key={alert.key} alert={alert} idx={i} />
        ))}
      </div>
    );
  };
}

function createAlertProvider(
  children: JSX.Element,
  AlertContainer: () => JSX.Element = createAlertContainer(),
  config?: AlertConfig
) {
  return (
    <AlertProvider alertContainer={<AlertContainer />} {...config}>
      {children}
    </AlertProvider>
  );
}

describe("AlertProvider", () => {
  it("should show the appropriate alerts per alert fn", async () => {
    function Dummy() {
      const { notifyError, notifySuccess, notifyWarning, notifyInfo } =
        useAlert();

      const fns = [
        [notifyError, "ERROR"],
        [notifySuccess, "SUCCESS"],
        [notifyWarning, "WARNING"],
        [notifyInfo, "INFO"],
      ] as const;

      return (
        <>
          {fns.map(([fn, msg]) => {
            return (
              <button
                key={msg}
                data-testid={DataTestId[`ALERT_${msg}_BTN`]}
                onClick={() => fn({ message: msg, title: "title" })}
              />
            );
          })}
        </>
      );
    }

    render(createAlertProvider(<Dummy />, createAlertContainer()));
    expect(screen.getByTestId(DataTestId.ALERT_ERROR_BTN)).toBeDefined();

    for (const [i, alertType] of Array.from(
      Object.values(AlertType).entries()
    )) {
      await userEvent.click(
        screen.getByTestId(
          DataTestId[`ALERT_${alertType.toUpperCase()}_BTN` as keyof DataTestId]
        )
      );
      expect(screen.getByTestId(DataTestId.ALERT(i))).toBeDefined();
      expect(
        screen.getByText(`type: ${alertType.toLowerCase()}`)
      ).toBeDefined();
    }
  });

  it("should be able to show custom information on the alert", async () => {
    const message = "my-message";
    const title = "my-title";

    function Dummy() {
      const { notify } = useAlert();

      return (
        <button
          data-testid={DataTestId.ALERT_BTN}
          onClick={() =>
            notify({
              title,
              message,
              type: AlertType.INFO,
            })
          }
        />
      );
    }

    render(createAlertProvider(<Dummy />));
    await userEvent.click(screen.getByTestId(DataTestId.ALERT_BTN));

    expect(screen.getByTestId(DataTestId.ALERT())).toBeDefined();
    expect(screen.getByText(title)).toBeDefined();
    expect(screen.getByText(message)).toBeDefined();
  });

  it("should expire after the given time", async () => {
    const expiresInMs = 100;
    function Dummy() {
      const { notifyInfo } = useAlert();

      return (
        <button
          data-testid={DataTestId.ALERT_BTN}
          onClick={() =>
            notifyInfo({
              message: "",
              title: "info",
              expiresInMs,
            })
          }
        />
      );
    }

    render(createAlertProvider(<Dummy />));
    await userEvent.click(screen.getByTestId(DataTestId.ALERT_BTN));

    expect(screen.getByTestId(DataTestId.ALERT())).toBeDefined();
    await waitForExpiry(expiresInMs);
    expect(screen.queryByTestId(DataTestId.ALERT())).toBeNull();
  });

  it("should call the callback functions for initial, duplicated, and expiry", async () => {
    const notify = vi.fn();
    const expiry = vi.fn();
    const duplicated = vi.fn();
    const expiresInMs = 100;

    function Dummy() {
      const { notifyInfo } = useAlert();

      return (
        <button
          data-testid={DataTestId.ALERT_BTN}
          onClick={() =>
            notifyInfo({
              message: "info",
              title: "info",
              onExpire: expiry,
              onNotify: notify,
              onDuplicated: duplicated,
              expiresInMs,
            })
          }
        />
      );
    }

    render(createAlertProvider(<Dummy />));
    await userEvent.click(screen.getByTestId(DataTestId.ALERT_BTN));
    await userEvent.click(screen.getByTestId(DataTestId.ALERT_BTN));
    await waitForExpiry(expiresInMs);
    expect(expiry).toHaveBeenCalledOnce();
    expect(duplicated).toHaveBeenCalledOnce();
    expect(notify).toHaveBeenCalledTimes(2);
  });

  it("should use the default `expiresInMs`", async () => {
    const defaultExpiresInMs = 100;
    function Dummy() {
      const { notifyInfo, notifySuccess } = useAlert();

      return (
        <button
          data-testid={DataTestId.ALERT_BTN}
          onClick={() => {
            notifySuccess({
              title: "success",
              message: "success",
              expiresInMs: defaultExpiresInMs * 2,
            });
            notifyInfo({ title: "info", message: "info" });
          }}
        />
      );
    }

    render(
      createAlertProvider(<Dummy />, createAlertContainer(), {
        defaultExpiresInMs,
      })
    );
    await userEvent.click(screen.getByTestId(DataTestId.ALERT_BTN));
    expect(screen.getByTestId(DataTestId.ALERT())).toBeDefined();
    expect(screen.getByTestId(DataTestId.ALERT(1))).toBeDefined();
    await waitForExpiry(defaultExpiresInMs);
    expect(screen.queryByTestId(DataTestId.ALERT(1))).toBeNull();
    expect(screen.getByTestId(DataTestId.ALERT())).toBeDefined();
  });
});
