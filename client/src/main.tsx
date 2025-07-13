import * as React from "react";
import * as ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
