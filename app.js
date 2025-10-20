// App bootstrap
import { initRouter } from "./ui/router.js";
import { API } from "./core/api.js";

function qs(sel){ return document.querySelector(sel); }

window.addEventListener("DOMContentLoaded", async () => {
  initRouter();

  // Refresh button with loading animation
  const refreshBtn = qs("#refreshBtn");
  refreshBtn.addEventListener("click", async () => {
    refreshBtn.setAttribute("aria-busy", "true");
    try {
      await API.ping();
    } catch (e) {
      alert("API not reachable: " + e.message);
    } finally {
      refreshBtn.removeAttribute("aria-busy");
    }
  });

  // Extended FAB
  const fab = document.querySelector(".fab");
  const fabMain = document.getElementById("fabMain");
  const fabActions = document.getElementById("fabActions");
  fabMain.addEventListener("click", () => {
    fab.classList.toggle("open");
  });
  fabActions.addEventListener("click", async (e) => {
    if (!e.target.matches(".fab-item")) return;
    const action = e.target.dataset.action;
    if (action === "submit") {
      e.target.setAttribute("aria-busy","true");
      // Just a harmless demo call to prove loading works
      try { await API.ping(); }
      catch(e){ alert("Submit failed: "+e.message); }
      finally { e.target.removeAttribute("aria-busy"); }
    }
    if (action === "add") {
      alert("Add action (wire per current tab).");
    }
  });
});
