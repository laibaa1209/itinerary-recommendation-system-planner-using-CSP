// API_BASE and auth helpers are provided by auth-utils.js

const cardGrid = document.querySelector(".card-grid");
const pageSubtitle = document.querySelector(".page-subtitle");

async function loadItineraries() {
  const token = getToken();
  if (!token) {
    alert("Please sign in to view your itineraries.");
    window.location.href = "auth.html?mode=login";
    return;
  }

  try {
    const res = await fetch(`${API_BASE}/itineraries`, {
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
      throw new Error("Failed to load itineraries");
    }

    const itineraries = await res.json();

    if (pageSubtitle) {
      pageSubtitle.textContent = `You have ${itineraries.length} saved trip${itineraries.length !== 1 ? "s" : ""}.`;
    }

    if (cardGrid) {
      cardGrid.innerHTML = "";

      if (itineraries.length === 0) {
        const emptyCard = document.createElement("article");
        emptyCard.className = "pastel-card";
        emptyCard.innerHTML = `
          <h2 class="card-title">No itineraries yet</h2>
          <p class="card-meta">Create your first trip to get started!</p>
          <a href="itinerary-builder.html" class="primary-pill" style="display:inline-block;margin-top:1rem;text-decoration:none">Create Itinerary</a>
        `;
        cardGrid.appendChild(emptyCard);
        return;
      }

      itineraries.forEach((it) => {
        const card = document.createElement("article");
        card.className = "pastel-card";
        card.style.cursor = "pointer";
        card.onclick = () => {
          localStorage.setItem("current_itinerary", JSON.stringify(it));
          localStorage.setItem("current_itinerary_id", it.itinerary_id.toString());
          window.location.href = "itinerary-details.html";
        };

        const startDate = new Date(it.start_date).toLocaleDateString();
        const endDate = new Date(it.end_date).toLocaleDateString();

        card.innerHTML = `
          <h2 class="card-title">${it.title || "Untitled Trip"}</h2>
          <p class="card-meta">${startDate} – ${endDate}</p>
          ${it.total_budget ? `<span class="chip">Budget: PKR ${it.total_budget}</span>` : ""}
        `;

        cardGrid.appendChild(card);
      });
    }
  } catch (err) {
    if (pageSubtitle) {
      pageSubtitle.textContent = `Error: ${err.message}`;
    }
    console.error(err);
  }
}

loadItineraries();
