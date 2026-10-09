// ============================================================
// SECURE NMS - FRONTEND SCRIPT
// ============================================================

const API_BASE_URL = "http://localhost:3000";

// ============================================================
// DOM ELEMENTS
// ============================================================

// Login
const loginPage = document.getElementById("loginPage");
const dashboardPage = document.getElementById("dashboardPage");
const loginForm = document.getElementById("loginForm");
const loginMessage = document.getElementById("loginMessage");

// User
const loggedUsername = document.getElementById("loggedUsername");
const loggedRole = document.getElementById("loggedRole");

// Navigation
const dashboardNav = document.getElementById("dashboardNav");
const devicesNav = document.getElementById("devicesNav");
const alarmsNav = document.getElementById("alarmsNav");
const networkNav = document.getElementById("networkNav");

// Views
const dashboardView = document.getElementById("dashboardView");
const devicesView = document.getElementById("devicesView");
const alarmsView = document.getElementById("alarmsView");
const networkView = document.getElementById("networkView");

// Dashboard statistics
const totalDevices = document.getElementById("totalDevices");
const onlineDevices = document.getElementById("onlineDevices");
const activeAlarms = document.getElementById("activeAlarms");
const networkStatus = document.getElementById("networkStatus");

// Tables / containers
const devicesTable = document.getElementById("devicesTable");
const devicesPageTable = document.getElementById("devicesPageTable");

const alarmsContainer = document.getElementById("alarmsContainer");
const alarmsPageContainer = document.getElementById("alarmsPageContainer");

// Network page
const networkPageStatus = document.getElementById("networkPageStatus");
const networkPageDevices = document.getElementById("networkPageDevices");
const networkPageAlarms = document.getElementById("networkPageAlarms");

// Buttons
const refreshDevices = document.getElementById("refreshDevices");
const refreshDevicesPage = document.getElementById("refreshDevicesPage");
const refreshAlarmsPage = document.getElementById("refreshAlarmsPage");
const refreshNetworkPage = document.getElementById("refreshNetworkPage");
const logoutBtn = document.getElementById("logoutBtn");

// ============================================================
// APPLICATION STATE
// ============================================================

let authToken = localStorage.getItem("token");

let currentUser = JSON.parse(
    localStorage.getItem("user") || "null"
);

// ============================================================
// API REQUEST HELPER
// ============================================================

async function apiRequest(endpoint, options = {}) {

    const token = localStorage.getItem("token");

    if (!token) {
        throw new Error("No authentication token found");
    }

    const response = await fetch(
        `${API_BASE_URL}${endpoint}`,
        {
            ...options,

            headers: {
                "Content-Type": "application/json",
                ...(options.headers || {}),
                "Authorization": `Bearer ${token}`
            }
        }
    );

    // Session expired
    if (response.status === 401) {

        localStorage.removeItem("token");
        localStorage.removeItem("user");

        authToken = null;
        currentUser = null;

        showLoginPage();

        throw new Error(
            "Session expired. Please login again."
        );
    }

    // Permission denied
    if (response.status === 403) {

        let message = "Access denied";

        try {
            const errorData = await response.json();
            message = errorData.message || message;
        } catch (_) {}

        throw new Error(message);
    }

    let data = {};

    try {
        data = await response.json();
    } catch (_) {
        data = {};
    }

    if (!response.ok) {

        throw new Error(
            data.message || "Request failed"
        );
    }

    return data;
}

// ============================================================
// LOGIN
// ============================================================

if (loginForm) {

    loginForm.addEventListener(
        "submit",
        async (event) => {

            event.preventDefault();

            const username =
                document.getElementById("username").value.trim();

            const password =
                document.getElementById("password").value;

            loginMessage.textContent = "Logging in...";
            loginMessage.className = "message";

            try {

                const response = await fetch(
                    `${API_BASE_URL}/auth/login`,
                    {
                        method: "POST",

                        headers: {
                            "Content-Type": "application/json"
                        },

                        body: JSON.stringify({
                            username,
                            password
                        })
                    }
                );

                let data = {};

                try {
                    data = await response.json();
                } catch (_) {}

                if (!response.ok) {

                    throw new Error(
                        data.message || "Login failed"
                    );
                }

                // Save JWT
                localStorage.setItem(
                    "token",
                    data.token
                );

                localStorage.setItem(
                    "user",
                    JSON.stringify(data.user)
                );

                authToken = data.token;
                currentUser = data.user;

                loginMessage.textContent =
                    "Login successful!";

                loginMessage.className =
                    "message success";

                // Open dashboard
                setTimeout(() => {
                    showDashboard();
                }, 300);

            } catch (error) {

                console.error(
                    "Login error:",
                    error
                );

                loginMessage.textContent =
                    error.message || "Failed to fetch";

                loginMessage.className =
                    "message error";
            }
        }
    );
}

