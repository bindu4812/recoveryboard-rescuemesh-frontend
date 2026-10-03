/* ================================================================
RecoveryBoard + RescueMesh — Authentication & Session Layer
================================================================ */

"use strict";

/* ---------------------------------------------------------------
Storage Keys
---------------------------------------------------------------- */

const RB_TOKEN_KEY = "rb_token";
const RB_USER_KEY = "rb_user";
const RB_REMEMBER_KEY = "rb_remember";

/* ---------------------------------------------------------------
Storage Helpers
---------------------------------------------------------------- */

function _getStorage(remember = false) {

```
try {

    return remember
        ? localStorage
        : sessionStorage;

} catch (error) {

    return sessionStorage;
}
```

}

function _getActiveStorage() {

```
try {

    if (
        localStorage.getItem(
            RB_TOKEN_KEY
        )
    ) {
        return localStorage;
    }

    if (
        sessionStorage.getItem(
            RB_TOKEN_KEY
        )
    ) {
        return sessionStorage;
    }

} catch (error) {

    console.warn(
        "Storage access error:",
        error
    );
}

return null;
```

}

/* ---------------------------------------------------------------
Token
---------------------------------------------------------------- */

function getToken() {

```
try {

    return (
        localStorage.getItem(
            RB_TOKEN_KEY
        ) ||
        sessionStorage.getItem(
            RB_TOKEN_KEY
        ) ||
        null
    );

} catch (error) {

    return null;
}
```

}

/* ---------------------------------------------------------------
Current User
---------------------------------------------------------------- */

function getCurrentUser() {

```
try {

    const raw =
        localStorage.getItem(
            RB_USER_KEY
        ) ||
        sessionStorage.getItem(
            RB_USER_KEY
        );

    if (!raw) {
        return null;
    }

    return JSON.parse(raw);

} catch (error) {

    console.error(
        "Unable to read current user:",
        error
    );

    return null;
}
```

}

/* ---------------------------------------------------------------
User Role
---------------------------------------------------------------- */

function getUserRole() {

```
const user =
    getCurrentUser();

return user && user.role
    ? user.role
    : null;
```

}

/* ---------------------------------------------------------------
Authentication Check
---------------------------------------------------------------- */

function isAuthenticated() {

```
return Boolean(
    getToken()
);
```

}

/* ---------------------------------------------------------------
Save Session
---------------------------------------------------------------- */

function _saveSession(
token,
user,
remember = false
) {

```
if (!token || !user) {

    throw new Error(
        "Invalid authentication data."
    );
}


try {

    /* Remove old session */

    localStorage.removeItem(
        RB_TOKEN_KEY
    );

    localStorage.removeItem(
        RB_USER_KEY
    );

    sessionStorage.removeItem(
        RB_TOKEN_KEY
    );

    sessionStorage.removeItem(
        RB_USER_KEY
    );


    /* Save remember preference */

    localStorage.setItem(
        RB_REMEMBER_KEY,
        remember ? "1" : "0"
    );


    /* Select storage */

    const storage =
        _getStorage(remember);


    /* Save JWT */

    storage.setItem(
        RB_TOKEN_KEY,
        token
    );


    /* Save user */

    storage.setItem(
        RB_USER_KEY,
        JSON.stringify(user)
    );


} catch (error) {

    console.error(
        "Unable to save session:",
        error
    );

    throw new Error(
        "Unable to save login session."
    );
}
```

}

/* ---------------------------------------------------------------
Clear Session
---------------------------------------------------------------- */

function _clearSession() {

```
try {

    localStorage.removeItem(
        RB_TOKEN_KEY
    );

    localStorage.removeItem(
        RB_USER_KEY
    );

    localStorage.removeItem(
        RB_REMEMBER_KEY
    );


    sessionStorage.removeItem(
        RB_TOKEN_KEY
    );

    sessionStorage.removeItem(
        RB_USER_KEY
    );

    sessionStorage.removeItem(
        RB_REMEMBER_KEY
    );

} catch (error) {

    console.warn(
        "Unable to completely clear session:",
        error
    );
}
```

}

/* ---------------------------------------------------------------
LOGIN
---------------------------------------------------------------- */

/*
Backend:
POST /api/auth/login

Request:
{
email,
password
}

Response:
{
access_token,
token_type,
user
}
*/

async function loginUser(
email,
password,
remember = false
) {

```
if (!email || !password) {

    throw new Error(
        "Email and password are required."
    );
}


const response =
    await loginRequest(
        email,
        password
    );


if (
    !response ||
    !response.access_token ||
    !response.user
) {

    throw new Error(
        "Invalid response from server."
    );
}


/* Save backend JWT */

_saveSession(
    response.access_token,
    response.user,
    Boolean(remember)
);


return response.user;
```

}

