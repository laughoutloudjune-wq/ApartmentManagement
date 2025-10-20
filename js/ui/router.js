// Simple tab router with FAB behavior.
import { renderRenters, renderPayments, renderUtilities, renderReports } from "./components.js";

const tabs = [
  { id: "renters", viewId: "view-renters", render: renderRenters },
  { id: "payments", viewId: "view-payments", render: renderPayments },
  { id: "utilities", viewId: "view-utilities", render: renderUtilities },
  { id: "reports", viewId: "view-reports", render: renderReports },
];

export function initRouter() {
  const nav = document.querySelector(".tabs");
  nav.addEventListener("click", (e) => {
    if (!e.target.matches(".tab")) return;
    const tabId = e.target.getAttribute("data-tab");
    setActive(tabId);
  });
  setActive("renters");
}

function setActive(tabId) {
  document.querySelectorAll(".tab").forEach(btn => btn.classList.toggle("active", btn.dataset.tab === tabId));
  document.querySelectorAll(".view").forEach(v => v.classList.remove("active"));
  const cfg = tabs.find(t => t.id === tabId);
  const sec = document.getElementById(cfg.viewId);
  sec.classList.add("active");
  cfg.render(sec);
  // FAB semantics could change per tab in the future
}
