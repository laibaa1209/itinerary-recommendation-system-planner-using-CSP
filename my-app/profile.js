const API_BASE = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("access_token") || null;
}

function decodeUserIdFromToken(token) {
  try {
    const base64Url = token.split(".")[1];
    const base64 = base64Url.replace(/-/g, "+").replace(/_/g, "/");
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split("")
        .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
        .join("")
    );
    const payload = JSON.parse(jsonPayload);
    return parseInt(payload.sub, 10);
  } catch {
    return null;
  }
}

// Check auth on page load
const token = getToken();
if (!token) {
  alert("Please sign in to view your profile.");
  window.location.href = "auth.html?mode=login";
}

const profileForm = document.querySelector(".pastel-card form");
const nameInput = document.getElementById("profile-name");
const emailInput = document.getElementById("profile-email");
const phoneInput = document.getElementById("profile-phone");
const errorEl = document.createElement("p");
errorEl.className = "error";
errorEl.id = "profile-error";

async function loadUserProfile() {
  try {
    const res = await fetch(`${API_BASE}/users/me`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (!res.ok) {
      if (res.status === 401) {
        alert("Session expired. Please sign in again.");
        window.location.href = "auth.html?mode=login";
        return;
      }
      throw new Error("Failed to load profile");
    }

    const user = await res.json();

    if (nameInput) {
      nameInput.value = `${user.first_name || ""} ${user.last_name || ""}`.trim() || "";
    }
    if (emailInput) {
      emailInput.value = user.email || "";
    }
    if (phoneInput) {
      phoneInput.value = user.contact_info || "";
    }
  } catch (err) {
    console.error("Failed to load profile:", err);
  }
}

if (profileForm) {
  profileForm.appendChild(errorEl);

  profileForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const nameParts = nameInput.value.trim().split(" ");
    const first_name = nameParts[0] || "";
    const last_name = nameParts.slice(1).join(" ") || "";

    try {
      const res = await fetch(`${API_BASE}/users/me`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          first_name,
          last_name,
          contact_info: phoneInput.value.trim() || null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to update profile");
      }

      errorEl.textContent = "Profile updated successfully!";
      errorEl.style.color = "#4a9e5a";
      setTimeout(() => {
        errorEl.textContent = "";
      }, 3000);
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}

loadUserProfile();

