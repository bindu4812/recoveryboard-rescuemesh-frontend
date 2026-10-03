/* =============================================================================
 * RecoveryBoard + RescueMesh — API Layer
 * FastAPI Backend Connection
 * ============================================================================= */

"use strict";

/* ==========================================================================
 * BACKEND URL
 * ========================================================================== */

const API_BASE_URL = "https://recoveryboard-rescuemesh-1.onrender.com";


/* ==========================================================================
 * COMMON API ERROR
 * ========================================================================== */

class ApiError extends Error {
    constructor(message, status = 0, details = null) {
        super(message);
        this.name = "ApiError";
        this.status = status;
        this.details = details;
    }
}


/* ==========================================================================
 * FRIENDLY ERROR MESSAGE
 * ========================================================================== */

function friendlyError(status, payload) {

    const detail =
        payload && typeof payload === "object"
            ? payload.detail
            : payload;

    if (typeof detail === "string" && detail.trim()) {
        return detail;
    }

    if (Array.isArray(detail)) {

        const first = detail.find(
            (item) => item && item.msg
        );

        if (first) {
            return first.msg;
        }
    }

    switch (status) {

        case 400:
            return "The request could not be processed. Please check the details.";

        case 401:
            return "Your session has expired. Please login again.";

        case 403:
            return "You are not authorized to perform this action.";

        case 404:
            return "The requested information was not found.";

        case 409:
            return "This account or data already exists.";

        case 422:
            return "Some information is missing or invalid. Please check the form.";

        case 500:
            return "Server error. Please try again.";

        default:
            return "Something went wrong. Please try again.";
    }
}


/* ==========================================================================
 * TOKEN
 * ========================================================================== */

function _readToken() {

    try {

        return (
            localStorage.getItem("rb_token") ||
            sessionStorage.getItem("rb_token") ||
            null
        );

    } catch (error) {

        console.warn(
            "Unable to read authentication token:",
            error
        );

        return null;
    }
}


/* ==========================================================================
 * CENTRAL API REQUEST
 * ========================================================================== */

async function apiRequest(endpoint, options = {}) {

    const url = `${API_BASE_URL}${endpoint}`;

    const headers = {
        Accept: "application/json",
        ...(options.headers || {})
    };

    const token = _readToken();

    if (token) {
        headers.Authorization = `Bearer ${token}`;
    }

    const config = {
        ...options,
        headers
    };

    /*
     * Convert JavaScript objects into JSON automatically.
     */
    if (
        config.body &&
        typeof config.body !== "string"
    ) {

        headers["Content-Type"] = "application/json";

        config.body = JSON.stringify(
            config.body
        );
    }

    let response;

    try {

        response = await fetch(
            url,
            config
        );

    } catch (error) {

        console.error(
            "Backend connection error:",
            error
        );

        throw new ApiError(
            "Unable to connect to RecoveryBoard backend. Make sure FastAPI is running.",
            0
        );
    }


    /* ----------------------------------------------------------------------
     * Read response
     * ---------------------------------------------------------------------- */

    let payload = null;

    if (response.status !== 204) {

        const text = await response.text();

        if (text) {

            try {

                payload = JSON.parse(text);

            } catch (error) {

                payload = text;
            }
        }
    }


    /* ----------------------------------------------------------------------
     * Handle HTTP errors
     * ---------------------------------------------------------------------- */

    if (!response.ok) {

        const error = new ApiError(
            friendlyError(
                response.status,
                payload
            ),
            response.status,
            payload
        );

        /*
         * If JWT is expired/invalid,
         * auth.js will clear the session and redirect.
         */
        if (
            response.status === 401 &&
            typeof handleSessionExpiry === "function"
        ) {

            handleSessionExpiry();
        }

        throw error;
    }


    return payload;
}


/* ==========================================================================
 * QUERY STRING HELPER
 * ========================================================================== */

function _qs(params = {}) {

    const query =
        new URLSearchParams();

    Object.entries(params).forEach(
        ([key, value]) => {

            if (
                value !== undefined &&
                value !== null &&
                value !== ""
            ) {

                query.set(
                    key,
                    value
                );
            }
        }
    );

    const result =
        query.toString();

    return result
        ? `?${result}`
        : "";
}


