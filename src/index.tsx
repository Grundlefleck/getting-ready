import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";
import App from "./App";
import TidyApp from "./TidyApp";
import "@fortawesome/fontawesome-free/css/all.min.css";

const isTidyPath = window.location.pathname
  .replace(/\/+$/, "")
  .endsWith("/tidy");

const root = ReactDOM.createRoot(
  document.getElementById("root") as HTMLElement,
);
root.render(
  <React.StrictMode>{isTidyPath ? <TidyApp /> : <App />}</React.StrictMode>,
);
