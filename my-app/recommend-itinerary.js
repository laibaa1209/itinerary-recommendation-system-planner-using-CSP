const API_BASE_REC = "http://127.0.0.1:8000";

async function loadTopCities() {
  const container = document.getElementById("top-cities");
  if (!container) return;

  try {
    const res = await fetch(
      `${API_BASE_REC}/itineraries/recommend/top-cities?limit=5`
    );
    if (!res.ok) throw new Error("Failed to load recommended cities");
    const cities = await res.json();

    if (!cities.length) {
      container.innerHTML =
        '<p class="card-meta">No city reviews yet. Recommendations will appear here once users start reviewing places.</p>';
      return;
    }

    const list = document.createElement("div");
    list.className = "card-grid";

    cities.forEach((city) => {
      const card = document.createElement("div");
      card.className = "pastel-card";
      card.innerHTML = `
        <h3 class="card-title">${city.name}</h3>
        <p class="card-meta">${city.province || ""}</p>
        <p class="card-meta">${city.description || "No description yet."}</p>
      `;
      list.appendChild(card);
    });

    container.innerHTML = "";
    container.appendChild(list);
  } catch (err) {
    container.innerHTML = `<p class="error">${err.message}</p>`;
  }
}

document.addEventListener("DOMContentLoaded", loadTopCities);


