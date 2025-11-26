const API_BASE = "http://127.0.0.1:8000";

function getToken() {
  return localStorage.getItem("access_token") || null;
}

// Check auth on page load
const token = getToken();
if (!token) {
  alert("Please sign in to view itinerary details.");
  window.location.href = "auth.html?mode=login";
}

const currentItineraryId = parseInt(
  localStorage.getItem("current_itinerary_id") || "0",
  10
);

const titleEl = document.getElementById("detail-title");
const subtitleEl = document.getElementById("detail-subtitle");
const timelineEl = document.getElementById("detail-timeline");
const citiesListEl = document.querySelector(".section aside .pastel-card ul");

async function loadItineraryDetails() {
  if (!currentItineraryId) {
    if (titleEl) titleEl.textContent = "No itinerary selected";
    if (subtitleEl) subtitleEl.textContent = "Go to Dashboard to select an itinerary.";
    return;
  }

  const token = getToken();
  if (!token) return;

  try {
    // Fetch full itinerary with cities
    const res = await fetch(`${API_BASE}/itineraries/${currentItineraryId}`, {
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
      throw new Error("Failed to load itinerary");
    }

    const itinerary = await res.json();

    // Store for other scripts
    localStorage.setItem("current_itinerary", JSON.stringify(itinerary));
    localStorage.setItem("current_itinerary_id", itinerary.itinerary_id.toString());

    // Update title and subtitle
    if (titleEl) {
      titleEl.textContent = itinerary.title || "Your itinerary";
    }

    if (subtitleEl) {
      const parts = [];
      if (itinerary.start_date && itinerary.end_date) {
        const start = new Date(itinerary.start_date).toLocaleDateString();
        const end = new Date(itinerary.end_date).toLocaleDateString();
        parts.push(`${start} – ${end}`);
      }
      if (itinerary.total_budget) {
        parts.push(`Budget: PKR ${itinerary.total_budget}`);
      }
      subtitleEl.textContent = parts.join(" • ") || "Dates and budget will appear here.";
    }

    // Update cities list
    if (citiesListEl && itinerary.cities) {
      citiesListEl.innerHTML = "";
      if (itinerary.cities.length === 0) {
        citiesListEl.innerHTML = "<li>No cities added yet</li>";
      } else {
        itinerary.cities.forEach((city) => {
          const li = document.createElement("li");
          li.textContent = city.name;
          citiesListEl.appendChild(li);
        });
      }
    }

    // Load activities for timeline
    await loadActivities();
  } catch (err) {
    if (titleEl) titleEl.textContent = "Error loading itinerary";
    if (subtitleEl) subtitleEl.textContent = err.message;
    console.error(err);
  }
}

async function loadActivities() {
  if (!currentItineraryId || !timelineEl) return;
  const token = getToken();
  if (!token) return;

  try {
    const res = await fetch(
      `${API_BASE}/activities?itinerary_id=${currentItineraryId}`,
      {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }
    );

    if (!res.ok) return;

    const activities = await res.json();
    timelineEl.innerHTML = "";

    if (activities.length === 0) {
      timelineEl.innerHTML = `
        <div class="timeline-item">
          <div class="timeline-item-header">
            <span>No activities yet</span>
          </div>
          <p class="timeline-item-notes">Use the "Auto-plan this trip" button above to generate activities automatically.</p>
        </div>
      `;
      return;
    }

    // Group by day
    const byDay = {};
    activities.forEach((act) => {
      const day = act.day_no || 1;
      if (!byDay[day]) byDay[day] = [];
      byDay[day].push(act);
    });

    Object.keys(byDay)
      .sort((a, b) => parseInt(a) - parseInt(b))
      .forEach((day) => {
        byDay[day].forEach((act) => {
          const item = document.createElement("div");
          item.className = "timeline-item";
          const timeStr = act.start_time
            ? new Date(`2000-01-01T${act.start_time}`).toLocaleTimeString([], {
                hour: "2-digit",
                minute: "2-digit",
              })
            : "";
          item.innerHTML = `
            <div class="timeline-item-header">
              <span>Day ${day}</span>
              ${timeStr ? `<span>${timeStr}</span>` : ""}
            </div>
            <p class="timeline-item-notes">${act.notes || "No description"}</p>
          `;
          timelineEl.appendChild(item);
        });
      });
  } catch (err) {
    console.error("Failed to load activities:", err);
  }
}

// Auto-plan button handler
const autoPlanBtn = document.getElementById("auto-plan-btn");
const autoPlanError = document.getElementById("auto-plan-error");

if (autoPlanBtn) {
  autoPlanBtn.addEventListener("click", async () => {
    if (!currentItineraryId) {
      autoPlanError.textContent = "No itinerary selected.";
      return;
    }

    const token = getToken();
    if (!token) {
      autoPlanError.textContent = "Please sign in.";
      return;
    }

    autoPlanBtn.disabled = true;
    autoPlanBtn.textContent = "Planning...";
    autoPlanError.textContent = "";

    try {
      const res = await fetch(
        `${API_BASE}/itineraries/${currentItineraryId}/plan?daily_budget=8000&max_places_per_day=3`,
        {
          method: "POST",
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to plan itinerary");
      }

      const result = await res.json();
      autoPlanError.textContent = `Success! Created ${result.count || 0} activities.`;
      
      // Reload activities to show them
      await loadActivities();
      
      // Also reload place reviews since new activities may have places
      if (window.initPlaceReviewsForItinerary) {
        window.initPlaceReviewsForItinerary();
      }
    } catch (err) {
      autoPlanError.textContent = err.message;
    } finally {
      autoPlanBtn.disabled = false;
      autoPlanBtn.textContent = "Auto‑plan this trip";
    }
  });
}

loadItineraryDetails();



