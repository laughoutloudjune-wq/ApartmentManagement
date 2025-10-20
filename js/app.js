import { initRouter } from "./ui/router.js";
import { API } from "./core/api.js";
window.addEventListener("DOMContentLoaded", async ()=>{
  initRouter();
  const refreshBtn=document.querySelector("#refreshBtn");
  refreshBtn.addEventListener("click", async ()=>{
    refreshBtn.setAttribute("aria-busy","true");
    try{ await API.ping(); }catch(e){ alert("API not reachable: "+e.message); } finally{ refreshBtn.removeAttribute("aria-busy"); }
  });
});