/* ---------------------------------------------------------------
REGISTER + LOGIN
---------------------------------------------------------------- */

async function registerAndLogin(data) {

```
const response =
    await registerUser(data);


if (
    !response ||
    !response.access_token ||
    !response.user
) {

    throw new Error(
        "Invalid registration response from server."
    );
}


_saveSession(
    response.access_token,
    response.user,
    Boolean(data.remember)
);


return response.user;
```

}

/* ---------------------------------------------------------------
LOGOUT
---------------------------------------------------------------- */

function logoutUser(
message = "You have been logged out."
) {

```
_clearSession();


const params =
    new URLSearchParams();


if (message) {

    params.set(
        "notice",
        message
    );
}


window.location.href =
    "login.html?" +
    params.toString();
```

}

/* ---------------------------------------------------------------
Role → Dashboard
---------------------------------------------------------------- */

const ROLE_LANDING = {

```
admin:
    "admin.html",

authority:
    "admin.html",

field_officer:
    "citizen.html",

rescue_team:
    "rescue-team.html"
```

};

const ROLE_LABELS = {

```
admin:
    "Administrator",

authority:
    "Authority",

field_officer:
    "Field Officer",

rescue_team:
    "Rescue Team"
```

};

/* ---------------------------------------------------------------
Redirect By Role
---------------------------------------------------------------- */

function redirectByRole(
role = null
) {

```
const effectiveRole =
    role || getUserRole();


const target =
    ROLE_LANDING[
        effectiveRole
    ];


if (!target) {

    console.error(
        "Unknown user role:",
        effectiveRole
    );

    window.location.href =
        "login.html";

    return;
}


window.location.href =
    target;
```

}

/* ---------------------------------------------------------------
Protected Page
---------------------------------------------------------------- */

function requireAuth(
allowedRoles = null
) {

```
/* No token */

if (!isAuthenticated()) {

    const params =
        new URLSearchParams();

    params.set(
        "error",
        "Please login to continue."
    );

    window.location.href =
        "login.html?" +
        params.toString();

    return null;
}


/* Get cached user */

const user =
    getCurrentUser();


if (!user) {

    console.error(
        "JWT exists but user information is missing."
    );

    handleSessionExpiry();

    return null;
}


/* Check allowed roles */

if (
    Array.isArray(allowedRoles) &&
    allowedRoles.length > 0 &&
    !allowedRoles.includes(
        user.role
    )
) {

    redirectByRole(
        user.role
    );

    return null;
}


return user;
```

}

/* ---------------------------------------------------------------
Validate Session With Backend
---------------------------------------------------------------- */

async function validateSession() {

```
if (!isAuthenticated()) {

    requireAuth();

    return null;
}


try {

    const freshUser =
        await fetchCurrentUser();


    if (
        freshUser &&
        freshUser.role
    ) {

        const storage =
            _getActiveStorage();


        if (storage) {

            storage.setItem(
                RB_USER_KEY,
                JSON.stringify({
                    id:
                        freshUser.id,

                    name:
                        freshUser.name,

                    email:
                        freshUser.email,

                    role:
                        freshUser.role
                })
            );
        }


        return freshUser;
    }


    return getCurrentUser();


} catch (error) {

    console.error(
        "Session validation failed:",
        error
    );


    /*
       api.js handles HTTP 401.
       For temporary network/server problems,
       keep cached session.
    */

    if (
        error &&
        error.status === 401
    ) {

        return null;
    }


    return getCurrentUser();
}
```

}

/* ---------------------------------------------------------------
Session Expiry
---------------------------------------------------------------- */

let _sessionExpiryRedirecting =
false;

function handleSessionExpiry() {

```
if (
    _sessionExpiryRedirecting
) {
    return;
}


_sessionExpiryRedirecting =
    true;


_clearSession();


try {

    sessionStorage.setItem(
        "rb_flash",
        "Session expired. Please login again."
    );

} catch (error) {

    /* Ignore storage errors */
}


if (
    !window.location.pathname
        .toLowerCase()
        .includes("login.html")
) {

    const params =
        new URLSearchParams();

    params.set(
        "error",
        "Session expired. Please login again."
    );


    window.location.href =
        "login.html?" +
        params.toString();
}
```

}

/* ---------------------------------------------------------------
Logout Buttons
---------------------------------------------------------------- */

function bindLogoutButtons() {

```
const buttons =
    document.querySelectorAll(
        "[data-action='logout']"
    );


buttons.forEach(
    function (button) {

        button.addEventListener(
            "click",
            function (event) {

                event.preventDefault();

                logoutUser(
                    "You have been logged out."
                );
            }
        );

    }
);
```

}