/* ==========================================================================
 * AUTHENTICATION
 * ========================================================================== */


/*
 * POST /api/auth/register
 *
 * Public registration.
 *
 * Allowed roles according to backend:
 * - authority
 * - field_officer
 * - rescue_team
 */

async function registerUser(data) {

    return apiRequest(
        "/api/auth/register",
        {
            method: "POST",

            body: {
                name: data.name,
                email: data.email,
                password: data.password,
                role: data.role
            }
        }
    );
}


/*
 * POST /api/auth/login
 */

async function loginRequest(
    email,
    password
) {

    return apiRequest(
        "/api/auth/login",
        {
            method: "POST",

            body: {
                email,
                password
            }
        }
    );
}


/*
 * GET /api/auth/me
 */

async function fetchCurrentUser() {

    return apiRequest(
        "/api/auth/me"
    );
}


/* ==========================================================================
 * USERS
 * ========================================================================== */


/*
 * GET /api/users
 *
 * Admin only.
 */

async function getUsers(
    params = {}
) {

    return apiRequest(
        `/api/users${_qs(params)}`
    );
}


/*
 * POST /api/users
 *
 * Admin only.
 *
 * Can create a user with any role.
 */

async function createUser(
    data
) {

    return apiRequest(
        "/api/users",
        {
            method: "POST",
            body: data
        }
    );
}


/*
 * GET /api/users/{user_id}
 *
 * Admin only.
 */

async function getUser(
    userId
) {

    return apiRequest(
        `/api/users/${encodeURIComponent(userId)}`
    );
}


/*
 * PATCH /api/users/{user_id}
 *
 * Admin only.
 */

async function updateUser(
    userId,
    data
) {

    return apiRequest(
        `/api/users/${encodeURIComponent(userId)}`,
        {
            method: "PATCH",
            body: data
        }
    );
}


/* ==========================================================================
 * INCIDENTS
 * ========================================================================== */


/*
 * GET /api/incidents
 *
 * Search / filter / pagination.
 */

async function getIncidents(
    params = {}
) {

    return apiRequest(
        `/api/incidents${_qs(params)}`
    );
}


/*
 * GET /api/incidents/{incident_id}
 */

async function getIncident(
    incidentId
) {

    return apiRequest(
        `/api/incidents/${encodeURIComponent(incidentId)}`
    );
}


/*
 * POST /api/incidents
 *
 * Admin / Authority.
 */

async function createIncident(
    data
) {

    return apiRequest(
        "/api/incidents",
        {
            method: "POST",
            body: data
        }
    );
}


/*
 * PUT /api/incidents/{incident_id}
 *
 * Admin / Authority.
 */

async function updateIncident(
    incidentId,
    data
) {

    return apiRequest(
        `/api/incidents/${encodeURIComponent(incidentId)}`,
        {
            method: "PUT",
            body: data
        }
    );
}


/*
 * DELETE /api/incidents/{incident_id}
 *
 * Admin only.
 */

async function deleteIncident(
    incidentId
) {

    return apiRequest(
        `/api/incidents/${encodeURIComponent(incidentId)}`,
        {
            method: "DELETE"
        }
    );
}


/* ==========================================================================
 * DAMAGE REPORTS
 * ========================================================================== */


/*
 * GET /api/damage-reports
 *
 * Search / filter / pagination.
 */

async function getDamageReports(
    params = {}
) {

    return apiRequest(
        `/api/damage-reports${_qs(params)}`
    );
}


/*
 * GET /api/damage-reports/{report_id}
 */

async function getDamageReport(
    reportId
) {

    return apiRequest(
        `/api/damage-reports/${encodeURIComponent(reportId)}`
    );
}


/*
 * POST /api/damage-reports
 *
 * Admin / Authority / Field Officer.
 */

async function createDamageReport(
    data
) {

    return apiRequest(
        "/api/damage-reports",
        {
            method: "POST",
            body: data
        }
    );
}


/*
 * PUT /api/damage-reports/{report_id}
 */

async function updateDamageReport(
    reportId,
    data
) {

    return apiRequest(
        `/api/damage-reports/${encodeURIComponent(reportId)}`,
        {
            method: "PUT",
            body: data
        }
    );
}


