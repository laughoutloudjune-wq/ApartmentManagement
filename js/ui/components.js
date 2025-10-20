// js/ui/components.js
import { API } from "../core/api.js";
import { ROOMS } from "../data/rooms.js";
import { Modal } from "./modal.js";

/* ==============================
   Dashboard
   ============================== */
export function renderDashboard(container){
  container.innerHTML = `
    <div class="section-head">
      <h2>Dashboard</h2>
      <p class="muted">Quick snapshot of the month.</p>
    </div>
    <div class="tiles">
      <div class="tile glass"><h3>Collected (Month)</h3><div class="val" id="tCollected">—</div></div>
      <div class="tile glass"><h3>Outstanding</h3><div class="val" id="tOutstanding">—</div></div>
      <div class="tile glass"><h3>Late Accounts</h3><div class="val" id="tLate">—</div></div>
      <div class="tile glass"><h3>Occupancy</h3><div class="val" id="tOccupancy">—</div></div>
    </div>
  `;

  // Minimal metrics (safe placeholders). We can expand later.
  (async () => {
    try {
      const today = new Date();
      const monthly = await API.reportMonthly(today.getMonth() + 1, today.getFullYear());
      document.getElementById("tCollected").textContent = (monthly.total || 0).toFixed(2);

      // Occupancy from renters list
      let renters = [];
      try { renters = await API.rentersList(); } catch {}
      const occupied = (renters || []).filter(r => String(r.active) !== "false").length;
      const occupancyPct = Math.round((occupied / ROOMS.length) * 100);
      document.getElementById("tOccupancy").textContent = `${occupancyPct}%`;

      // Leave Outstanding/Late as scaffold (depends on your local tariff rules)
      document.getElementById("tOutstanding").textContent = "—";
      document.getElementById("tLate").textContent = "—";
    } catch (e) {
      document.getElementById("tCollected").textContent = "Err";
    }
  })();
}

/* ==============================
   Renters (vertical floor plan)
   ============================== */
export function renderRenters(container){
  container.innerHTML = `
    <div class="section-head">
      <h2>Renters</h2>
      <p class="muted">Floor-plan vertical layout. Click a room to view or edit.</p>
      <div><button class="btn" id="btnAddRenter">Add New Renter</button></div>
    </div>
    <div class="room-list" id="rooms"></div>
    <div id="rentersMsg" style="margin-top:8px;"></div>
  `;
  const listEl = container.querySelector("#rooms");
  populateRooms(listEl, { mode: "renters" });
  container.querySelector("#btnAddRenter").addEventListener("click", openAddRenterModal);
}

/* ==============================
   Payments (vertical floor plan)
   with Late Fee + Move Out flows
   ============================== */
export function renderPayments(container){
  container.innerHTML = `
    <div class="section-head">
      <h2>Payments</h2>
      <p class="muted">Record payments, preview, compute late fee, and move out.</p>
    </div>
    <div class="room-list" id="rooms"></div>
    <div id="payMsg" style="margin-top:8px;"></div>
  `;
  const listEl = container.querySelector("#rooms");
  populateRooms(listEl, { mode: "payments" });
}

/* ==============================
   Utilities (scaffold 4-column)
   ============================== */
