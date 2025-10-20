const API_BASE = "PUT_YOUR_GAS_WEB_APP_URL_HERE"; // paste Web App URL after deploy
const API_KEY = "dev-local-secret";

async function apiCall(action, payload={}){
  const res = await fetch(API_BASE, { method:"POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ action, payload, apiKey: API_KEY }) });
  if(!res.ok) throw new Error("HTTP "+res.status+" "+await res.text());
  const j = await res.json(); if(j.ok!==true) throw new Error(j.error||"API error"); return j.data;
}

export const API = {
  ping: ()=> apiCall("ping"),
  rentersList: ()=> apiCall("renters.list"),
  renterAdd: (record)=> apiCall("renters.add", record),
  renterUpdate: (record)=> apiCall("renters.update", record),
  renterDelete: (id)=> apiCall("renters.delete", { id }),
  utilitiesSave: (rows)=> apiCall("utilities.save", { rows }),
  utilitiesLatest: ()=> apiCall("utilities.latest"),
  paymentsRecord: (record)=> apiCall("payments.record", record),
  paymentsHistoryByRoom: (room,limit=50)=> apiCall("payments.historyByRoom", { room, limit }),
  reportMonthly: (month,year)=> apiCall("report.monthly", { month, year }),
  settingsList: ()=> apiCall("settings.list"),
  settingsUpdate: (kv)=> apiCall("settings.update", kv),
  lateComputeRoom: (room, period=null)=> apiCall("late.computeRoom", { room, period }),
  moveoutGenerate: (renter_id, room, moveout_date)=> apiCall("moveout.generateSummary", { renter_id, room, moveout_date }),
  moveoutFinalize: (summary)=> apiCall("moveout.finalize", { summary }),
};
