import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App";
import "overlayscrollbars/styles/overlayscrollbars.css";
import "./styles/fonts.css";
import "./styles/global.css";
import "./styles/scrollbar.css";
import "./styles/layout.css";
import { initScrollbar } from "./scrollbar/initScrollbar";

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);

requestAnimationFrame(() => {
  initScrollbar();
});
