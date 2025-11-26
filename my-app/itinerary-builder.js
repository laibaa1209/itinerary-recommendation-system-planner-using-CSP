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
  alert("Please sign in to create an itinerary.");
  window.location.href = "auth.html?mode=login";
}

// Load cities on page load
async function loadCities() {
  try {
    const res = await fetch(`${API_BASE}/cities`);
    if (!res.ok) return;
    const cities = await res.json();
    const select = document.getElementById("cities-select");
    if (select) {
      select.innerHTML = "";
      cities.forEach((city) => {
        const option = document.createElement("option");
        option.value = city.city_id;
        option.textContent = city.name;
        select.appendChild(option);
      });
    }
  } catch (err) {
    console.error("Failed to load cities:", err);
  }
}

loadCities();

const builderForm = document.getElementById("builder-form");
const errorEl = document.createElement("p");
errorEl.className = "error";
errorEl.id = "builder-error";
if (builderForm) {
  builderForm.appendChild(errorEl);

  builderForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    errorEl.textContent = "";

    const token = getToken();
    if (!token) {
      errorEl.textContent = "Please sign in to create an itinerary.";
      window.location.href = "auth.html?mode=login";
      return;
    }

    const userId = decodeUserIdFromToken(token);
    if (!userId) {
      errorEl.textContent = "Invalid session. Please sign in again.";
      return;
    }

    const title = document.getElementById("trip-title").value.trim();
    const start = document.getElementById("start-date").value;
    const end = document.getElementById("end-date").value;
    const budget = document.getElementById("budget").value;
    const citiesSelect = document.getElementById("cities-select");
    const selectedCityIds = Array.from(citiesSelect.selectedOptions).map(
      (opt) => parseInt(opt.value, 10)
    );

    if (!start || !end) {
      errorEl.textContent = "Please provide both start and end dates.";
      return;
    }

    try {
      const res = await fetch(`${API_BASE}/itineraries`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          title: title || "My Trip",
          start_date: start,
          end_date: end,
          total_budget: budget ? parseFloat(budget) : null,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to create itinerary");
      }

      const itinerary = await res.json();

      // Add cities if any selected
      if (selectedCityIds.length > 0) {
        for (const cityId of selectedCityIds) {
          try {
            await fetch(
              `${API_BASE}/itineraries/${itinerary.itinerary_id}/cities/${cityId}`,
              {
                method: "POST",
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              }
            );
          } catch (err) {
            console.warn(`Failed to add city ${cityId}:`, err);
          }
        }
        // Reload itinerary to get cities
        const updatedRes = await fetch(
          `${API_BASE}/itineraries/${itinerary.itinerary_id}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (updatedRes.ok) {
          const updated = await updatedRes.json();
          itinerary.cities = updated.cities;
        }
      }

      // Store the real backend data
      localStorage.setItem("current_itinerary", JSON.stringify(itinerary));
      localStorage.setItem("current_itinerary_id", itinerary.itinerary_id.toString());

      // Redirect to details page
      window.location.href = "itinerary-details.html";
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });
}


