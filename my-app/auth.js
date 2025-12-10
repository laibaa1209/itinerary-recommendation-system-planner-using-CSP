const API_BASE = "http://127.0.0.1:8000";

// Tab switching between login / register + heading text
const tabs = document.querySelectorAll(".tab");
const forms = {
  login: document.getElementById("login-form"),
  register: document.getElementById("register-form"),
};
const headingEl = document.querySelector(".auth-left h1");

function setHeading(tabKey) {
  if (!headingEl) return;
  headingEl.textContent = tabKey === "login" ? "Welcome Back!" : "Welcome!";
}

function activateTab(tabKey) {
  tabs.forEach((t) => {
    const isActive = t.dataset.tab === tabKey;
    t.classList.toggle("active", isActive);
  });
  Object.entries(forms).forEach(([key, form]) => {
    form.classList.toggle("active", key === tabKey);
  });
  setHeading(tabKey);
}

tabs.forEach((tab) => {
  tab.addEventListener("click", () => {
    const selected = tab.dataset.tab;
    activateTab(selected);
  });
});

// Start from query parameter: ?mode=signup or ?mode=login
const params = new URLSearchParams(window.location.search);
const mode = params.get("mode") === "signup" ? "register" : "login";
activateTab(mode);

// LOGIN
document.getElementById("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  const email = document.getElementById("login-email").value.trim();
  const password = document.getElementById("login-password").value;
  const errorEl = document.getElementById("login-error");
  errorEl.textContent = "";

  try {
    const body = new URLSearchParams();
    body.append("username", email);
    body.append("password", password);

    const res = await fetch(`${API_BASE}/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
    });

    if (!res.ok) {
      const data = await res.json().catch(() => ({}));
      throw new Error(data.detail || `Failed to sign in: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    localStorage.setItem("access_token", data.access_token);
    // After login go to dashboard
    window.location.href = "dashboard.html";
  } catch (err) {
    console.error("Login error:", err);
    const errorEl = document.getElementById("login-error");
    if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
      errorEl.textContent = "Cannot connect to server. Make sure the backend is running on http://127.0.0.1:8000";
    } else {
      errorEl.textContent = err.message;
    }
  }
});

// REGISTER
document
  .getElementById("register-form")
  .addEventListener("submit", async (e) => {
    e.preventDefault();

    const first_name = document.getElementById("first-name").value.trim();
    const last_name = document.getElementById("last-name").value.trim();
    const email = document.getElementById("register-email").value.trim();
    const contact_info = document.getElementById("contact-info").value.trim();
    const user_type = document.getElementById("user-type").value;
    const password = document.getElementById("register-password").value;
    const errorEl = document.getElementById("register-error");
    errorEl.textContent = "";

    if (!first_name || !last_name || !email || !password) {
      errorEl.textContent = "Please fill in all required fields";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          first_name,
          last_name,
          email,
          password,
          contact_info: contact_info || null,
          user_type: user_type,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || `Failed to register: ${res.status} ${res.statusText}`);
      }

      // After successful signup, switch to login tab
      activateTab("login");
      alert("Account created! Please sign in.");
    } catch (err) {
      console.error("Registration error:", err);
      if (err.message.includes("Failed to fetch") || err.message.includes("NetworkError")) {
        errorEl.textContent = "Cannot connect to server. Make sure the backend is running on http://127.0.0.1:8000";
      } else {
        errorEl.textContent = err.message;
      }
    }
  });


