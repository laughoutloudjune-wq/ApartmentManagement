// VERY SMALL UI SCAFFOLD — keep it minimal to avoid crashes.
// You can extend these components later without touching router/app core.

import { API } from "../core/api.js";

export function renderRenters(container) {
  container.innerHTML = `
    <div class="section-head">
      <h2>Renters</h2>
      <p class="muted">Add/edit renters and assign payment methods.</p>
    </div>
    <table class="table" id="rentersTable">
      <thead><tr>
        <th>ID</th><th>Name</th><th>Room</th><th>Phone</th><th>Pay Method</th><th></th>
      </tr></thead>
      <tbody></tbody>
    </table>
  `;
  loadRenters(container.querySelector("#rentersTable tbody"));
}

async function loadRenters(tbody) {
  tbody.innerHTML = `<tr><td colspan="6">Loading…</td></tr>`;
  try {
    const list = await API.rentersList();
    tbody.innerHTML = "";
    list.forEach(r => {
      const tr = document.createElement("tr");
      tr.innerHTML = `
        <td>${r.id || ""}</td>
        <td>${r.name || ""}</td>
        <td>${r.room || ""}</td>
        <td>${r.phone || ""}</td>
        <td>${r.payment_method || ""}</td>
        <td><button class="btn" data-id="${r.id}">Edit</button></td>
      `;
      tbody.appendChild(tr);
    });
  } catch (e) {
    tbody.innerHTML = `<tr><td colspan="6">Error: ${e.message}</td></tr>`;
  }
}

export function renderPayments(container) {
  container.innerHTML = `
    <div class="section-head">
      <h2>Payments</h2>
      <p class="muted">Record payment and preview invoice/receipt (scaffold).</p>
    </div>
    <div>
      <button class="btn" id="btnTestPayment">Record Test Payment</button>
      <div id="payResult" style="margin-top:8px;"></div>
    </div>
  `;
  container.querySelector("#btnTestPayment").addEventListener("click", async () => {
    const btn = container.querySelector("#btnTestPayment");
    btn.setAttribute("aria-busy", "true");
    const resDiv = container.querySelector("#payResult");
    resDiv.textContent = "";
    try {
      const data = await API.paymentsRecord({
        renter_id: "R-TEST",
        room: "101",
        amount: 1234.56,
        method: "transfer",
        date: new Date().toISOString().slice(0,10),
      });
      resDiv.textContent = "OK: " + JSON.stringify(data);
    } catch (e) {
      resDiv.textContent = "Error: " + e.message;
    } finally {
      btn.removeAttribute("aria-busy");
    }
  });
}

export function renderUtilities(container) {
  container.innerHTML = `
    <div class="section-head">
      <h2>Utilities</h2>
      <p class="muted">Simple 4-column monthly input. Save → sheet.</p>
    </div>
    <table class="table" id="utilTable">
      <thead><tr>
        <th>Room</th><th>Previous</th><th>Current</th><th>Usage</th>
      </tr></thead>
      <tbody>
        <tr><td><input value="101"/></td><td><input value="1000" type="number"/></td><td><input value="1025" type="number"/></td><td class="usage">25</td></tr>
      </tbody>
    </table>
    <button class="btn" id="btnSaveUtils">Save Utilities</button>
    <div id="utilStatus" style="margin-top:8px;"></div>
  `;
  const tbody = container.querySelector("#utilTable tbody");
  tbody.addEventListener("input", (e) => {
    if (e.target.tagName === "INPUT") {
      const tr = e.target.closest("tr");
      const prev = Number(tr.children[1].querySelector("input").value||0);
      const curr = Number(tr.children[2].querySelector("input").value||0);
      tr.querySelector(".usage").textContent = String(curr - prev);
    }
  });
  container.querySelector("#btnSaveUtils").addEventListener("click", async () => {
    const btn = container.querySelector("#btnSaveUtils");
    btn.setAttribute("aria-busy", "true");
    const rows = [...tbody.querySelectorAll("tr")].map(tr => ({
      room: tr.children[0].querySelector("input").value.trim(),
      previous: Number(tr.children[1].querySelector("input").value||0),
      current: Number(tr.children[2].querySelector("input").value||0),
      usage: Number(tr.querySelector(".usage").textContent||0),
    }));
    try {
      const data = await API.utilitiesSave(rows);
      document.getElementById("utilStatus").textContent = "Saved " + data.saved + " rows.";
    } catch (e) {
      document.getElementById("utilStatus").textContent = "Error: " + e.message;
    } finally {
      btn.removeAttribute("aria-busy");
    }
  });
}

export function renderReports(container) {
  container.innerHTML = `
    <div class="section-head">
      <h2>Reports</h2>
      <p class="muted">Monthly summary (scaffold).</p>
    </div>
    <div class="row">
      <input id="repMonth" placeholder="MM" value="10" style="width:80px"/>
      <input id="repYear" placeholder="YYYY" value="2025" style="width:100px"/>
      <button class="btn" id="btnRunReport">Run</button>
    </div>
    <div id="reportOut" style="margin-top:8px;"></div>
  `;
  container.querySelector("#btnRunReport").addEventListener("click", async () => {
    const m = Number(container.querySelector("#repMonth").value);
    const y = Number(container.querySelector("#repYear").value);
    const out = container.querySelector("#reportOut");
    out.textContent = "Running…";
    try {
      const data = await API.reportMonthly(m, y);
      out.textContent = JSON.stringify(data, null, 2);
    } catch (e) {
      out.textContent = "Error: " + e.message;
    }
  });
}
