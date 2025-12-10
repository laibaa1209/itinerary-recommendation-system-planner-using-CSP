// API_BASE and auth helpers are provided by auth-utils.js

const citySelect = document.getElementById("city-select");
const placeSelect = document.getElementById("place-select");
const starRating = document.getElementById("star-rating");
const ratingValue = document.getElementById("rating-value");
const reviewForm = document.getElementById("review-form");
const reviewError = document.getElementById("review-error");
const reviewSuccess = document.getElementById("review-success");
const userReviewsList = document.getElementById("user-reviews-list");

let selectedRating = 0;

// Load cities
async function loadCities() {
    const token = getToken();
    if (!token) {
        window.location.href = "auth.html?mode=login";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/cities`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load cities");

        const cities = await res.json();
        citySelect.innerHTML = '<option value="">-- Select a city --</option>';

        cities.forEach((city) => {
            const option = document.createElement("option");
            option.value = city.city_id;
            option.textContent = city.name;
            citySelect.appendChild(option);
        });
    } catch (err) {
        console.error(err);
        citySelect.innerHTML = '<option value="">Error loading cities</option>';
    }
}

// Load places for selected city
citySelect.addEventListener("change", async () => {
    const cityId = citySelect.value;
    placeSelect.innerHTML = '<option value="">-- Select a place (optional) --</option>';

    if (!cityId) return;

    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/places?city_id=${cityId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load places");

        const places = await res.json();
        places.forEach((place) => {
            const option = document.createElement("option");
            option.value = place.place_id;
            option.textContent = place.place_name;
            placeSelect.appendChild(option);
        });
    } catch (err) {
        console.error(err);
    }
});

// Star rating interaction
const stars = document.querySelectorAll(".star");
stars.forEach((star) => {
    star.addEventListener("click", () => {
        selectedRating = parseInt(star.dataset.rating);
        ratingValue.value = selectedRating;
        updateStars();
    });

    star.addEventListener("mouseenter", () => {
        const hoverRating = parseInt(star.dataset.rating);
        stars.forEach((s, idx) => {
            s.textContent = idx < hoverRating ? "★" : "☆";
            s.style.color = idx < hoverRating ? "#f4a261" : "#ccc";
        });
    });
});

starRating.addEventListener("mouseleave", updateStars);

function updateStars() {
    stars.forEach((s, idx) => {
        s.textContent = idx < selectedRating ? "★" : "☆";
        s.style.color = idx < selectedRating ? "#f4a261" : "#ccc";
    });
}

// Submit review
reviewForm.addEventListener("submit", async (e) => {
    e.preventDefault();
    reviewError.textContent = "";
    reviewSuccess.style.display = "none";

    const token = getToken();
    if (!token) {
        reviewError.textContent = "Please sign in.";
        return;
    }

    const userId = decodeUserIdFromToken(token);
    const placeId = placeSelect.value;
    const rating = parseInt(ratingValue.value);
    const reviewText = document.getElementById("review-text").value.trim();

    if (!rating) {
        reviewError.textContent = "Please select a rating.";
        return;
    }

    if (!placeId) {
        reviewError.textContent = "Please select a place to review.";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/reviews`, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${token}`,
            },
            body: JSON.stringify({
                user_id: userId,
                place_id: parseInt(placeId),
                rating: rating,
                review_text: reviewText || null,
            }),
        });

        if (!res.ok) throw new Error("Failed to submit review");

        reviewSuccess.textContent = "Review submitted successfully!";
        reviewSuccess.style.display = "block";

        // Reset form
        reviewForm.reset();
        selectedRating = 0;
        updateStars();
        placeSelect.innerHTML = '<option value="">Select a city first...</option>';

        // Reload user reviews
        loadUserReviews();
    } catch (err) {
        console.error(err);
        reviewError.textContent = err.message;
    }
});

// Load user's reviews
async function loadUserReviews() {
    const token = getToken();
    if (!token) return;

    const userId = decodeUserIdFromToken(token);

    try {
        const res = await fetch(`${API_BASE}/reviews?user_id=${userId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load reviews");

        const reviews = await res.json();
        userReviewsList.innerHTML = "";

        if (reviews.length === 0) {
            userReviewsList.innerHTML = '<li style="color:#888;font-style:italic;">You haven\'t submitted any reviews yet.</li>';
            return;
        }

        reviews.slice(0, 5).forEach((review) => {
            const li = document.createElement("li");
            const stars = "★".repeat(review.rating) + "☆".repeat(5 - review.rating);
            li.innerHTML = `
        <div style="display:flex;flex-direction:column;gap:0.3rem;width:100%">
          <div style="display:flex;justify-content:space-between;align-items:center;">
            <span style="font-weight:600;color:#4a3437;">${review.place?.place_name || "Unknown Place"}</span>
            <span style="color:#f4a261;font-size:1.1rem;">${stars}</span>
          </div>
          ${review.review_text ? `<p style="font-size:0.85rem;color:#666;margin:0;">${review.review_text}</p>` : ""}
        </div>
      `;
            userReviewsList.appendChild(li);
        });
    } catch (err) {
        console.error(err);
        userReviewsList.innerHTML = '<li style="color:#d32f2f;">Failed to load reviews.</li>';
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    loadCities();
    loadUserReviews();
});
