/* RecoveryBoard + RescueMesh — login page */
(function () {
    "use strict";

    const form = document.getElementById("login-form");
    const alertBox = document.getElementById("form-alert");
    const loginBtn = document.getElementById("login-btn");
    const emailInput = document.getElementById("email");
    const passwordInput = document.getElementById("password");
    const rememberInput = document.getElementById("remember");
    let submitting = false;

    /* -------------------------------------------------- URL notices */
    const params = new URLSearchParams(window.location.search);
    const showError = params.get("error");
    const notice = params.get("notice");
    const next = params.get("next");

    function showAlert(message, kind = "error") {
        alertBox.textContent = message;
        alertBox.className = `form-alert show ${kind === "error" ? "" : kind}`.trim();
    }
    function hideAlert() { alertBox.className = "form-alert"; alertBox.textContent = ""; }

    if (showError) showAlert(showError, "error");
    else if (notice) showAlert(notice, "info");

    /* ---------------------------------------- already logged in? */
    if (isAuthenticated() && !showError && !notice) {
        redirectByRole();
        return;
    }

    /* -------------------------------------------------- validation */
    function setFieldError(input, hasError) {
        input.classList.toggle("is-invalid", hasError);
        const err = document.getElementById(`${input.id}-error`);
        if (err) err.classList.toggle("show", hasError);
        input.setAttribute("aria-invalid", String(hasError));
    }

    function validate() {
        let ok = true;
        const emailOk = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailInput.value.trim());
        setFieldError(emailInput, !emailOk);
        if (!emailOk) ok = false;
        const pwOk = passwordInput.value.length > 0;
        setFieldError(passwordInput, !pwOk);
        if (!pwOk) ok = false;
        return ok;
    }

    [emailInput, passwordInput].forEach((input) => {
        input.addEventListener("input", () => {
            if (input.classList.contains("is-invalid")) validate();
            hideAlert();
        });
    });

    /* -------------------------------------------------- submit */
    form.addEventListener("submit", async (event) => {
        event.preventDefault();
        if (submitting) return; // prevent duplicate login requests
        hideAlert();

        if (!validate()) {
            showAlert("Please fix the highlighted fields.");
            return;
        }

        submitting = true;
        const restore = setButtonLoading(loginBtn, "Logging in...");
        try {
            const user = await loginUser(
                emailInput.value.trim(),
                passwordInput.value,
                rememberInput.checked
            );
            loginBtn.textContent = "Login successful";
            toast(`Welcome back, ${user.name}`, "success");

            // Post-login target: ?next=sos → citizen SOS view, ?next=recovery → admin board
            if (next === "sos") {
                window.location.href = "citizen.html#sos";
            } else if (next === "recovery") {
                redirectByRole(user.role);
            } else {
                redirectByRole(user.role); // role from backend response
            }
        } catch (err) {
            submitting = false;
            restore();
            const message = err && err.status === 0 && err.details === null && /connect/i.test(err.message)
                ? err.message
                : (err && err.message) || "Unable to login. Please try again.";
            showAlert(message, "error");
            toast(message, "error");
        }
    });
})();
