import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
//
import { AlertProvider, useAlert, useAlertContainer } from "./context";
import type { Alert } from "./alert";

const DataTestId = {
  ALERT_CONTAINER: "hehe",
  ALERT: (v = 1) => `haha-${v}`,
  ALERT_ERROR: "wow!",
} as const;

function BaseAlert({ alert, idx }: { alert: Alert; idx: number }) {
  return (
    <div data-testid={DataTestId.ALERT(idx)}>
      {alert.title && <p>{alert.title}</p>}
      <p>{alert.message}</p>
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
  AlertContainer: () => JSX.Element
) {
  return (
    <AlertProvider alertContainer={<AlertContainer />}>
      {children}
    </AlertProvider>
  );
}

describe("AlertProvider", () => {
  it("should show error messages", async () => {
    function Dummy() {
      const { notifyError } = useAlert();
      function showError() {
        notifyError({
          message: "error",
        });
      }
      return (
        <button data-testid={DataTestId.ALERT_ERROR} onClick={showError}>
          Show Error
        </button>
      );
    }

    render(createAlertProvider(<Dummy />, createAlertContainer()));
    expect(screen.getByTestId(DataTestId.ALERT_ERROR)).toBeDefined();

    await userEvent.click(screen.getByTestId(DataTestId.ALERT_ERROR));

    expect(screen.getByTestId(DataTestId.ALERT(0))).toBeDefined();
  });
});