// ============================================================
// SHOW DASHBOARD
// ============================================================

function showDashboard() {

    if (loginPage) {
        loginPage.classList.add("hidden");
    }

    if (dashboardPage) {
        dashboardPage.classList.remove("hidden");
    }

    updateUserInformation();

    setActiveNavigation(dashboardNav);

    showView("dashboard");

    loadDashboard();
}

// ============================================================
// SHOW LOGIN
// ============================================================

function showLoginPage() {

    if (dashboardPage) {
        dashboardPage.classList.add("hidden");
    }

    if (loginPage) {
        loginPage.classList.remove("hidden");
    }

    if (loginForm) {
        loginForm.reset();
    }

    if (loginMessage) {
        loginMessage.textContent = "";
    }
}

// ============================================================
// USER INFORMATION
// ============================================================

function updateUserInformation() {

    if (!currentUser) {
        return;
    }

    if (loggedUsername) {

        loggedUsername.textContent =
            currentUser.username || "User";
    }

    if (loggedRole) {

        loggedRole.textContent =
            currentUser.role || "USER";
    }

    const avatar =
        document.querySelector(".user-avatar");

    if (avatar && currentUser.username) {

        avatar.textContent =
            currentUser.username
                .charAt(0)
                .toUpperCase();
    }
}

// ============================================================
// NAVIGATION
// ============================================================

function setActiveNavigation(activeButton) {

    const navigationButtons = [
        dashboardNav,
        devicesNav,
        alarmsNav,
        networkNav
    ];

    navigationButtons.forEach(button => {

        if (button) {
            button.classList.remove("active");
        }
    });

    if (activeButton) {
        activeButton.classList.add("active");
    }
}

// ============================================================
// SHOW VIEW
// ============================================================

function showView(viewName) {

    const views = [
        dashboardView,
        devicesView,
        alarmsView,
        networkView
    ];

    views.forEach(view => {

        if (view) {
            view.classList.add("hidden");
        }
    });

    // Dashboard
    if (viewName === "dashboard") {

        if (dashboardView) {
            dashboardView.classList.remove("hidden");
        }

        updatePageTitle(
            "Network Dashboard",
            "Monitor your network infrastructure"
        );

        loadDashboard();
    }

    // Devices
    if (viewName === "devices") {

        if (devicesView) {
            devicesView.classList.remove("hidden");
        }

        updatePageTitle(
            "Network Devices",
            "Manage registered network devices"
        );

        loadDevicesPage();
    }

    // Alarms
    if (viewName === "alarms") {

        if (alarmsView) {
            alarmsView.classList.remove("hidden");
        }

        updatePageTitle(
            "Network Alarms",
            "Monitor active network events"
        );

        loadAlarmsPage();
    }

    // Network
    if (viewName === "network") {

        if (networkView) {
            networkView.classList.remove("hidden");
        }

        updatePageTitle(
            "Network Status",
            "Monitor your network infrastructure status"
        );

        loadNetworkPage();
    }
}

// ============================================================
// PAGE TITLE
// ============================================================

function updatePageTitle(title, subtitle) {

    const pageTitle =
        document.getElementById("pageTitle");

    const pageSubtitle =
        document.getElementById("pageSubtitle");

    if (pageTitle) {
        pageTitle.textContent = title;
    }

    if (pageSubtitle) {
        pageSubtitle.textContent = subtitle;
    }
}

// ============================================================
// NAVIGATION EVENTS
// ============================================================

