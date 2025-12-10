// API_BASE and auth helpers are provided by auth-utils.js

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

// Expense logic has been moved to expenses.js

// We store current itinerary id in localStorage (set this when you wire builder to backend)
const currentItineraryId = parseInt(
  localStorage.getItem("current_itinerary_id") || "0",
  10
);

// -------- Reviews per place, grouped by itinerary activities --------

const placesReviewsContainer = document.getElementById("places-reviews");

async function fetchActivitiesForItinerary() {
  if (!currentItineraryId || !placesReviewsContainer) return [];
  const token = getToken();
  if (!token) {
    placesReviewsContainer.innerHTML =
      '<p class="card-meta">Sign in to see and write place reviews.</p>';
    return [];
  }
  const res = await fetch(
    `${API_BASE}/activities?itinerary_id=${currentItineraryId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );
  if (!res.ok) return [];
  return res.json();
}

async function fetchPlace(placeId) {
  const res = await fetch(`${API_BASE}/places/${placeId}`);
  if (!res.ok) return null;
  return res.json();
}

async function fetchReviews(placeId) {
  const token = getToken();
  if (!token) return [];
  const res = await fetch(`${API_BASE}/reviews?place_id=${placeId}`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) return [];
  return res.json();
}

function renderPlaceBlock(place, reviews) {
  const wrapper = document.createElement("div");
  wrapper.className = "section";

  const title = document.createElement("h3");
  title.className = "section-title";
  title.textContent = place.place_name;
  wrapper.appendChild(title);

  const meta = document.createElement("p");
  meta.className = "card-meta";
  meta.textContent = place.description || "No description provided yet.";
  wrapper.appendChild(meta);

  const list = document.createElement("div");
  list.className = "timeline";

  if (!reviews.length) {
    const p = document.createElement("p");
    p.className = "card-meta";
    p.textContent = "No reviews yet. Be the first to share your experience.";
    list.appendChild(p);
  } else {
    reviews.forEach((r) => {
      const div = document.createElement("div");
      div.className = "timeline-item";
      const header = document.createElement("div");
      header.className = "timeline-item-header";
      header.innerHTML = `<span>${"★".repeat(
        r.rating
      )}</span><span>${r.review_date || ""}</span>`;
      const notes = document.createElement("p");
      notes.className = "timeline-item-notes";
      notes.textContent = r.rating_comment || "";
      div.appendChild(header);
      div.appendChild(notes);
      list.appendChild(div);
    });
  }

  wrapper.appendChild(list);

  // per-place review form
  const form = document.createElement("form");
  form.className = "form active";
  form.innerHTML = `
    <div class="inline-form-row">
      <div class="field">
        <label>Rating</label>
        <select class="place-review-rating">
          <option value="5">5 – Amazing</option>
          <option value="4">4 – Great</option>
          <option value="3">3 – Okay</option>
          <option value="2">2 – Meh</option>
          <option value="1">1 – Avoid</option>
        </select>
      </div>
    </div>
    <div class="field">
      <label>Your review</label>
      <input class="place-review-comment" type="text" placeholder="What did you like or dislike?" required />
    </div>
    <button type="submit" class="primary-pill full-width">Submit review</button>
    <p class="error place-review-error"></p>
  `;

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    const token = getToken();
    const errorEl = form.querySelector(".place-review-error");
    errorEl.textContent = "";
    if (!token) {
      errorEl.textContent = "Please sign in to write a review.";
      return;
    }
    const userId = decodeUserIdFromToken(token);
    const rating = parseInt(
      form.querySelector(".place-review-rating").value || "5",
      10
    );
    const rating_comment = form
      .querySelector(".place-review-comment")
      .value.trim();
    try {
      const res = await fetch(`${API_BASE}/reviews`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          user_id: userId,
          place_id: place.place_id,
          rating,
          rating_comment,
        }),
      });
      if (!res.ok) throw new Error("Failed to submit review");
      form.reset();
      const updated = await fetchReviews(place.place_id);
      // re-render only this place block's reviews
      list.innerHTML = "";
      updated.forEach((r) => {
        const div = document.createElement("div");
        div.className = "timeline-item";
        const header = document.createElement("div");
        header.className = "timeline-item-header";
        header.innerHTML = `<span>${"★".repeat(
          r.rating
        )}</span><span>${r.review_date || ""}</span>`;
        const notes = document.createElement("p");
        notes.className = "timeline-item-notes";
        notes.textContent = r.rating_comment || "";
        div.appendChild(header);
        div.appendChild(notes);
        list.appendChild(div);
      });
    } catch (err) {
      errorEl.textContent = err.message;
    }
  });

  wrapper.appendChild(form);

  placesReviewsContainer.appendChild(wrapper);
}

async function initPlaceReviewsForItinerary() {
  if (!placesReviewsContainer || !currentItineraryId) return;
  const token = getToken();
  if (!token) {
    placesReviewsContainer.innerHTML =
      '<p class="card-meta">Sign in to see and write place reviews.</p>';
    return;
  }

  const activities = await fetchActivitiesForItinerary();
  const placeIds = Array.from(
    new Set(
      activities
        .map((a) => a.place_id)
        .filter((id) => id !== null && id !== undefined)
    )
  );

  if (!placeIds.length) {
    placesReviewsContainer.innerHTML =
      '<p class="card-meta">No places linked to this itinerary yet.</p>';
    return;
  }

  placesReviewsContainer.innerHTML = "";
  for (const pid of placeIds) {
    const place = await fetchPlace(pid);
    if (!place) continue;
    const reviews = await fetchReviews(pid);
    renderPlaceBlock(place, reviews);
  }
}

initPlaceReviewsForItinerary();

// -------- Auto-plan button (CSP planner) --------

const autoPlanBtn = document.getElementById("auto-plan-btn");
const autoPlanError = document.getElementById("auto-plan-error");

if (autoPlanBtn && currentItineraryId) {
  autoPlanBtn.addEventListener("click", async () => {
    autoPlanError.textContent = "";
    const token = getToken();
    if (!token) {
      autoPlanError.textContent = "Please sign in to auto‑plan this trip.";
      return;
    }
    try {
      const res = await fetch(
        `${API_BASE}/itineraries/${currentItineraryId}/plan?max_places_per_day=3`,
        {
          method: "POST",
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.detail || "Failed to auto‑plan itinerary");
      }
      // After planning, refresh activities-based reviews and expenses if needed
      initPlaceReviewsForItinerary();
      alert("Itinerary planned using CSP planner. Activities will show once wired to timeline.");
    } catch (err) {
      autoPlanError.textContent = err.message;
    }
  });
}


