/* RecoveryBoard + RescueMesh — landing page behavior */
(function () {
    "use strict";

    // Mobile navigation toggle
    const toggle = document.getElementById("nav-toggle");
    const links = document.getElementById("nav-links");
    if (toggle && links) {
        toggle.addEventListener("click", () => {
            const open = links.classList.toggle("open");
            toggle.setAttribute("aria-expanded", String(open));
            toggle.textContent = open ? "✕" : "☰";
        });
        links.querySelectorAll("a").forEach((a) => {
            a.addEventListener("click", () => {
                links.classList.remove("open");
                toggle.setAttribute("aria-expanded", "false");
                toggle.textContent = "☰";
            });
        });
    }

    // Footer year
    const year = document.getElementById("year");
    if (year) year.textContent = String(new Date().getFullYear());

    // If a session already exists, "Login"/"Register" quietly lead to the
    // user's dashboard (role comes from stored backend response, never hardcoded).
    try {
        const token = localStorage.getItem("rb_token") || sessionStorage.getItem("rb_token");
        const raw = localStorage.getItem("rb_user") || sessionStorage.getItem("rb_user");
        if (token && raw) {
            const user = JSON.parse(raw);
            const landing = { admin: "admin.html", authority: "admin.html", field_officer: "citizen.html", rescue_team: "rescue-team.html" };
            const target = landing[user.role];
            if (target) {
                document.querySelectorAll('a[href="login.html"], a[href="register.html"]').forEach((a) => {
                    if (!a.classList.contains("nav-cta")) a.setAttribute("href", target);
                });
            }
        }
    } catch (_) { /* storage unavailable — stay on landing */ }
})();