/*
 * PUT /api/damage-reports/{report_id}/status
 */

async function changeReportStatus(
    reportId,
    status,
    note = null
) {

    return apiRequest(
        `/api/damage-reports/${encodeURIComponent(reportId)}/status`,
        {
            method: "PUT",

            body: {
                status,
                note
            }
        }
    );
}


/*
 * GET /api/damage-reports/{report_id}/history
 */

async function getReportHistory(
    reportId
) {

    return apiRequest(
        `/api/damage-reports/${encodeURIComponent(reportId)}/history`
    );
}


/* ==========================================================================
 * RECOVERY TASKS
 * ========================================================================== */


/*
 * GET /api/recovery-tasks
 *
 * Search / filter / pagination.
 */

async function getRecoveryTasks(
    params = {}
) {

    return apiRequest(
        `/api/recovery-tasks${_qs(params)}`
    );
}


/*
 * GET /api/recovery-tasks/{task_id}
 */

async function getRecoveryTask(
    taskId
) {

    return apiRequest(
        `/api/recovery-tasks/${encodeURIComponent(taskId)}`
    );
}


/*
 * GET /api/recovery-tasks/{task_id}/priority
 */

async function getTaskPriority(
    taskId
) {

    return apiRequest(
        `/api/recovery-tasks/${encodeURIComponent(taskId)}/priority`
    );
}


/*
 * GET /api/recovery-tasks/{task_id}/report
 */

async function getTaskReport(
    taskId
) {

    return apiRequest(
        `/api/recovery-tasks/${encodeURIComponent(taskId)}/report`
    );
}


/*
 * POST /api/recovery-tasks/{task_id}/assign
 *
 * Admin / Authority.
 */

async function assignTask(
    taskId,
    data
) {

    return apiRequest(
        `/api/recovery-tasks/${encodeURIComponent(taskId)}/assign`,
        {
            method: "POST",
            body: data
        }
    );
}


/*
 * POST /api/recovery-tasks/{task_id}/unassign
 *
 * Admin / Authority.
 */

async function unassignTask(
    taskId
) {

    return apiRequest(
        `/api/recovery-tasks/${encodeURIComponent(taskId)}/unassign`,
        {
            method: "POST",
            body: {}
        }
    );
}


/* ==========================================================================
 * DEPENDENCIES
 * ========================================================================== */


/*
 * POST /api/recovery-tasks/{task_id}/dependencies
 */

async function addDependency(
    taskId,
    data
) {

    return apiRequest(
        `/api/recovery-tasks/${encodeURIComponent(taskId)}/dependencies`,
        {
            method: "POST",
            body: data
        }
    );
}


/*
 * GET /api/recovery-tasks/{task_id}/dependencies
 */

async function getDependencies(
    taskId
) {

    return apiRequest(
        `/api/recovery-tasks/${encodeURIComponent(taskId)}/dependencies`
    );
}


/*
 * GET /api/recovery-tasks/{task_id}/dependencies/status
 */

async function getDependencyStatus(
    taskId
) {

    return apiRequest(
        `/api/recovery-tasks/${encodeURIComponent(taskId)}/dependencies/status`
    );
}


/*
 * DELETE /api/recovery-tasks/{task_id}/dependencies/{dependency_id}
 */

async function removeDependency(
    taskId,
    dependencyId
) {

    return apiRequest(
        `/api/recovery-tasks/${encodeURIComponent(taskId)}/dependencies/${encodeURIComponent(dependencyId)}`,
        {
            method: "DELETE"
        }
    );
}


/* ==========================================================================
 * RESOURCES
 * ========================================================================== */


/*
 * GET /api/resources
 *
 * Search / filter / pagination.
 */

async function getResources(
    params = {}
) {

    return apiRequest(
        `/api/resources${_qs(params)}`
    );
}


/*
 * POST /api/resources
 *
 * Admin / Authority.
 */

async function createResource(
    data
) {

    return apiRequest(
        "/api/resources",
        {
            method: "POST",
            body: data
        }
    );
}


/*
 * GET /api/resources/{resource_id}
 */

async function getResource(
    resourceId
) {

    return apiRequest(
        `/api/resources/${encodeURIComponent(resourceId)}`
    );
}


