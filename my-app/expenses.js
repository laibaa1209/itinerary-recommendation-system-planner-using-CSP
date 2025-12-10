// API_BASE and auth helpers are provided by auth-utils.js

const currentItineraryId = parseInt(
    localStorage.getItem("current_itinerary_id") || "0",
    10
);

const totalBudgetEl = document.getElementById("total-budget");
const remainingBudgetEl = document.getElementById("remaining-budget");
const activityCostEl = document.getElementById("activity-cost");
const manualCostEl = document.getElementById("manual-cost");
const expenseListEl = document.getElementById("expense-list");
const expenseErrorEl = document.getElementById("expense-error");
const expenseForm = document.getElementById("expense-form");
const subtitleEl = document.getElementById("expense-subtitle");

async function loadExpensesPage() {
    if (!currentItineraryId) {
        if (subtitleEl) subtitleEl.textContent = "No itinerary selected. Go to Dashboard.";
        return;
    }

    const token = getToken();
    if (!token) {
        window.location.href = "auth.html?mode=login";
        return;
    }

    try {
        // 1. Fetch Itinerary for Total Budget
        const itiRes = await fetch(`${API_BASE}/itineraries/${currentItineraryId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!itiRes.ok) throw new Error("Failed to load itinerary");
        const itinerary = await itiRes.json();
        const totalBudget = itinerary.total_budget || 0;

        // 2. Fetch Activities for Estimated Cost
        const actRes = await fetch(`${API_BASE}/activities?itinerary_id=${currentItineraryId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!actRes.ok) throw new Error("Failed to load activities");
        const activities = await actRes.json();

        // Calculate total activity cost and create detailed list
        let activityCost = 0;
        const activityCostDetails = [];

        activities.forEach((act) => {
            const cost = act.estimated_cost || 0;
            activityCost += cost;
            if (cost > 0) {
                activityCostDetails.push({
                    name: act.notes || `Activity on Day ${act.day_no}`,
                    cost: cost,
                    day: act.day_no
                });
            }
        });

        // 3. Fetch Manual Expenses
        const expRes = await fetch(`${API_BASE}/expenses?itinerary_id=${currentItineraryId}`, {
            headers: { Authorization: `Bearer ${token}` },
        });
        if (!expRes.ok) throw new Error("Failed to load expenses");
        const expenses = await expRes.json();
        let manualCost = 0;

        // Render Activity Cost List
        const activityCostListEl = document.getElementById("activity-cost-list");
        if (activityCostListEl) {
            activityCostListEl.innerHTML = "";
            if (activityCostDetails.length === 0) {
                activityCostListEl.innerHTML = '<li style="color:#888;font-style:italic;">No planned activities with costs yet.</li>';
            } else {
                activityCostDetails.forEach((item) => {
                    const li = document.createElement("li");
                    li.innerHTML = `
            <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
              <div>
                <span style="font-weight:600;color:#4a3437">${item.name}</span>
                <br>
                <span style="font-size:0.85rem;color:#666">Day ${item.day}</span>
              </div>
              <span style="font-weight:bold;color:#7a9b76">PKR ${item.cost.toFixed(0)}</span>
            </div>
          `;
                    activityCostListEl.appendChild(li);
                });
            }
        }

        // Render Manual Expense List
        expenseListEl.innerHTML = "";
        if (expenses.length === 0) {
            expenseListEl.innerHTML = '<li style="color:#888;font-style:italic;">No manual expenses added yet.</li>';
        } else {
            expenses.forEach((exp) => {
                manualCost += exp.amount;
                const li = document.createElement("li");
                li.innerHTML = `
          <div style="display:flex;justify-content:space-between;align-items:center;width:100%">
            <div>
              <span style="font-weight:600;color:#4a3437">${exp.category || "General"}</span>
              <br>
              <span style="font-size:0.85rem;color:#666">${exp.description || ""}</span>
            </div>
            <span style="font-weight:bold;color:#b0606a">PKR ${exp.amount}</span>
          </div>
        `;
                expenseListEl.appendChild(li);
            });
        }

        // 4. Calculate and Update UI
        const totalSpent = activityCost + manualCost;
        const remaining = totalBudget - totalSpent;

        totalBudgetEl.textContent = `PKR ${totalBudget}`;
        activityCostEl.textContent = `PKR ${activityCost.toFixed(0)}`;
        manualCostEl.textContent = `PKR ${manualCost.toFixed(0)}`;

        remainingBudgetEl.textContent = `PKR ${remaining.toFixed(0)}`;
        remainingBudgetEl.style.color = remaining < 0 ? "#d32f2f" : "#4a3437";

        if (subtitleEl) {
            subtitleEl.textContent = `Managing budget for: ${itinerary.title || "Untitled Trip"}`;
        }

    } catch (err) {
        console.error(err);
        if (expenseErrorEl) expenseErrorEl.textContent = err.message;
    }
}

// Handle Add Expense
if (expenseForm) {
    expenseForm.addEventListener("submit", async (e) => {
        e.preventDefault();
        expenseErrorEl.textContent = "";
        const token = getToken();
        if (!token) return;

        const amount = parseFloat(document.getElementById("expense-amount").value || "0");
        const category = document.getElementById("expense-category").value.trim();
        const description = document.getElementById("expense-description").value.trim();

        try {
            const res = await fetch(`${API_BASE}/expenses`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                    itinerary_id: currentItineraryId,
                    amount,
                    category: category || null,
                    description: description || null,
                }),
            });

            if (!res.ok) throw new Error("Failed to add expense");

            expenseForm.reset();
            loadExpensesPage();
        } catch (err) {
            expenseErrorEl.textContent = err.message;
        }
    });
}

// Initial Load
document.addEventListener("DOMContentLoaded", loadExpensesPage);