export function renderUtilities(container){
  container.innerHTML = `
    <div class="section-head">
      <h2>Utilities</h2>
      <p class="muted">4-column monthly input. Save to sheet.</p>
    </div>
    <table class="table" id="utilTable">
      <thead>
        <tr><th>Room</th><th>Previous</th><th>Current</th><th>Usage</th></tr>
      </thead>
      <tbody>
        <tr>
          <td><input value="101/1"/></td>
          <td><input value="1000" type="number"/></td>
          <td><input value="1025" type="number"/></td>
          <td class="usage">25</td>
        </tr>
      </tbody>
    </table>
    <button class="btn" id="btnSaveUtils">Save Utilities</button>
    <div id="utilStatus" style="margin-top:8px;"></div>
  `;

  const tbody = container.querySelector("#utilTable tbody");
  tbody.addEventListener("input", (e) => {
    if (e.target.tagName !== "INPUT") return;
    const tr = e.target.closest("tr");
    const prev = Number(tr.children[1].querySelector("input").value || 0);
    const curr = Number(tr.children[2].querySelector("input").value || 0);
    tr.querySelector(".usage").textContent = String(curr - prev);
  });

  container.querySelector("#btnSaveUtils").addEventListener("click", async () => {
    const btn = container.querySelector("#btnSaveUtils");
    btn.setAttribute("aria-busy", "true");
    const rows = [...tbody.querySelectorAll("tr")].map(tr => ({
      room: tr.children[0].querySelector("input").value.trim(),
      previous: Number(tr.children[1].querySelector("input").value || 0),
      current: Number(tr.children[2].querySelector("input").value || 0),
      usage: Number(tr.querySelector(".usage").textContent || 0),
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

/* ==============================
   Reports (scaffold)
   ============================== */
export function renderReports(container){
  container.innerHTML = `
    <div class="section-head">
      <h2>Reports</h2>
      <p class="muted">Monthly summary (scaffold).</p>
    </div>
    <div class="row" style="display:flex; gap:8px; align-items:center; flex-wrap:wrap;">
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

/* ==============================
   Helpers
   ============================== */
async function populateRooms(listEl, { mode }){
  listEl.innerHTML = "";
  let renters = [];
  try { renters = await API.rentersList(); } catch {}
  const byRoom = Object.fromEntries((renters || []).map(r => [String(r.room || ""), r]));

  ROOMS.forEach(room => {
    const r = byRoom[room];
    const name = (r && r.name) ? r.name : "Vacant";
    const method = (r && r.payment_method) ? r.payment_method : "—";
    const phone = (r && r.phone) ? r.phone : "";

    const card = document.createElement("div");
    card.className = "room-card glass";
    card.innerHTML = `
      <div class="room-id">${room}</div>
      <div class="room-meta">
        <div><strong>${escapeHtml(name)}</strong></div>
        <div>${phone ? "☎ " + escapeHtml(phone) + " • " : ""}Method: ${escapeHtml(method)}</div>
      </div>
      <div class="room-actions">
        ${mode === "renters"
          ? `<button class="btn" data-act="edit">Edit</button>`
          : `<button class="btn" data-act="pay">Record</button>
             <button class="btn" data-act="preview">Preview</button>
             <button class="btn" data-act="late">Late Fee</button>
             <button class="btn" data-act="moveout">Move Out</button>`}
      </div>
    `;

    // Renters tab
    const editBtn = card.querySelector('[data-act="edit"]');
    if (editBtn) editBtn.addEventListener("click", () => openEditRenterModal(r, room));

    // Payments tab actions
    const payBtn = card.querySelector('[data-act="pay"]');
    if (payBtn) payBtn.addEventListener("click", () => openRecordPaymentModal(r, room));

    const prevBtn = card.querySelector('[data-act="preview"]');
    if (prevBtn) prevBtn.addEventListener("click", () => openPreviewModal(r, room));

    const lateBtn = card.querySelector('[data-act="late"]');
    if (lateBtn) lateBtn.addEventListener("click", () => openLateModal(room));

    const moveBtn = card.querySelector('[data-act="moveout"]');
    if (moveBtn) moveBtn.addEventListener("click", () => openMoveOutModal(r, room));

    listEl.appendChild(card);
  });
}

/* ==============================
   Modals
   ============================== */
function openAddRenterModal(){
  Modal.open(`
    <h3 style="margin:0 0 10px;">Add New Renter</h3>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
      <label>Name<input id="r_name"/></label>
      <label>Room<input id="r_room" placeholder="e.g. 101/1"/></label>
      <label>Phone<input id="r_phone"/></label>
      <label>Payment Method<input id="r_method" placeholder="cash/transfer"/></label>
      <label>Deposit (THB)<input id="r_deposit" type="number"/></label>
    </div>
  `, {
    primaryText: "Add Renter",
    onPrimary: async (close) => {
      const payload = {
        name: gv("r_name"),
        room: gv("r_room"),
        phone: gv("r_phone"),
        payment_method: gv("r_method"),
        deposit: Number(gv("r_deposit") || 0),
      };
      if (!payload.name || !payload.room) { alert("Name and Room required"); return; }
      await API.renterAdd(payload);
      close(); location.reload();
    }
  });
}

function openEditRenterModal(rec, room){
  Modal.open(`
    <h3 style="margin:0 0 10px;">Edit Renter — ${escapeHtml(room)}</h3>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
      <label>Name<input id="e_name" value="${escapeHtml((rec && rec.name) || "")}"/></label>
      <label>Phone<input id="e_phone" value="${escapeHtml((rec && rec.phone) || "")}"/></label>
      <label>Payment Method<input id="e_method" value="${escapeHtml((rec && rec.payment_method) || "")}"/></label>
    </div>
  `, {
    primaryText: "Save",
    onPrimary: async (close) => {
      if (!rec || !rec.id) { alert("No renter on this room. Use Add Renter instead."); return; }
      await API.renterUpdate({
        id: rec.id,
        name: gv("e_name"),
        phone: gv("e_phone"),
        payment_method: gv("e_method"),
      });
      close(); location.reload();
    }
  });
}

function openRecordPaymentModal(rec, room){
  Modal.open(`
    <h3 style="margin:0 0 10px;">Record Payment — ${escapeHtml(room)}</h3>
    <div style="display:grid; grid-template-columns: 1fr 1fr 1fr; gap:10px;">
      <label>Amount<input id="p_amount" type="number" step="0.01"/></label>
      <label>Method
        <select id="p_method">
          <option value="cash">cash</option>
          <option value="transfer">transfer</option>
          <option value="installment">installment</option>
        </select>
      </label>
      <label>Date<input id="p_date" type="date"/></label>
    </div>
  `, {
    primaryText: "Save Payment",
    onPrimary: async (close) => {
      await API.paymentsRecord({
        renter_id: (rec && rec.id) || "",
        room: room,
        amount: Number(gv("p_amount") || 0),
        method: gv("p_method"),
        date: gv("p_date") || new Date().toISOString().slice(0, 10),
      });
      close();
    }
  });
}

function openPreviewModal(rec, room){
  Modal.open(`
    <h3 style="margin:0 0 10px;">Print Preview — ${escapeHtml(room)}</h3>
    <div class="print-area" style="background:#fff; color:#111; padding:12px; border-radius:12px;">
      <div><strong>Renter:</strong> ${escapeHtml((rec && rec.name) || "—")}</div>
      <div><strong>Room:</strong> ${escapeHtml(room)}</div>
      <div><strong>Date:</strong> ${new Date().toLocaleDateString()}</div>
      <hr/>
      <em>Preview only. Configure PDF later.</em>
    </div>
  `, { primaryText: "Print", onPrimary: async (close)=>{ window.print(); } });
}

/* Late Fee (overlay) */
function openLateModal(room){
  Modal.open(`
    <h3 style="margin:0 0 10px;">Late Fee — ${escapeHtml(room)}</h3>
    <div id="lateBody">Checking…</div>
  `, {
    primaryText: "Close",
    onPrimary: (close) => close()
  });

  (async () => {
    try {
      const res = await API.lateComputeRoom(room, null);
      const cut = new Date(res.cutoff);
      const html = `
        <div><strong>Period:</strong> ${res.period ? new Date(res.period).toLocaleDateString() : "-"}</div>
        <div><strong>Cutoff:</strong> ${cut.toLocaleDateString()}</div>
        <div><strong>Is Late?:</strong> ${res.isLate ? "Yes" : "No"}</div>
        <hr/>
        <div><strong>Room Rate:</strong> ${toMoney(res.estimated && res.estimated.roomRate)}</div>
        <div><strong>Utilities:</strong> ${toMoney(res.estimated && res.estimated.utilitiesCost)}</div>
        <div><strong>Paid:</strong> ${toMoney(res.estimated && res.estimated.paid)}</div>
        <div><strong>Balance:</strong> ${toMoney(res.estimated && res.estimated.balance)}</div>
        <div><strong>Late Fee:</strong> ${toMoney(res.fee)}</div>
      `;
      document.getElementById("lateBody").innerHTML = html;
    } catch (e) {
      document.getElementById("lateBody").textContent = "Error: " + e.message;
    }
  })();
}

/* Move Out (overlay) */
function openMoveOutModal(rec, room){
  Modal.open(`
    <h3 style="margin:0 0 10px;">Move Out — ${escapeHtml(room)}</h3>
    <div style="display:grid; grid-template-columns: 1fr 1fr; gap:10px;">
      <label>Move-out Date<input id="mo_date" type="date"/></label>
    </div>
    <div id="moPreview" style="margin-top:12px;" class="muted">Pick a date and press “Preview”.</div>
  `, {
    primaryText: "Preview",
    onPrimary: async (close) => {
      const dt = gv("mo_date") || new Date().toISOString().slice(0,10);
      try {
        const sum = await API.moveoutGenerate((rec && rec.id) || "", room, dt);
        document.getElementById("moPreview").innerHTML = `
          <div><strong>Period:</strong> ${sum.period.month}/${sum.period.year}</div>
          <div><strong>Room Rate:</strong> ${toMoney(sum.charges && sum.charges.room_rate)}</div>
          <div><strong>Utilities:</strong> ${toMoney(sum.charges && sum.charges.utilities)}</div>
          <div><strong>Late Fee:</strong> ${toMoney(sum.charges && sum.charges.late_fee)}</div>
          <div><strong>Paid:</strong> ${toMoney(sum.paid)}</div>
          <div><strong>Deposit:</strong> ${toMoney(sum.deposit)}</div>
          <hr/>
          <div><strong>Final Due:</strong> ${toMoney(sum.final_amount_due)}</div>
          <div><strong>Refund:</strong> ${toMoney(sum.refund_amount)}</div>
          <div style="margin-top:10px;">
            <button class="btn" id="moFinalize">Finalize Move Out</button>
          </div>
        `;
        document.getElementById("moFinalize").onclick = async () => {
          try {
            await API.moveoutFinalize(sum);
            alert("Move-out finalized.");
            close(); location.reload();
          } catch (e) {
            alert("Finalize failed: " + e.message);
          }
        };
      } catch (e) {
        document.getElementById("moPreview").textContent = "Error: " + e.message;
      }
    }
  });
}

/* ==============================
   Small Utils
   ============================== */
function gv(id){
  const el = document.getElementById(id);
  return el && el.value ? el.value.trim() : "";
}
function escapeHtml(s){
  return (s == null ? "" : String(s)).replace(/[&<>"']/g, function(m){
    return ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" })[m];
  });
}
function toMoney(x){
  const n = Number(x || 0);
  return n.toFixed(2);
}