/*
 * PUT /api/resources/{resource_id}
 *
 * Admin / Authority.
 */

async function updateResource(
    resourceId,
    data
) {

    return apiRequest(
        `/api/resources/${encodeURIComponent(resourceId)}`,
        {
            method: "PUT",
            body: data
        }
    );
}


/*
 * DELETE /api/resources/{resource_id}
 *
 * Admin only.
 */

async function deleteResource(
    resourceId
) {

    return apiRequest(
        `/api/resources/${encodeURIComponent(resourceId)}`,
        {
            method: "DELETE"
        }
    );
}


/* ==========================================================================
 * TEAMS
 * ========================================================================== */


/*
 * GET /api/teams
 *
 * Search / filter / pagination.
 */

async function getTeams(
    params = {}
) {

    return apiRequest(
        `/api/teams${_qs(params)}`
    );
}


/*
 * POST /api/teams
 *
 * Admin / Authority.
 */

async function createTeam(
    data
) {

    return apiRequest(
        "/api/teams",
        {
            method: "POST",
            body: data
        }
    );
}


/*
 * GET /api/teams/{team_id}
 */

async function getTeam(
    teamId
) {

    return apiRequest(
        `/api/teams/${encodeURIComponent(teamId)}`
    );
}


/*
 * PUT /api/teams/{team_id}
 *
 * Admin / Authority.
 */

async function updateTeam(
    teamId,
    data
) {

    return apiRequest(
        `/api/teams/${encodeURIComponent(teamId)}`,
        {
            method: "PUT",
            body: data
        }
    );
}


/*
 * DELETE /api/teams/{team_id}
 *
 * Admin only.
 */

async function deleteTeam(
    teamId
) {

    return apiRequest(
        `/api/teams/${encodeURIComponent(teamId)}`,
        {
            method: "DELETE"
        }
    );
}


/* ==========================================================================
 * DASHBOARD
 * ========================================================================== */


/*
 * GET /api/dashboard/summary
 */

async function getDashboardSummary() {

    return apiRequest(
        "/api/dashboard/summary"
    );
}


/*
 * GET /api/dashboard/tasks
 */

async function getDashboardTasks(
    params = {}
) {

    return apiRequest(
        `/api/dashboard/tasks${_qs(params)}`
    );
}


/* ==========================================================================
 * HEALTH CHECK
 * ========================================================================== */


/*
 * GET /health
 *
 * Public backend health check.
 */

async function checkBackendHealth() {

    return apiRequest(
        "/health"
    );
}


/* ==========================================================================
 * EMERGENCY SOS
 * ========================================================================== */

/*
 * IMPORTANT:
 *
 * Swagger me /api/sos endpoint currently available nahi hai.
 *
 * Isliye false rakha gaya hai.
 */

const SOS_ENDPOINT_AVAILABLE = false;


async function sendSOS({
    latitude,
    longitude,
    message
}) {

    if (!SOS_ENDPOINT_AVAILABLE) {

        throw new ApiError(
            "Emergency SOS is not yet connected to the server. Please file an incident report.",
            0
        );
    }

    return apiRequest(
        "/api/sos",
        {
            method: "POST",

            body: {
                latitude,
                longitude,
                message
            }
        }
    );
}


/* ==========================================================================
 * GEOLOCATION
 * ========================================================================== */

function getCurrentPosition() {

    return new Promise(
        (resolve, reject) => {

            if (
                !("geolocation" in navigator)
            ) {

                reject(
                    new ApiError(
                        "Location is not available in this browser.",
                        0
                    )
                );

                return;
            }


            navigator.geolocation.getCurrentPosition(

                (position) => {

                    resolve({

                        latitude:
                            position.coords.latitude,

                        longitude:
                            position.coords.longitude

                    });
                },


                (error) => {

                    const messages = {

                        1:
                            "Location permission was denied.",

                        2:
                            "Your location could not be determined.",

                        3:
                            "Location request timed out."
                    };


                    reject(
                        new ApiError(
                            messages[error.code] ||
                            "Unable to read your location.",
                            0
                        )
                    );
                },


                {
                    enableHighAccuracy: true,
                    timeout: 12000,
                    maximumAge: 30000
                }
            );
        }
    );
}