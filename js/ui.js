/* =============================================================================
 * RecoveryBoard + RescueMesh — Shared UI Kit
 * -----------------------------------------------------------------------------
 * Toasts, modals, drawer, confirm dialogs, skeletons, empty/error states and
 * formatting helpers shared by all pages. (Addition to the base file list —
 * keeps citizen/rescue/admin scripts free of duplicated component code.)
 * ========================================================================== */

/* ------------------------------------------------------------------ toasts */
let _toastRegion = null;

function _ensureToastRegion() {
    if (!_toastRegion || !document.body.contains(_toastRegion)) {
        _toastRegion = document.createElement("div");
        _toastRegion.className = "toast-region";
        _toastRegion.setAttribute("role", "status");
        _toastRegion.setAttribute("aria-live", "polite");
        document.body.appendChild(_toastRegion);
    }
    return _toastRegion;
}

/**
 * Show a toast. type: success | error | warning | info
 * Example: toast("Incident reported successfully", "success")
 */
function toast(message, type = "info", duration = 4200) {
    const region = _ensureToastRegion();
    const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.innerHTML =
        `<span class="t-icon" aria-hidden="true">${icons[type] || icons.info}</span>` +
        `<span class="t-msg"></span>` +
        `<button class="t-close" type="button" aria-label="Dismiss notification">✕</button>`;
    el.querySelector(".t-msg").textContent = message;
    const remove = () => {
        if (!el.parentNode) return;
        el.classList.add("out");
        setTimeout(() => el.remove(), 240);
    };
    el.querySelector(".t-close").addEventListener("click", remove);
    region.appendChild(el);
    if (duration > 0) setTimeout(remove, duration);
    return el;
}

/* ------------------------------------------------------------------ modals */

function openModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.add("open");
    modalEl.setAttribute("aria-hidden", "false");
    const focusable = modalEl.querySelector("input, select, textarea, button");
    if (focusable) setTimeout(() => focusable.focus(), 50);
}

function closeModal(modalEl) {
    if (!modalEl) return;
    modalEl.classList.remove("open");
    modalEl.setAttribute("aria-hidden", "true");
}

