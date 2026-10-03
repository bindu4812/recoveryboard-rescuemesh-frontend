/* =============================================================================
 * RecoveryBoard + RescueMesh — Citizen (Field Officer) Dashboard
 * -----------------------------------------------------------------------------
 * Views: Dashboard, Emergency SOS, Report Incident (wizard), My Reports,
 * Recovery Status, Profile. All data comes from real backend endpoints.
 * ========================================================================== */
(function () {
    "use strict";

    /* ------------------------------------------------------- auth bootstrap */
    const user = requireAuth(["field_officer"]);
    if (!user) return;

    let currentUser = user;

    /* ------------------------------------------------------- shell wiring */
    const sidebar = document.getElementById("sidebar");
    const sidebarToggle = document.getElementById("sidebar-toggle");
    const sidebarBackdrop = document.getElementById("sidebar-backdrop");

    function closeMobileSidebar() {
        sidebar.classList.remove("open");
        sidebarBackdrop.classList.remove("show");
        if (sidebarToggle) sidebarToggle.setAttribute("aria-expanded", "false");
    }
    if (sidebarToggle) {
        sidebarToggle.addEventListener("click", () => {
            const open = sidebar.classList.toggle("open");
            sidebarBackdrop.classList.toggle("show", open);
            sidebarToggle.setAttribute("aria-expanded", String(open));
        });
    }
    if (sidebarBackdrop) sidebarBackdrop.addEventListener("click", closeMobileSidebar);

    /** View switching (sidebar nav + data-goto buttons). */
    function showView(name) {
        document.querySelectorAll(".view").forEach((v) => v.classList.remove("active"));
        const target = document.getElementById(`view-${name}`);
        if (!target) return;
        target.classList.add("active");
        document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
            btn.classList.toggle("active", btn.dataset.view === name);
        });
        closeMobileSidebar();
        window.scrollTo({ top: 0, behavior: "smooth" });
        const handlers = {
            dashboard: loadDashboard,
            reports: loadMyReports,
            recovery: loadRecoveryStatus,
            profile: loadProfile,
            report: ensureIncidentsLoaded,
            sos: () => {},
        };
        if (handlers[name]) handlers[name]();
    }

    document.querySelectorAll(".nav-item[data-view]").forEach((btn) => {
        btn.addEventListener("click", () => showView(btn.dataset.view));
    });
    document.querySelectorAll("[data-goto]").forEach((el) => {
        el.addEventListener("click", () => showView(el.dataset.goto));
    });
    bindLogoutButtons();
    bindModalClosers();
    bindDrawerClosers();

    /* greeting uses backend user name — never hardcoded */
    const greeting = document.getElementById("greeting");
    if (greeting) greeting.textContent = `Welcome, ${currentUser.name || "Citizen"}`;
    const nameEl = document.getElementById("user-name");
    if (nameEl) nameEl.textContent = currentUser.name || "";
    const roleEl = document.getElementById("user-role");
    if (roleEl) roleEl.textContent = ROLE_LABELS_UI[currentUser.role] || currentUser.role;
    const avatar = document.getElementById("user-avatar");

    /* ================================================ DASHBOARD (stats) */
    /**
     * Citizen stats come from REAL backend counts:
     * GET /api/damage-reports?reported_by=<me>&status=<s> → total per status.
     */
    async function fetchStatusTotal(status) {
        const params = { reported_by: currentUser.id, page_size: 1 };
        if (status) params.status = status;
        const page = await getDamageReports(params);
        return page && typeof page.total === "number" ? page.total : 0;
    }

    async function loadDashboard() {
        const recentBox = document.getElementById("recent-reports");
        recentBox.innerHTML = loadingText("Loading your reports…");
        try {
            const [total, reported, verified, assigned, working, resolved] = await Promise.all([
                fetchStatusTotal(null),
                fetchStatusTotal("reported"),
                fetchStatusTotal("verified"),
                fetchStatusTotal("assigned"),
                fetchStatusTotal("working"),
                fetchStatusTotal("resolved"),
            ]);
            const active = total - resolved;
            document.getElementById("stat-active").textContent = active;
            document.getElementById("stat-pending").textContent = reported;
            document.getElementById("stat-progress").textContent = verified + assigned + working;
            document.getElementById("stat-resolved").textContent = resolved;

            const recent = await getDamageReports({ reported_by: currentUser.id, page_size: 5 });
            if (!recent.items.length) {
                recentBox.innerHTML = emptyState({
                    icon: "📋",
                    title: "No reports yet",
                    message: "When you report an incident it will appear here with live recovery status.",
                    actionHtml: '<button class="btn btn-primary btn-sm" type="button" data-goto-inline="report">Report an Incident</button>',
                });
                const inlineBtn = recentBox.querySelector("[data-goto-inline]");
                if (inlineBtn) inlineBtn.addEventListener("click", () => showView("report"));
                return;
            }
            recentBox.innerHTML = recent.items.map(reportRowHtml).join("");
            wireReportRows(recentBox);
        } catch (err) {
            recentBox.innerHTML = errorState({
                title: "Couldn't load your dashboard",
                message: err.message || "Something went wrong.",
                retryId: "dash-retry",
            });
            const retry = document.getElementById("dash-retry");
            if (retry) retry.addEventListener("click", loadDashboard);
        }
    }

    function reportRowHtml(report) {
        return (
            `<div class="alert-card card-interactive report-row" data-report-id="${escapeHtml(report.report_id)}" tabindex="0" role="button" aria-label="Open report details">` +
            `  <span class="ac-icon" aria-hidden="true">📄</span>` +
            `  <div class="ac-body">` +
            `    <div class="ac-title">${escapeHtml(DAMAGE_TYPE_LABELS[report.damage_type] || report.damage_type)}</div>` +
            `    <div class="ac-meta">` +
            `      <span>📍 ${escapeHtml(report.location)}</span>` +
            `      <span>🕒 ${escapeHtml(timeAgo(report.created_at))}</span>` +
            `    </div>` +
            `    <div class="ac-meta" style="margin-top:6px;">${severityBadge(report.severity)} ${statusBadge(report.status)}</div>` +
            `  </div>` +
            `</div>`
        );
    }

    function wireReportRows(root) {
        root.querySelectorAll(".report-row").forEach((row) => {
            const open = () => openReportDrawer(row.dataset.reportId);
            row.addEventListener("click", open);
            row.addEventListener("keydown", (e) => {
                if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); }
            });
        });
    }

    if (avatar) avatar.textContent = (currentUser.name || "C").trim().charAt(0).toUpperCase();