if (dashboardNav) {

    dashboardNav.addEventListener(
        "click",
        () => {

            setActiveNavigation(dashboardNav);
            showView("dashboard");
        }
    );
}

if (devicesNav) {

    devicesNav.addEventListener(
        "click",
        () => {

            setActiveNavigation(devicesNav);
            showView("devices");
        }
    );
}

if (alarmsNav) {

    alarmsNav.addEventListener(
        "click",
        () => {

            setActiveNavigation(alarmsNav);
            showView("alarms");
        }
    );
}

if (networkNav) {

    networkNav.addEventListener(
        "click",
        () => {

            setActiveNavigation(networkNav);
            showView("network");
        }
    );
}

// ============================================================
// LOAD DASHBOARD
// ============================================================

async function loadDashboard() {

    await Promise.all([
        loadDevices(),
        loadAlarms(),
        loadNetworkStatus()
    ]);
}

// ============================================================
// LOAD DEVICES
// ============================================================

async function loadDevices() {

    try {

        const data =
            await apiRequest("/api/devices");

        const devices =
            data.devices || [];

        // Total
        if (totalDevices) {

            totalDevices.textContent =
                devices.length;
        }

        // Online
        if (onlineDevices) {

            const onlineCount =
                devices.filter(
                    device =>
                        String(device.status)
                            .toLowerCase() === "online"
                ).length;

            onlineDevices.textContent =
                onlineCount;
        }

        renderDevicesTable(
            devicesTable,
            devices
        );

    } catch (error) {

        console.error(
            "Failed to load devices:",
            error
        );

        if (devicesTable) {

            devicesTable.innerHTML = `
                <tr>
                    <td colspan="4">
                        Unable to load devices
                    </td>
                </tr>
            `;
        }
    }
}

// ============================================================
// RENDER DEVICES
// ============================================================

function renderDevicesTable(
    tableBody,
    devices
) {

    if (!tableBody) {
        return;
    }

    if (!devices.length) {

        tableBody.innerHTML = `
            <tr>
                <td colspan="4">
                    No devices found
                </td>
            </tr>
        `;

        return;
    }

    tableBody.innerHTML =
        devices.map(device => {

            const status =
                String(
                    device.status || "Unknown"
                );

            const statusClass =
                status.toLowerCase() === "online"
                    ? "online"
                    : "offline";

            return `
                <tr>

                    <td>
                        ${device.id}
                    </td>

                    <td>
                        <strong>
                            ${escapeHTML(device.name)}
                        </strong>
                    </td>

                    <td>
                        ${escapeHTML(device.ip)}
                    </td>

                    <td>
                        <span
                            class="status-badge ${statusClass}"
                        >
                            ${escapeHTML(status)}
                        </span>
                    </td>

                </tr>
            `;

        }).join("");
}

// ============================================================
// DEVICES PAGE
// ============================================================

async function loadDevicesPage() {

    if (!devicesPageTable) {
        return;
    }

    devicesPageTable.innerHTML = `
        <tr>
            <td colspan="4">
                Loading devices...
            </td>
        </tr>
    `;

    try {

        const data =
            await apiRequest("/api/devices");

        const devices =
            data.devices || [];

        renderDevicesTable(
            devicesPageTable,
            devices
        );

        // Show Add Device button for ADMIN
        createAddDeviceButton();

    } catch (error) {

        console.error(
            "Failed to load devices page:",
            error
        );

        devicesPageTable.innerHTML = `
            <tr>
                <td colspan="4">
                    ${escapeHTML(error.message)}
                </td>
            </tr>
        `;
    }
}

// ============================================================
// ADD DEVICE BUTTON
// ============================================================

function createAddDeviceButton() {

    if (!devicesView) {
        return;
    }

    // Only ADMIN can create devices
    if (
        !currentUser ||
        currentUser.role !== "ADMIN"
    ) {
        return;
    }

    if (
        document.getElementById(
            "addDeviceBtn"
        )
    ) {
        return;
    }

    const header =
        devicesView.querySelector(
            ".section-header"
        );

    if (!header) {
        return;
    }

    const button =
        document.createElement("button");

    button.id = "addDeviceBtn";
    button.className = "refresh-btn";
    button.textContent = "+ Add Device";

    button.addEventListener(
        "click",
        showAddDeviceForm
    );

    header.appendChild(button);
}

