import { renderDashboard, renderRenters, renderPayments, renderUtilities, renderReports } from "./components.js";
const tabs=[
  {id:"dashboard",viewId:"view-dashboard",render:renderDashboard},
  {id:"renters",viewId:"view-renters",render:renderRenters},
  {id:"payments",viewId:"view-payments",render:renderPayments},
  {id:"utilities",viewId:"view-utilities",render:renderUtilities},
  {id:"reports",viewId:"view-reports",render:renderReports},
];
export function initRouter(){ const nav=document.querySelector(".tabs"); nav.addEventListener("click",e=>{ if(!e.target.matches(".tab")) return; setActive(e.target.getAttribute("data-tab")); }); setActive("dashboard"); }
function setActive(id){ document.querySelectorAll(".tab").forEach(b=> b.classList.toggle("active", b.dataset.tab===id)); document.querySelectorAll(".view").forEach(v=> v.classList.remove("active")); const t=tabs.find(t=> t.id===id); const sec=document.getElementById(t.viewId); sec.classList.add("active"); t.render(sec); }
