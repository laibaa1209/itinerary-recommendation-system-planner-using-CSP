// Landing page buttons -> route to auth / recommend pages
const existingBtn = document.getElementById("btn-existing");
const newBtn = document.getElementById("btn-new");
const guestRecommendBtn = document.getElementById("btn-recommend-guest");

if (existingBtn) {
  existingBtn.addEventListener("click", () => {
    window.location.href = "auth.html?mode=login";
  });
}

if (newBtn) {
  newBtn.addEventListener("click", () => {
    window.location.href = "auth.html?mode=signup";
  });
}

if (guestRecommendBtn) {
  guestRecommendBtn.addEventListener("click", () => {
    window.location.href = "recommend-places.html";
  });
}