/** Wire close buttons: [data-close-modal] inside each modal-backdrop. */
function bindModalClosers(root = document) {
    root.querySelectorAll(".modal-backdrop").forEach((backdrop) => {
        backdrop.querySelectorAll("[data-close-modal]").forEach((btn) => {
            btn.addEventListener("click", () => closeModal(backdrop));
        });
        backdrop.addEventListener("click", (event) => {
            if (event.target === backdrop) closeModal(backdrop);
        });
    });

/**
 * Confirmation dialog with Cancel / confirm button.
 * confirmAction({ title, body, confirmText, danger }) → Promise<boolean>
 */
function confirmAction({ title, body, confirmText = "Confirm", cancelText = "Cancel", danger = false }) {
    return new Promise((resolve) => {
        const backdrop = document.createElement("div");
        backdrop.className = "modal-backdrop open";
        backdrop.setAttribute("role", "dialog");
        backdrop.setAttribute("aria-modal", "true");
        backdrop.setAttribute("aria-hidden", "false");
        backdrop.innerHTML =
            `<div class="modal modal-center">` +
            `  <div class="modal-body">` +
            `    <div class="modal-icon ${danger ? "danger" : "info"}" aria-hidden="true">${danger ? "⚠" : "?"}</div>` +
            `    <h3 class="mb-0"></h3>` +
            `    <p class="muted text-sm"></p>` +
            `  </div>` +
            `  <div class="modal-foot">` +
            `    <button type="button" class="btn btn-secondary" data-cancel></button>` +
            `    <button type="button" class="btn ${danger ? "btn-danger" : "btn-primary"}" data-confirm></button>` +
            `  </div>` +
            `</div>`;
        backdrop.querySelector("h3").textContent = title;
        const bodyEl = backdrop.querySelector("p");
        bodyEl.textContent = body || "";
        if (!body) bodyEl.remove();
        const cancelBtn = backdrop.querySelector("[data-cancel]");
        const confirmBtn = backdrop.querySelector("[data-confirm]");
        cancelBtn.textContent = cancelText;
        confirmBtn.textContent = confirmText;
        const done = (value) => {
            backdrop.remove();
            document.removeEventListener("keydown", onKey);
            resolve(value);
        };
        const onKey = (event) => { if (event.key === "Escape") done(false); };
        cancelBtn.addEventListener("click", () => done(false));
        confirmBtn.addEventListener("click", () => done(true));
        backdrop.addEventListener("click", (event) => { if (event.target === backdrop) done(false); });
        document.addEventListener("keydown", onKey);
        document.body.appendChild(backdrop);
        confirmBtn.focus();
    });
}

/* ------------------------------------------------------------------ drawer */

function openDrawer(drawerEl) {
    if (!drawerEl) return;
    drawerEl.classList.add("open");
    drawerEl.setAttribute("aria-hidden", "false");
    const backdrop = document.getElementById("drawer-backdrop");
    if (backdrop) backdrop.classList.add("show");
    const closeBtn = drawerEl.querySelector("[data-close-drawer]");
    if (closeBtn) closeBtn.focus();
}

function closeDrawer(drawerEl) {
    if (!drawerEl) return;
    drawerEl.classList.remove("open");
    drawerEl.setAttribute("aria-hidden", "true");
    const backdrop = document.getElementById("drawer-backdrop");
    if (backdrop) backdrop.classList.remove("show");
}

function bindDrawerClosers() {
    document.querySelectorAll("[data-close-drawer]").forEach((btn) => {
        btn.addEventListener("click", () => closeDrawer(btn.closest(".drawer")));
    });
    const backdrop = document.getElementById("drawer-backdrop");
    if (backdrop) backdrop.addEventListener("click", () => {
        closeDrawer(document.querySelector(".drawer.open"));
    });
    document.addEventListener("keydown", (event) => {
        if (event.key === "Escape") {
            const open = document.querySelector(".drawer.open");
            if (open) closeDrawer(open);
            document.querySelectorAll(".modal-backdrop.open").forEach(closeModal);
        }
    });
}


/* ============================================================ loading states */

/** Skeleton loader markup for grids. */
function skeletonGrid(count = 6) {
    let html = '<div class="skeleton-grid" aria-hidden="true">';
    for (let i = 0; i < count; i++) html += '<div class="skeleton skeleton-card"></div>';
    return html + "</div>";
}

/** Inline loading strip. Example: loadingText("Loading incidents...") */
function loadingText(text) {
    return `<div class="loading-inline"><span class="spinner spinner-dark" aria-hidden="true"></span><span>${escapeHtml(text)}</span></div>`;
}

/**
 * Put a button into loading state (disabled, spinner, label) and return a
 * restore function. Prevents duplicate submissions.
 */
function setButtonLoading(button, loadingLabel) {
    if (!button) return () => {};
    const original = button.innerHTML;
    button.dataset.originalHtml = original;
    button.classList.add("is-loading");
    button.disabled = true;
    button.innerHTML = `<span class="spinner" aria-hidden="true"></span> ${escapeHtml(loadingLabel)}`;
    return () => {
        button.classList.remove("is-loading");
        button.disabled = false;
        button.innerHTML = button.dataset.originalHtml || original;
        delete button.dataset.originalHtml;
    };
}

/* ============================================================ empty / error */

function emptyState({ icon = "📋", title = "Nothing here yet", message = "", actionHtml = "" }) {
    return (
        `<div class="empty-state">` +
        `  <div class="es-icon" aria-hidden="true">${icon}</div>` +
        `  <h3>${escapeHtml(title)}</h3>` +
        (message ? `  <p>${escapeHtml(message)}</p>` : "") +
        (actionHtml ? `  <div>${actionHtml}</div>` : "") +
        `</div>`
    );
}

function errorState({ title = "Something went wrong", message = "We couldn't load this information.", retryId = "" }) {
    return (
        `<div class="error-state" role="alert">` +
        `  <div class="es-icon" aria-hidden="true">⚠</div>` +
        `  <h3>${escapeHtml(title)}</h3>` +
        `  <p>${escapeHtml(message)}</p>` +
        (retryId ? `  <button type="button" class="btn btn-primary" id="${retryId}">Try Again</button>` : "") +
        `</div>`
    );
}

/* ============================================================ formatters */

function escapeHtml(value) {
    return String(value === null || value === undefined ? "" : value)
        .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

/** "12 Mar 2026, 10:30" from an ISO timestamp; "—" when missing. */
function formatDateTime(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
        day: "2-digit", month: "short", year: "numeric",
        hour: "2-digit", minute: "2-digit",
    });
}

