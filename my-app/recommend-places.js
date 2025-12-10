// API_BASE and auth helpers are provided by auth-utils.js

const newUserBtn = document.getElementById("new-user-btn");
const existingUserBtn = document.getElementById("existing-user-btn");
const userTypeInput = document.getElementById("user-type");
const categoriesContainer = document.getElementById("categories-container");
const categoriesError = document.getElementById("categories-error");
const recommendationForm = document.getElementById("recommendation-form");
const recommendationError = document.getElementById("recommendation-error");
const recommendationsSection = document.getElementById("recommendations-section");
const recommendationsContainer = document.getElementById("recommendations-container");
const topCitiesContainer = document.getElementById("top-cities");

let selectedCategories = new Set();

// Handle user type selection
if (newUserBtn && existingUserBtn) {
    newUserBtn.addEventListener("click", () => {
        userTypeInput.value = "new";
        newUserBtn.classList.remove("secondary");
        existingUserBtn.classList.add("secondary");
    });

    existingUserBtn.addEventListener("click", () => {
        userTypeInput.value = "existing";
        existingUserBtn.classList.remove("secondary");
        newUserBtn.classList.add("secondary");
    });
}

// Load categories
async function loadCategories() {
    const token = getToken();
    if (!token) {
        categoriesError.textContent = "Please sign in to see recommendations.";
        return;
    }

    try {
        const res = await fetch(`${API_BASE}/recommendations/categories`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load categories");

        const categories = await res.json();
        categoriesContainer.innerHTML = "";

        if (categories.length === 0) {
            categoriesContainer.innerHTML = '<p style="color:#888;">No categories available.</p>';
            return;
        }

        categories.forEach((cat) => {
            const label = document.createElement("label");
            label.style.cssText = "display:flex;align-items:center;gap:0.5rem;cursor:pointer;padding:0.5rem;border-radius:0.5rem;background:rgba(232,180,184,0.15);transition:all 0.2s;";

            const checkbox = document.createElement("input");
            checkbox.type = "checkbox";
            checkbox.value = cat.category;
            checkbox.style.cursor = "pointer";

            checkbox.addEventListener("change", (e) => {
                if (e.target.checked) {
                    selectedCategories.add(cat.category);
                    label.style.background = "rgba(232,180,184,0.4)";
                } else {
                    selectedCategories.delete(cat.category);
                    label.style.background = "rgba(232,180,184,0.15)";
                }
            });

            const span = document.createElement("span");
            span.textContent = cat.category;
            span.style.cssText = "font-weight:500;color:#4a3437;";

            label.appendChild(checkbox);
            label.appendChild(span);
            categoriesContainer.appendChild(label);
        });
    } catch (err) {
        console.error(err);
        categoriesError.textContent = err.message;
    }
}

// Handle form submission
if (recommendationForm) {
    recommendationForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        recommendationError.textContent = "";

        if (selectedCategories.size === 0) {
            recommendationError.textContent = "Please select at least one category.";
            return;
        }

        const token = getToken();
        if (!token) {
            recommendationError.textContent = "Please sign in.";
            return;
        }

        const userType = userTypeInput.value;

        try {
            const res = await fetch(`${API_BASE}/recommendations/places`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    categories: Array.from(selectedCategories),
                    user_type: userType,
                    limit: 20,
                }),
            });

            if (!res.ok) throw new Error("Failed to get recommendations");

            const recommendations = await res.json();
            displayRecommendations(recommendations);
        } catch (err) {
            console.error(err);
            recommendationError.textContent = err.message;
        }
    });
}

// Display recommendations
function displayRecommendations(recommendations) {
    recommendationsContainer.innerHTML = "";
    recommendationsSection.style.display = "block";

    const categories = Object.keys(recommendations);
    if (categories.length === 0) {
        recommendationsContainer.innerHTML = '<p class="card-meta">No recommendations found. Try selecting different categories.</p>';
        return;
    }

    categories.forEach((category) => {
        const categorySection = document.createElement("div");
        categorySection.style.marginBottom = "2rem";

        const categoryTitle = document.createElement("h3");
        categoryTitle.className = "section-title";
        categoryTitle.textContent = category;
        categoryTitle.style.color = "#b0606a";
        categorySection.appendChild(categoryTitle);

        const placesGrid = document.createElement("div");
        placesGrid.className = "card-grid";
        placesGrid.style.gridTemplateColumns = "repeat(auto-fill, minmax(280px, 1fr))";

        recommendations[category].forEach((place) => {
            const card = document.createElement("article");
            card.className = "pastel-card";
            card.innerHTML = `
        <h2 class="card-title">${place.place_name}</h2>
        <p class="card-meta">${place.city_name || "Unknown City"}</p>
        ${place.description ? `<p style="font-size:0.9rem;color:#666;margin-top:0.5rem;">${place.description}</p>` : ""}
        ${place.duration ? `<span class="chip" style="margin-top:0.8rem;">Duration: ${place.duration} hours</span>` : ""}
      `;
            placesGrid.appendChild(card);
        });

        categorySection.appendChild(placesGrid);
        recommendationsContainer.appendChild(categorySection);
    });
}

// Load top-rated cities
async function loadTopCities() {
    const token = getToken();
    if (!token) return;

    try {
        const res = await fetch(`${API_BASE}/recommendations/top-cities?limit=10`, {
            headers: { Authorization: `Bearer ${token}` },
        });

        if (!res.ok) throw new Error("Failed to load top cities");

        const cities = await res.json();
        topCitiesContainer.innerHTML = "";

        if (cities.length === 0) {
            topCitiesContainer.innerHTML = '<p class="card-meta">No cities with ratings available yet.</p>';
            return;
        }

        cities.forEach((city) => {
            const card = document.createElement("article");
            card.className = "pastel-card";
            card.innerHTML = `
        <h2 class="card-title">${city.name}</h2>
        <div style="display:flex;align-items:center;gap:0.5rem;margin-top:0.5rem;">
          <span style="font-size:1.5rem;font-weight:bold;color:#f4a261;">★ ${city.avg_rating}</span>
          <span class="card-meta">(${city.review_count} reviews)</span>
        </div>
      `;
            topCitiesContainer.appendChild(card);
        });
    } catch (err) {
        console.error(err);
        topCitiesContainer.innerHTML = '<p class="error">Failed to load top cities.</p>';
    }
}

// Initialize
document.addEventListener("DOMContentLoaded", () => {
    loadCategories();
    loadTopCities();
});