// ============================================================
// ADD DEVICE FORM
// ============================================================

function showAddDeviceForm() {

    if (
        document.getElementById(
            "addDeviceForm"
        )
    ) {
        return;
    }

    const formContainer =
        document.createElement("div");

    formContainer.id = "addDeviceForm";

    formContainer.style.marginBottom = "20px";
    formContainer.style.padding = "20px";
    formContainer.style.border = "1px solid #ddd";
    formContainer.style.borderRadius = "12px";
    formContainer.style.background = "#fff";

    formContainer.innerHTML = `

        <h3 style="margin-top:0;">
            Add Network Device
        </h3>

        <div style="
            display:grid;
            gap:12px;
            max-width:500px;
        ">

            <input
                id="newDeviceName"
                type="text"
                placeholder="Device name"
                style="padding:12px;"
            >

            <input
                id="newDeviceIP"
                type="text"
                placeholder="IP address"
                style="padding:12px;"
            >

            <select
                id="newDeviceStatus"
                style="padding:12px;"
            >
                <option value="Online">
                    Online
                </option>

                <option value="Offline">
                    Offline
                </option>
            </select>

            <div style="
                display:flex;
                gap:10px;
            ">

                <button
                    id="saveDeviceBtn"
                    class="refresh-btn"
                >
                    Save Device
                </button>

                <button
                    id="cancelDeviceBtn"
                    class="refresh-btn"
                >
                    Cancel
                </button>

            </div>

            <div id="deviceFormMessage"></div>

        </div>
    `;

    devicesView.prepend(formContainer);

    document
        .getElementById("saveDeviceBtn")
        .addEventListener(
            "click",
            addDevice
        );

    document
        .getElementById("cancelDeviceBtn")
        .addEventListener(
            "click",
            () => {
                formContainer.remove();
            }
        );
}

// ============================================================
// ADD DEVICE API
// ============================================================

async function addDevice() {

    const name =
        document
            .getElementById("newDeviceName")
            .value
            .trim();

    const ip =
        document
            .getElementById("newDeviceIP")
            .value
            .trim();

    const status =
        document
            .getElementById("newDeviceStatus")
            .value;

    const message =
        document.getElementById(
            "deviceFormMessage"
        );

    if (!name || !ip) {

        message.textContent =
            "Device name and IP address are required.";

        message.style.color = "red";

        return;
    }

    try {

        message.textContent =
            "Adding device...";

        message.style.color = "#555";

        await apiRequest(
            "/api/devices",
            {
                method: "POST",

                body: JSON.stringify({
                    name,
                    ip,
                    status
                })
            }
        );

        message.textContent =
            "Device added successfully!";

        message.style.color = "green";

        setTimeout(() => {

            const form =
                document.getElementById(
                    "addDeviceForm"
                );

            if (form) {
                form.remove();
            }

            loadDevicesPage();
            loadDashboard();

        }, 500);

    } catch (error) {

        console.error(
            "Add device error:",
            error
        );

        message.textContent =
            error.message;

        message.style.color = "red";
    }
}

// ============================================================
// LOAD ALARMS
// ============================================================

async function loadAlarms() {

    try {

        const data =
            await apiRequest("/api/alarms");

        const alarms =
            data.alarms || [];

        if (activeAlarms) {

            activeAlarms.textContent =
                alarms.length;
        }

        renderAlarms(
            alarmsContainer,
            alarms
        );

    } catch (error) {

        console.error(
            "Failed to load alarms:",
            error
        );

        if (alarmsContainer) {

            alarmsContainer.innerHTML = `
                <div class="loading">
                    Unable to load alarms
                </div>
            `;
        }
    }
}

// ============================================================
// RENDER ALARMS
// ============================================================

