```javascript
/* RecoveryBoard + RescueMesh — Registration */

(function () {

    "use strict";

    const form = document.getElementById("register-form");
    const alertBox = document.getElementById("form-alert");
    const registerBtn = document.getElementById("register-btn");

    // Check required elements
    if (!form) {
        console.error("Registration form not found.");
        return;
    }

    const fields = {
        name: document.getElementById("full_name"),
        email: document.getElementById("email"),
        password: document.getElementById("password"),
        confirm: document.getElementById("confirm_password"),
        role: document.getElementById("role")
    };

    let submitting = false;

    // --------------------------------------------------
    // Alert
    // --------------------------------------------------

    function showAlert(message, type = "error") {

        if (!alertBox) {
            console.error(message);
            return;
        }

        alertBox.textContent = message;
        alertBox.className = "form-alert show";

        if (type === "success") {
            alertBox.classList.add("success");
        }
    }

    function hideAlert() {

        if (!alertBox) return;

        alertBox.textContent = "";
        alertBox.className = "form-alert";
    }

    // --------------------------------------------------
    // Validation
    // --------------------------------------------------

    function validate() {

        let valid = true;

        // Full name
        const name = fields.name?.value.trim() || "";

        if (name.length < 2) {

            valid = false;
            fields.name?.classList.add("is-invalid");

        } else {

            fields.name?.classList.remove("is-invalid");
        }

        // Email
        const email = fields.email?.value.trim() || "";

        const emailValid =
            /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

        if (!emailValid) {

            valid = false;
            fields.email?.classList.add("is-invalid");

        } else {

            fields.email?.classList.remove("is-invalid");
        }

        // Password
        const password = fields.password?.value || "";

        if (password.length < 8) {

            valid = false;
            fields.password?.classList.add("is-invalid");

        } else {

            fields.password?.classList.remove("is-invalid");
        }

        // Confirm password
        const confirm = fields.confirm?.value || "";

        if (confirm.length === 0 || confirm !== password) {

            valid = false;
            fields.confirm?.classList.add("is-invalid");

        } else {

            fields.confirm?.classList.remove("is-invalid");
        }

        // Role
        const role = fields.role?.value || "";

        if (!role) {

            valid = false;
            fields.role?.classList.add("is-invalid");

        } else {

            fields.role?.classList.remove("is-invalid");
        }

        return valid;
    }

    // --------------------------------------------------
    // Clear alert while typing
    // --------------------------------------------------

    Object.values(fields).forEach((input) => {

        if (!input) return;

        input.addEventListener("input", () => {
            hideAlert();
        });

        input.addEventListener("change", () => {
            hideAlert();
        });

    });

    // --------------------------------------------------
    // Registration
    // --------------------------------------------------

    form.addEventListener("submit", async function (event) {

        event.preventDefault();

        console.log("Registration form submitted.");

        if (submitting) return;

        hideAlert();

        // Validate
        if (!validate()) {

            showAlert(
                "Please fill all required fields correctly."
            );

            return;
        }

        // Check API function
        if (typeof registerUser !== "function") {

            console.error(
                "registerUser() is not available."
            );

            showAlert(
                "Registration service is not loaded. Please refresh the page."
            );

            return;
        }

        submitting = true;

        if (registerBtn) {

            registerBtn.disabled = true;
            registerBtn.textContent = "Creating account...";
        }

        try {

            // Data sent to FastAPI
            const registrationData = {

                name: fields.name.value.trim(),
                email: fields.email.value.trim(),
                password: fields.password.value,
                role: fields.role.value

            };

            console.log(
                "Sending registration request:",
                registrationData
            );

            // Call backend
            const response = await registerUser(
                registrationData
            );

            console.log(
                "Registration successful:",
                response
            );

            showAlert(
                "Registration successful! Redirecting to login...",
                "success"
            );

            if (typeof toast === "function") {

                toast(
                    "Registration successful! Please login.",
                    "success"
                );
            }

            if (registerBtn) {

                registerBtn.textContent = "Account Created ✓";
            }

            // Redirect
            setTimeout(() => {

                window.location.href = "login.html";

            }, 1500);

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );

            submitting = false;

            if (registerBtn) {

                registerBtn.disabled = false;
                registerBtn.textContent = "Create Account";
            }

            let message =
                "Unable to create the account. Please try again.";

            if (error && error.message) {

                message = error.message;
            }

            showAlert(message);

            if (typeof toast === "function") {

                toast(message, "error");
            }
        }

    });

    console.log(
        "RecoveryBoard registration.js loaded successfully."
    );

})();
```
