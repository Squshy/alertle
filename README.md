<h2 align="center">
    @alertle/react
</h2>

<p align="center">
    A <i>moderatly fast</i> alert library.
</p>

## About

This library was inspired by Jack Harrington's [Making React Context FAST!](https://www.youtube.com/watch?v=ZKlXqrcBx88) video. Your entire application will not re-render everytime a new alert is created, only the container where the alerts live will re-render.

This library is headless meaning that **_you_** will need to control your UI. This means it can work with any UI/CSS framework you choose to use. This goes for the UI of the alerts and its container.

### Expiry

Alerts by default will never expire unless explicitly called to expire using the `expireAlert` function which is accessible through the `useAlertContainer` and `useAlert` hooks. When creating an alert, specifying a value for `expiresInMs` will expire the alert after the given time. If the value supplied is `null` or `Infinity` the alert will _not_ automagically expire. Alerts however can still expire after a delay if the `defaultExpiresInMs` prop is set for the `AlertProvider`. The value for this will be used (if present) when no value is specified for an alerts `expiresInMs`.

### Alert Types

By default, four alert types are provided. The default types are `success`, `error`, `warning` and `info`. Creating alerts of these types are as simple as calling their respective function from the `useAlert` hook. If you would like to use your own custom type you can use the base `notify` function and specify your desired alert `type`.

### Callbacks

Certain callbacks are available to alerts for `onExpire`, `onNotify`, and `onDuplicated`. They do pretty much what they say. If a callback is given for `onExpire`, that callback will be called when the alert is expired. Same goes for when the alert is created (`onNotify`) and when an alert is duplicated (`onDuplicated`).

### Simple Example

#### `main.tsx`

```tsx
import React from "react";
import ReactDOM from "react-dom/client";
import App, { AlertContainer } from "./App.tsx";
import { AlertProvider } from "@alertle/react";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <AlertProvider alertContainer={<AlertContainer />}>
      <App />
    </AlertProvider>
  </React.StrictMode>
);
```

#### `App.tsx`

```tsx
import { useAlertContainer, useAlert } from "@alertle/react";

export function AlertContainer() {
  const { alerts, expireAlert } = useAlertContainer();

  return (
    <div>
      {alerts.map((alert) => {
        return (
          <div key={alert.key}>
            <p>Title: {alert.title}</p>
            <p>Message: {alert.message}</p>
            <button onClick={() => expireAlert(alert)}>Bye bye alert</button>
          </div>
        );
      })}
    </div>
  );
}

function App() {
  const { notifyInfo } = useAlert();

  return (
      <button onClick={() => notifyInfo({ title: "Yee haw", message: "Howdy" })}>
        Show info
      </button>
  );
}

export default App;
```