function renderAlarms(
    container,
    alarms
) {

    if (!container) {
        return;
    }

    if (!alarms.length) {

        container.innerHTML = `
            <div class="loading">
                No active alarms
            </div>
        `;

        return;
    }

    container.innerHTML =
        alarms.map(alarm => {

            const severity =
                String(
                    alarm.severity || "Unknown"
                ).toLowerCase();

            return `
                <div class="alarm-item">

                    <div class="alarm-icon">
                        🚨
                    </div>

                    <div class="alarm-details">

                        <strong>
                            ${escapeHTML(
                                alarm.message
                            )}
                        </strong>

                        <span>
                            Device:
                            ${escapeHTML(
                                alarm.device
                            )}
                        </span>

                    </div>

                    <span
                        class="alarm-severity ${severity}"
                    >
                        ${escapeHTML(
                            alarm.severity
                        )}
                    </span>

                </div>
            `;

        }).join("");
}

// ============================================================
// ALARMS PAGE
// ============================================================

async function loadAlarmsPage() {

    if (!alarmsPageContainer) {
        return;
    }

    alarmsPageContainer.innerHTML = `
        <div class="loading">
            Loading alarms...
        </div>
    `;

    try {

        const data =
            await apiRequest("/api/alarms");

        const alarms =
            data.alarms || [];

        renderAlarms(
            alarmsPageContainer,
            alarms
        );

    } catch (error) {

        console.error(
            "Failed to load alarms page:",
            error
        );

        alarmsPageContainer.innerHTML = `
            <div class="loading">
                ${escapeHTML(error.message)}
            </div>
        `;
    }
}

// ============================================================
// LOAD NETWORK STATUS
// ============================================================

async function loadNetworkStatus() {

    try {

        const data =
            await apiRequest(
                "/api/network/status"
            );

        if (networkStatus) {

            networkStatus.textContent =
                data.status || "-";
        }

    } catch (error) {

        console.error(
            "Failed to load network status:",
            error
        );

        if (networkStatus) {
            networkStatus.textContent =
                "Error";
        }
    }
}

// ============================================================
// NETWORK STATUS PAGE
// ============================================================

async function loadNetworkPage() {

    if (networkPageStatus) {
        networkPageStatus.textContent =
            "Loading...";
    }

    try {

        const data =
            await apiRequest(
                "/api/network/status"
            );

        if (networkPageStatus) {

            networkPageStatus.textContent =
                data.status || "-";
        }

        if (networkPageDevices) {

            networkPageDevices.textContent =
                data.connectedDevices ?? 0;
        }

        if (networkPageAlarms) {

            networkPageAlarms.textContent =
                data.activeAlarms ?? 0;
        }

    } catch (error) {

        console.error(
            "Failed to load network page:",
            error
        );

        if (networkPageStatus) {
            networkPageStatus.textContent =
                "Error";
        }
    }
}

// ============================================================
// REFRESH BUTTONS
// ============================================================

if (refreshDevices) {

    refreshDevices.addEventListener(
        "click",
        async () => {

            await loadDevices();
            await loadAlarms();
            await loadNetworkStatus();
        }
    );
}

if (refreshDevicesPage) {

    refreshDevicesPage.addEventListener(
        "click",
        async () => {

            await loadDevicesPage();
        }
    );
}

if (refreshAlarmsPage) {

    refreshAlarmsPage.addEventListener(
        "click",
        async () => {

            await loadAlarmsPage();
        }
    );
}

if (refreshNetworkPage) {

    refreshNetworkPage.addEventListener(
        "click",
        async () => {

            await loadNetworkPage();
        }
    );
}

// ============================================================
// LOGOUT
// ============================================================

if (logoutBtn) {

    logoutBtn.addEventListener(
        "click",
        () => {

            localStorage.removeItem(
                "token"
            );

            localStorage.removeItem(
                "user"
            );

            authToken = null;
            currentUser = null;

            showLoginPage();
        }
    );
}

// ============================================================
// HTML SAFETY
// ============================================================

function escapeHTML(value) {

    if (value === null || value === undefined) {
        return "";
    }

    return String(value)
        .replaceAll("&", "&amp;")
        .replaceAll("<", "&lt;")
        .replaceAll(">", "&gt;")
        .replaceAll('"', "&quot;")
        .replaceAll("'", "&#039;");
}

// ============================================================
// AUTO LOGIN / SESSION CHECK
// ============================================================

if (authToken && currentUser) {

    showDashboard();

} else {

    showLoginPage();
}