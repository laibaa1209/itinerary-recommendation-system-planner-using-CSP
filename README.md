# Itinerary Planner Project

## Overview
The **Itinerary Planner** is a full-stack web application designed to help travelers plan and manage their trips efficiently. It allows users to:  

- Create personalized itineraries based on cities, interests, and available days  
- Track expenses and budget for trips  
- Explore recommended places and activities  
- Write reviews and manage profiles  

The project consists of a **frontend** (HTML, CSS, JS) and a **backend** (Python FastAPI), connected to a database for storing user data, itineraries, expenses, and reviews.

---

## Features

### 1. Home / Main Page
The home page provides an overview of the platform and quick access to core features such as itinerary creation, expense tracking, and recommendations.  

![Home Page](https://github.com/user-attachments/assets/12c71eb4-89aa-4bbd-ab0b-9cdb74fadc82)

---

### 2. Authentication
Users can **sign in** or **sign up** to access the platform.  

- **Sign In Page**: Allows existing users to log in with their credentials.  
![Sign In](https://github.com/user-attachments/assets/bb52e7d6-61b1-4032-b8b8-7a8af516d479)  

- **Sign Up Page**: New users can register with their full details, including first name, last name, email, contact info, password, and user type (traveller, tourist, habitant).  
![Sign Up](https://github.com/user-attachments/assets/1a41d4eb-4cf4-4e0f-9b91-fffebe1f3dee)  

- **Traveler Type Editing**: Users can update their profile to reflect their traveler type and preferences.  
![Edit Traveler Type](https://github.com/user-attachments/assets/36d0fc46-d7c2-49c8-9870-68c7daf50f1b)

---

### 3. Itinerary Builder
The **itinerary builder** allows users to create detailed travel plans based on selected cities, dates, and interests.  

- Users select the city, trip dates, number of activities per day, and start time.  
- The app then displays a list of possible activities in each city.  

![Build Itinerary](https://github.com/user-attachments/assets/2363563d-2e21-4e4c-be5c-a66de3f9b14c)
![Select City & Activities](https://github.com/user-attachments/assets/e27d961c-85c2-46c4-bd7a-0a2829ac4151)

- Activities can also be filtered based on **categories**.  

![Activity Categories](https://github.com/user-attachments/assets/c6b8acec-a5da-4162-924d-e1790bd167ad)  
![Filtered Activities](https://github.com/user-attachments/assets/cefd8156-5190-4839-b8da-ed087d77b790)

- Users select activities via checkboxes and set the **budget** before creating the itinerary.  

![Select Activities & Budget](https://github.com/user-attachments/assets/84d474b9-444e-4162-b99f-b9b386f094bd)

- All created itineraries are displayed in a dashboard for easy management.  

![Itineraries Dashboard](https://github.com/user-attachments/assets/a42f303e-69e6-4259-86a9-52a652b225fe)

- Users can **view generated itineraries**, auto-plan remaining days based on preferences, and manage budgets and expenses.  

![View & Auto-Plan Itinerary](https://github.com/user-attachments/assets/9624a73c-fb85-45cf-9a04-6f2d2255a900)

---

### 4. Expense Tracking
The **budget page** helps users track all expenses for their trip:  

- Add manual expenses (e.g., renting a car, food, entertainment)  
- All expenses are automatically updated in the database  
- Users can see real-time calculations of remaining budget  

![Budget Page](https://github.com/user-attachments/assets/8c40f158-e513-4477-86a1-dc78b6c5b823)  
![Adding Manual Expense](https://github.com/user-attachments/assets/ec20b03d-76b4-4989-bdba-484c28bcf713)  
![Updated Budget View](https://github.com/user-attachments/assets/b3ff6b56-cc80-4b10-9145-dc45e305218f)

---

### 5. Recommendations
The **recommendations page** provides personalized suggestions based on:  

- Whether the user is new or returning  
- User interests  
- Ratings and popularity of cities  

![Recommendations Page](https://github.com/user-attachments/assets/ba150c89-f9ae-4372-b49a-e982ae693576)  
![Top Recommended Places](https://github.com/user-attachments/assets/b53c78cc-f099-4eca-b94b-37fe79dd5eae)

---

### 6. Reviews
Users can write and view **reviews** for each city to share experiences and ratings with others.  

![Reviews Page](https://github.com/user-attachments/assets/f9d00136-8be8-40a1-b31b-387f3c62a6f2)  
![Add Reviews](https://github.com/user-attachments/assets/a6ce7de1-4a19-4268-a50b-60f253fbbe0e)

---

### 7. User Profile
Users have a **profile page** where they can:  

- View personal details  
- Upload pictures of their trip  
- Access all itineraries and budget/expense history  

![User Profile](https://github.com/user-attachments/assets/a1c6986b-8933-4fb0-bd3c-20fb8e4c102e)

---

### 8. Final Notes
The Itinerary Planner is a **comprehensive travel management platform** combining itinerary creation, budget tracking, recommendations, and reviews. Its **interactive UI** and **backend integration** ensure a smooth experience for travelers of all types.

![Final Screenshot](https://github.com/user-attachments/assets/f2c3aa0b-765e-46c4-a52c-190bd16e7a39)

---

### Technologies Used
- **Frontend**: HTML, CSS, JavaScript  
- **Backend**: Python (FastAPI)  
- **Database**: PostgreSQL / MongoDB  
- **Libraries/Utilities**: Axios (API calls), auth-utils.js (authentication), CORS configuration

---

### How to Run
1. Clone the repository  
2. Install backend dependencies:  
   ```bash
   pip install -r requirements.txt