function formatDate(iso) {
    if (!iso) return "—";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleDateString(undefined, { day: "2-digit", month: "short", year: "numeric" });
}

/** "2 hours ago" style relative time. */
function timeAgo(iso) {
    if (!iso) return "—";
    const then = new Date(iso).getTime();
    if (Number.isNaN(then)) return "—";
    const seconds = Math.floor((Date.now() - then) / 1000);
    if (seconds < 60) return "just now";
    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes} min ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours} h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days} d ago`;
    return formatDate(iso);
}


/* ============================================================ label maps */
/* Backend enum values → display labels (text always accompanies color). */

const STATUS_LABELS = {
    reported: "Reported", verified: "Verified", assigned: "Assigned",
    working: "Working", resolved: "Resolved",
};
const STATUS_ORDER = ["reported", "verified", "assigned", "working", "resolved"];
const STATUS_ICONS = { reported: "🟡", verified: "🔵", assigned: "🟣", working: "🟠", resolved: "🟢" };

const SEVERITY_LABELS = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };
const PRIORITY_LABELS = { low: "Low", medium: "Medium", high: "High", critical: "Critical" };

const DAMAGE_TYPE_LABELS = {
    road_blocked: "Road Blocked", tree_fallen: "Tree Fallen",
    electricity_damaged: "Electricity Damage", water_supply_broken: "Water Supply Broken",
    building_damaged: "Building Damaged", bridge_damaged: "Bridge Damaged",
    communication_network_damaged: "Communication Network Damaged", other: "Other",
};

const DISASTER_TYPE_LABELS = {
    flood: "Flood", earthquake: "Earthquake", landslide: "Landslide",
    cyclone: "Cyclone", fire: "Fire", other: "Other",
};

const RESOURCE_TYPE_LABELS = {
    ambulance: "🚑 Ambulance", rescue_team: "👨‍🚒 Rescue Team",
    electricity_team: "⚡ Electrical Team", water_team: "💧 Water Team",
    road_clearance_team: "🚧 Road Clearance", medical_team: "🏥 Medical Team",
    equipment: "🧰 Equipment", vehicles: "🚐 Vehicles",
};

const TEAM_TYPE_LABELS = {
    rescue: "Rescue", medical: "Medical", electricity: "Electricity",
    water: "Water", road_clearance: "Road Clearance", logistics: "Logistics", other: "Other",
};

const RESOURCE_STATUS_LABELS = {
    available: "Available", in_use: "In Use", maintenance: "Maintenance", depleted: "Depleted",
};

const AVAILABILITY_LABELS = { available: "Available", busy: "Busy", unavailable: "Unavailable" };

const ROLE_LABELS_UI = {
    admin: "Administrator", authority: "Authority",
    field_officer: "Field Officer", rescue_team: "Rescue Team",
};

function statusBadge(status) {
    const label = STATUS_LABELS[status] || status || "—";
    return `<span class="badge badge-${escapeHtml(status)}">${escapeHtml(label)}</span>`;
}

function severityBadge(severity) {
    const label = SEVERITY_LABELS[severity] || severity || "—";
    return `<span class="badge badge-${escapeHtml(severity)}">${escapeHtml(label)} severity</span>`;
}

function priorityPill(level) {
    const label = PRIORITY_LABELS[level] || level || "—";
    return `<span class="priority-pill p-${escapeHtml(level)}">${escapeHtml(label)}</span>`;
}

/** Progress percent for a workflow status (used by recovery tracking bars). */
function statusProgress(status) {
    const index = STATUS_ORDER.indexOf(status);
    return index < 0 ? 0 : Math.round(((index + 1) / STATUS_ORDER.length) * 100);
}

}
