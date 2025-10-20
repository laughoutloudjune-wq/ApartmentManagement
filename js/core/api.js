// FRONTEND CORE API WRAPPER
// Update API_BASE and API_KEY after you deploy Apps Script.
const API_BASE = "https://script.google.com/macros/s/AKfycbzrwcRkYJqql1MQ9T74hP1yRm-xhF8DgzjeteHLMuXt9PHVipuk0ql4BmV5OQ0W3BU/exec";
const API_KEY = "dev-local-secret"; // must match backend CONFIG.API_KEY

async function apiCall(action, payload = {}) {
  const body = { action, payload, apiKey: API_KEY };
  const res = await fetch(API_BASE, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`API HTTP ${res.status}: ${text}`);
  }
  const json = await res.json();
  if (json.ok !== true) {
    throw new Error(json.error || "Unknown API error");
  }
  return json.data;
}

export const API = {
  ping: () => apiCall("ping"),
  rentersList: () => apiCall("renters.list"),
  renterAdd: (record) => apiCall("renters.add", record),
  renterUpdate: (record) => apiCall("renters.update", record),
  renterDelete: (id) => apiCall("renters.delete", { id }),
  utilitiesSave: (rows) => apiCall("utilities.save", { rows }),
  paymentsRecord: (record) => apiCall("payments.record", record),
  reportMonthly: (month, year) => apiCall("report.monthly", { month, year }),
  fileUploadBase64: (b64, filename, mime) => apiCall("file.upload", { b64, filename, mime }),
};
