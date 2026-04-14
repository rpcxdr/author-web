import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import "./styles.css";

const basePath = import.meta.env.VITE_APP_BASE || "/"
const basename = basePath === "/" ? "/" : basePath.replace(/\/$/, "")

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter basename={basename}>
      <div className="app">{/* .app matches your CSS selectors */}
        <App />
      </div>
    </BrowserRouter>
  </React.StrictMode>
);