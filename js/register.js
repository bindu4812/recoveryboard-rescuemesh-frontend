/* RecoveryBoard + RescueMesh — Registration */

(function () {

```
"use strict";

const form = document.getElementById("register-form");
const alertBox = document.getElementById("form-alert");
const registerBtn = document.getElementById("register-btn");

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


/* --------------------------------------------------
   Alert
-------------------------------------------------- */

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


/* --------------------------------------------------
   Check Authentication
-------------------------------------------------- */

if (
    typeof isAuthenticated === "function" &&
    isAuthenticated()
) {

    if (typeof redirectByRole === "function") {
        redirectByRole();
    }

    return;
}


/* --------------------------------------------------
   Field Error
-------------------------------------------------- */

function setFieldError(input, hasError) {

    if (!input) return;

    input.classList.toggle(
        "is-invalid",
        hasError
    );

    input.setAttribute(
        "aria-invalid",
        String(hasError)
    );

    const errorElement =
        document.getElementById(
            input.id + "-error"
        );

    if (errorElement) {

        errorElement.classList.toggle(
            "show",
            hasError
        );
    }
}


/* --------------------------------------------------
   Validation
-------------------------------------------------- */

function validate() {

    let valid = true;


    /* Name */

    const nameValue =
        fields.name
            ? fields.name.value.trim()
            : "";

    const nameValid =
        nameValue.length >= 2;

    setFieldError(
        fields.name,
        !nameValid
    );

    if (!nameValid) {
        valid = false;
    }


    /* Email */

    const emailValue =
        fields.email
            ? fields.email.value.trim()
            : "";

    const emailValid =
        /^[^\s@]+@[^\s@]+\.[^\s@]+$/
            .test(emailValue);

    setFieldError(
        fields.email,
        !emailValid
    );

    if (!emailValid) {
        valid = false;
    }


    /* Password */

    const passwordValue =
        fields.password
            ? fields.password.value
            : "";

    const passwordValid =
        passwordValue.length >= 8;

    setFieldError(
        fields.password,
        !passwordValid
    );

    if (!passwordValid) {
        valid = false;
    }


    /* Confirm Password */

    const confirmValue =
        fields.confirm
            ? fields.confirm.value
            : "";

    const confirmValid =
        confirmValue.length > 0 &&
        confirmValue === passwordValue;

    setFieldError(
        fields.confirm,
        !confirmValid
    );

    if (!confirmValid) {
        valid = false;
    }


    /* Role */

    const roleValue =
        fields.role
            ? fields.role.value
            : "";

    const roleValid =
        roleValue !== "";

    setFieldError(
        fields.role,
        !roleValid
    );

    if (!roleValid) {
        valid = false;
    }


    return valid;
}


/* --------------------------------------------------
   Live Validation
-------------------------------------------------- */

Object.values(fields).forEach(function (input) {

    if (!input) return;


    input.addEventListener(
        "input",
        function () {

            if (
                input.classList.contains(
                    "is-invalid"
                )
            ) {
                validate();
            }

            hideAlert();
        }
    );


    input.addEventListener(
        "change",
        function () {

            if (
                input.classList.contains(
                    "is-invalid"
                )
            ) {
                validate();
            }

            hideAlert();
        }
    );

});


/* --------------------------------------------------
   Submit Registration
-------------------------------------------------- */

form.addEventListener(
    "submit",
    async function (event) {

        event.preventDefault();


        if (submitting) {
            return;
        }


        hideAlert();


        /* Validate form */

        if (!validate()) {

            showAlert(
                "Please fill all required fields correctly."
            );

            return;
        }


        /* Check API function */

        if (
            typeof registerUser !== "function"
        ) {

            console.error(
                "registerUser() is not available. Check api.js."
            );

            showAlert(
                "Connection error: Registration service is not loaded."
            );

            return;
        }


        submitting = true;


        const originalText =
            registerBtn
                ? registerBtn.textContent
                : "Create Account";


        if (registerBtn) {

            registerBtn.disabled = true;

            registerBtn.textContent =
                "Creating account...";
        }


        try {

            /* Data sent to FastAPI */

            const registrationData = {

                name:
                    fields.name.value.trim(),

                email:
                    fields.email.value.trim(),

                password:
                    fields.password.value,

                role:
                    fields.role.value
            };


            console.log(
                "Registration request:",
                {
                    name: registrationData.name,
                    email: registrationData.email,
                    role: registrationData.role
                }
            );


            /* Call backend */

            const response =
                await registerUser(
                    registrationData
                );


            console.log(
                "Registration successful:",
                response
            );


            /* Success message */

            showAlert(
                "Registration successful. Please login.",
                "success"
            );


            if (
                typeof toast === "function"
            ) {

                toast(
                    "Registration successful. Please login.",
                    "success"
                );
            }


            if (registerBtn) {

                registerBtn.textContent =
                    "Account Created ✓";
            }


            /* Redirect to login */

            setTimeout(
                function () {

                    window.location.href =
                        "login.html";

                },
                1600
            );

        } catch (error) {

            console.error(
                "Registration error:",
                error
            );


            submitting = false;


            if (registerBtn) {

                registerBtn.disabled = false;

                registerBtn.textContent =
                    originalText;
            }


            const message =
                error &&
                error.message
                    ? error.message
                    : "Unable to create the account. Please try again.";


            showAlert(message);


            if (
                typeof toast === "function"
            ) {

                toast(
                    message,
                    "error"
                );
            }

        }

    }
);
```

})();
