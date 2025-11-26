// Shared auth utilities for all pages
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

function logout() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("current_itinerary");
  localStorage.removeItem("current_itinerary_id");
  window.location.href = "index.html";
}

// Add logout handlers to all logout links
document.addEventListener("DOMContentLoaded", () => {
  const logoutLinks = document.querySelectorAll('a[href="index.html"]');
  logoutLinks.forEach((link) => {
    if (link.textContent.trim().toLowerCase() === "logout") {
      link.addEventListener("click", (e) => {
        e.preventDefault();
        logout();
      });
    }
  });
});

