// API_BASE, getToken, and decodeUserIdFromToken are provided by auth-utils.js

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

// Handle city selection to load activities
const citiesSelect = document.getElementById("cities-select");
const activitiesSection = document.getElementById("activities-section");
const activitiesList = document.getElementById("activities-list");
const categoryFilter = document.getElementById("activity-category-filter");

let currentPlaces = []; // Store fetched places

if (citiesSelect) {
  citiesSelect.addEventListener("change", async () => {
    const selectedCityIds = Array.from(citiesSelect.selectedOptions).map(opt => opt.value);

    if (selectedCityIds.length > 0) {
      activitiesSection.style.display = "block";
      activitiesList.innerHTML = '<p style="color:#8d656a; font-size:0.9rem;">Loading activities...</p>';

      try {
        // Fetch places for each selected city
        const allPlaces = [];
        for (const cityId of selectedCityIds) {
          const res = await fetch(`${API_BASE}/places?city_id=${cityId}`);
          if (res.ok) {
            const places = await res.json();
            allPlaces.push(...places);
          }
        }

        currentPlaces = allPlaces;
        filterAndRenderActivities();
      } catch (err) {
        console.error("Error loading places:", err);
        activitiesList.innerHTML = '<p class="error">Error loading activities.</p>';
      }
    } else {
      // Show default message
      activitiesSection.style.display = "block";
      activitiesList.innerHTML = `
        <p style="color:#8d656a; font-size:0.9rem; grid-column: 1/-1; text-align:center; padding:2rem;">
          Please select a city above to view available activities.
        </p>
      `;
      currentPlaces = [];
    }
  });
}

if (categoryFilter) {
  categoryFilter.addEventListener("change", () => {
    filterAndRenderActivities();
  });
}

function filterAndRenderActivities() {
  const category = categoryFilter ? categoryFilter.value : "all";
  let filtered = currentPlaces;

  if (category !== "all") {
    filtered = currentPlaces.filter(p => p.category === category);
  }

  renderActivities(filtered);
}

function renderActivities(places) {
  activitiesList.innerHTML = "";
  if (places.length === 0) {
    if (currentPlaces.length > 0) {
      activitiesList.innerHTML = "<p style='color:#8d656a; font-size:0.9rem;'>No activities found for selected category.</p>";
    } else {
      activitiesList.innerHTML = `
                <p style="color:#8d656a; font-size:0.9rem; grid-column: 1/-1; text-align:center; padding:2rem;">
                  Please select a city above to view available activities.
                </p>
              `;
    }
    return;
  }

  // Deduplicate places just in case
  const uniquePlaces = Array.from(new Map(places.map(item => [item.place_id, item])).values());

  uniquePlaces.forEach(place => {
    const div = document.createElement("div");
    div.style.display = "flex";
    div.style.alignItems = "center";
    div.style.gap = "0.5rem";
    div.style.padding = "0.2rem 0";

    const checkbox = document.createElement("input");
    checkbox.type = "checkbox";
    checkbox.value = place.place_id;
    checkbox.id = `place-${place.place_id}`;
    checkbox.style.width = "auto"; // Override default full width
    checkbox.style.margin = "0";

    const label = document.createElement("label");
    label.htmlFor = `place-${place.place_id}`;
    label.textContent = `${place.place_name} (${place.category || 'General'})`;
    label.style.fontSize = "0.9rem";
    label.style.cursor = "pointer";
    label.style.color = "#4e3034";
    label.style.fontWeight = "normal";
    label.style.textTransform = "none";
    label.style.marginBottom = "0";

    div.appendChild(checkbox);
    div.appendChild(label);
    activitiesList.appendChild(div);
  });
}

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

    // New fields
    const dailyStartTime = document.getElementById("daily-start-time").value;
    const maxPerDay = document.getElementById("max-per-day").value;

    // Get selected activities
    const selectedPlaceIds = Array.from(activitiesList.querySelectorAll("input[type='checkbox']:checked"))
      .map(cb => parseInt(cb.value));

    if (!start || !end) {
      errorEl.textContent = "Please provide both start and end dates.";
      return;
    }

    try {
      // 1. Create Itinerary
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

      // 2. Add cities
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
      }

      // 3. Plan with Custom Activities (CSP)
      if (selectedPlaceIds.length > 0) {
        const planRes = await fetch(`${API_BASE}/itineraries/${itinerary.itinerary_id}/plan-custom`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`
          },
          body: JSON.stringify({
            place_ids: selectedPlaceIds,
            daily_start_time: dailyStartTime,
            daily_budget: budget ? parseFloat(budget) : null,
            max_places_per_day: parseInt(maxPerDay)
          })
        });

        if (!planRes.ok) {
          console.warn("Failed to schedule activities");
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
