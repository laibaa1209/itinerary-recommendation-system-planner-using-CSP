-- Database Schema for Itinerary Planner

-- ==========================================
-- 1. Core Tables
-- ==========================================

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    user_id SERIAL PRIMARY KEY,
    first_name VARCHAR(128),
    last_name VARCHAR(128),
    email VARCHAR(256) UNIQUE NOT NULL,
    password_hash VARCHAR(256) NOT NULL,
    contact_info TEXT,
    user_type VARCHAR(50) DEFAULT 'traveler',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Cities Table
CREATE TABLE IF NOT EXISTS cities (
    city_id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    province VARCHAR(255),
    country VARCHAR(100) DEFAULT 'Pakistan',
    latitude DECIMAL(9,6),
    longitude DECIMAL(9,6)
);

-- Itineraries Table
CREATE TABLE IF NOT EXISTS itineraries (
    itinerary_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    start_date DATE NOT NULL,
    end_date DATE NOT NULL,
    total_budget NUMERIC(12, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'draft', -- draft, planned, completed
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT check_dates CHECK (end_date >= start_date)
);

-- Itinerary Cities (Many-to-Many)
CREATE TABLE IF NOT EXISTS itinerary_cities (
    itinerary_id INTEGER REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
    city_id INTEGER REFERENCES cities(city_id) ON DELETE CASCADE,
    visit_order INTEGER,
    PRIMARY KEY (itinerary_id, city_id)
);

-- Places Table
CREATE TABLE IF NOT EXISTS places (
    place_id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(city_id) ON DELETE SET NULL,
    place_name VARCHAR(255) NOT NULL,
    description TEXT,
    category VARCHAR(100), -- e.g., Historical, Nature, Food
    location JSON, -- Stores lat/long or address details
    duration NUMERIC(4, 2) DEFAULT 2.0, -- Recommended duration in hours
    opening_hours VARCHAR(255),
    entry_fee NUMERIC(10, 2) DEFAULT 0.00,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Activities Table
CREATE TABLE IF NOT EXISTS activities (
    activity_id SERIAL PRIMARY KEY,
    itinerary_id INTEGER REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
    place_id INTEGER REFERENCES places(place_id) ON DELETE SET NULL,
    day_no INTEGER NOT NULL,
    start_time TIME,
    end_time TIME,
    notes TEXT,
    estimated_cost NUMERIC(10, 2) DEFAULT 0.00,
    status VARCHAR(50) DEFAULT 'pending', -- pending, done, skipped
    CONSTRAINT check_activity_times CHECK (end_time > start_time)
);

-- Reviews Table
CREATE TABLE IF NOT EXISTS reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    place_id INTEGER REFERENCES places(place_id) ON DELETE CASCADE,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    rating_comment TEXT,
    review_date DATE DEFAULT CURRENT_DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Weather Table
CREATE TABLE IF NOT EXISTS weather (
    weather_id SERIAL PRIMARY KEY,
    city_id INTEGER REFERENCES cities(city_id) ON DELETE CASCADE,
    date DATE NOT NULL,
    temperature JSON, -- {min: 10, max: 25, unit: "C"}
    conditions VARCHAR(255), -- Sunny, Rainy, etc.
    humidity INTEGER,
    wind_speed DECIMAL(5,2),
    UNIQUE(city_id, date)
);

-- Expenses Table
CREATE TABLE IF NOT EXISTS expenses (
    expense_id SERIAL PRIMARY KEY,
    itinerary_id INTEGER REFERENCES itineraries(itinerary_id) ON DELETE CASCADE,
    description TEXT,
    amount NUMERIC(12, 2) NOT NULL,
    category VARCHAR(100), -- Food, Transport, Accommodation
    expense_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- ==========================================
-- 2. Additional Tables (Advanced Features)
-- ==========================================

-- User Preferences (For Recommendation Engine)
CREATE TABLE IF NOT EXISTS user_preferences (
    preference_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    preference_key VARCHAR(100) NOT NULL, -- e.g., 'preferred_transport', 'budget_level'
    preference_value VARCHAR(255),
    weight INTEGER DEFAULT 1, -- Importance 1-10
    UNIQUE(user_id, preference_key)
);

-- Audit Logs (Track changes)
CREATE TABLE IF NOT EXISTS audit_logs (
    log_id SERIAL PRIMARY KEY,
    table_name VARCHAR(50) NOT NULL,
    record_id INTEGER,
    action VARCHAR(10) NOT NULL, -- INSERT, UPDATE, DELETE
    old_data JSONB,
    new_data JSONB,
    changed_by INTEGER REFERENCES users(user_id),
    changed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Notifications
CREATE TABLE IF NOT EXISTS notifications (
    notification_id SERIAL PRIMARY KEY,
    user_id INTEGER REFERENCES users(user_id) ON DELETE CASCADE,
    title VARCHAR(255),
    message TEXT,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tags (For better categorization of places)
CREATE TABLE IF NOT EXISTS tags (
    tag_id SERIAL PRIMARY KEY,
    name VARCHAR(50) UNIQUE NOT NULL
);

CREATE TABLE IF NOT EXISTS place_tags (
    place_id INTEGER REFERENCES places(place_id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES tags(tag_id) ON DELETE CASCADE,
    PRIMARY KEY (place_id, tag_id)
);

-- ==========================================
-- 3. Indexes
-- ==========================================

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_cities_province ON cities(province);
CREATE INDEX idx_places_city_id ON places(city_id);
CREATE INDEX idx_places_category ON places(category);
CREATE INDEX idx_itineraries_user_id ON itineraries(user_id);
CREATE INDEX idx_activities_itinerary_id ON activities(itinerary_id);
CREATE INDEX idx_activities_date_time ON activities(day_no, start_time);
CREATE INDEX idx_reviews_place_id ON reviews(place_id);
CREATE INDEX idx_weather_city_date ON weather(city_id, date);
CREATE INDEX idx_expenses_itinerary_id ON expenses(itinerary_id);

-- ==========================================
-- 4. Views
-- ==========================================

-- View: Place Details with City Info
CREATE OR REPLACE VIEW v_place_details AS
SELECT 
    p.place_id,
    p.place_name,
    p.category,
    p.duration,
    c.name AS city_name,
    c.province,
    COALESCE(AVG(r.rating), 0) as avg_rating,
    COUNT(r.review_id) as review_count
FROM places p
JOIN cities c ON p.city_id = c.city_id
LEFT JOIN reviews r ON p.place_id = r.place_id
GROUP BY p.place_id, c.name, c.province;

-- View: Itinerary Summary
CREATE OR REPLACE VIEW v_itinerary_summary AS
SELECT 
    i.itinerary_id,
    i.title,
    u.first_name || ' ' || u.last_name AS owner_name,
    i.start_date,
    i.end_date,
    (i.end_date - i.start_date) AS duration_days,
    COUNT(DISTINCT a.place_id) AS total_places,
    COALESCE(SUM(e.amount), 0) AS total_expenses
FROM itineraries i
JOIN users u ON i.user_id = u.user_id
LEFT JOIN activities a ON i.itinerary_id = a.itinerary_id
LEFT JOIN expenses e ON i.itinerary_id = e.itinerary_id
GROUP BY i.itinerary_id, u.first_name, u.last_name;

-- ==========================================
-- 5. Stored Procedures and Functions
-- ==========================================

-- Function: Update 'updated_at' timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Function: Calculate Total Itinerary Cost
CREATE OR REPLACE FUNCTION calculate_itinerary_total(p_itinerary_id INTEGER)
RETURNS NUMERIC AS $$
DECLARE
    v_total NUMERIC(12, 2);
BEGIN
    SELECT COALESCE(SUM(amount), 0) INTO v_total
    FROM expenses
    WHERE itinerary_id = p_itinerary_id;
    
    RETURN v_total;
END;
$$ LANGUAGE plpgsql;

-- Function: Auto-create Notification on Itinerary Completion
CREATE OR REPLACE FUNCTION notify_itinerary_completion()
RETURNS TRIGGER AS $$
BEGIN
    IF NEW.status = 'completed' AND OLD.status != 'completed' THEN
        INSERT INTO notifications (user_id, title, message)
        VALUES (NEW.user_id, 'Itinerary Completed', 'Congratulations! You have completed your itinerary: ' || NEW.title);
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- ==========================================
-- 6. Triggers
-- ==========================================

-- Trigger: Update timestamp for Users
CREATE TRIGGER trg_users_updated_at
BEFORE UPDATE ON users
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Update timestamp for Itineraries
CREATE TRIGGER trg_itineraries_updated_at
BEFORE UPDATE ON itineraries
FOR EACH ROW
EXECUTE FUNCTION update_updated_at_column();

-- Trigger: Notify on Itinerary Completion
CREATE TRIGGER trg_notify_completion
AFTER UPDATE ON itineraries
FOR EACH ROW
EXECUTE FUNCTION notify_itinerary_completion();

-- Trigger: Update Itinerary Budget when Expense is added/modified
CREATE OR REPLACE FUNCTION update_budget_from_expense()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE itineraries
    SET total_budget = (
        SELECT COALESCE(SUM(amount), 0) 
        FROM expenses 
        WHERE itinerary_id = COALESCE(NEW.itinerary_id, OLD.itinerary_id)
    )
    WHERE itinerary_id = COALESCE(NEW.itinerary_id, OLD.itinerary_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_update_budget
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW
EXECUTE FUNCTION update_budget_from_expense();


-- ==========================================
-- 7. Seed Data
-- ==========================================

-- Punjab
INSERT INTO cities (name, description, province) VALUES ('Lahore', 'The cultural heart of Pakistan', 'Punjab');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Lahore'), 'Badshahi Mosque', 'History', 'Iconic Mughal era mosque', 1.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Lahore'), 'Lahore Fort', 'History', 'Historical citadel', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Lahore'), 'Wagah Border Ceremony', 'Culture', 'Daily military parade', 3.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Lahore'), 'Food Street Fort Road', 'Food', 'Traditional food with a view', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Lahore'), 'Shalimar Gardens', 'Nature', 'Mughal garden complex', 1.5);

INSERT INTO cities (name, description, province) VALUES ('Islamabad', 'The beautiful capital city', 'Punjab');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Islamabad'), 'Faisal Mosque', 'History', 'Largest mosque in Pakistan', 1.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Islamabad'), 'Daman-e-Koh', 'Nature', 'Viewpoint over the city', 1.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Islamabad'), 'Monal Restaurant', 'Food', 'Dining in the hills', 2.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Islamabad'), 'Trail 3', 'Hiking', 'Popular hiking trail', 3.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Islamabad'), 'Lok Virsa Museum', 'History', 'Heritage museum', 2.0);

INSERT INTO cities (name, description, province) VALUES ('Murree', 'Popular hill station', 'Punjab');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Murree'), 'Mall Road', 'Shopping', 'Famous shopping street', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Murree'), 'Pindi Point', 'Nature', 'Scenic chairlift', 1.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Murree'), 'Patriata (New Murree)', 'Adventure', 'Cable car and chair lift', 3.0);

INSERT INTO cities (name, description, province) VALUES ('Multan', 'City of Saints', 'Punjab');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Multan'), 'Tomb of Shah Rukn-e-Alam', 'History', 'Sufi shrine', 1.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Multan'), 'Ghanta Ghar', 'History', 'Clock tower', 0.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Multan'), 'Hussain Agahi Bazaar', 'Shopping', 'Local market', 2.0);

-- Sindh
INSERT INTO cities (name, description, province) VALUES ('Karachi', 'City of Lights', 'Sindh');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Karachi'), 'Clifton Beach', 'Nature', 'Popular beach', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Karachi'), 'Mazar-e-Quaid', 'History', 'Jinnah''s Mausoleum', 1.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Karachi'), 'Mohatta Palace', 'History', 'Art museum', 1.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Karachi'), 'Port Grand', 'Food', 'Food and entertainment complex', 3.0);

INSERT INTO cities (name, description, province) VALUES ('Hyderabad', 'City of Perfumes', 'Sindh');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Hyderabad'), 'Rani Bagh', 'Nature', 'Zoological garden', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Hyderabad'), 'Pacca Qilla', 'History', 'Historical fort', 1.5);

INSERT INTO cities (name, description, province) VALUES ('Thatta', 'Historical city', 'Sindh');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Thatta'), 'Makli Necropolis', 'History', 'UNESCO World Heritage site', 2.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Thatta'), 'Shah Jahan Mosque', 'History', '17th century mosque', 1.0);

-- KPK
INSERT INTO cities (name, description, province) VALUES ('Peshawar', 'City of Flowers', 'KPK');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Peshawar'), 'Qissa Khwani Bazaar', 'Shopping', 'Storytellers market', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Peshawar'), 'Bala Hissar Fort', 'History', 'Historic fortress', 1.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Peshawar'), 'Mahabat Khan Mosque', 'History', 'Mughal era mosque', 1.0);

INSERT INTO cities (name, description, province) VALUES ('Swat', 'Switzerland of the East', 'KPK');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Swat'), 'Malam Jabba', 'Adventure', 'Ski resort', 4.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Swat'), 'Mingora Bazaar', 'Shopping', 'Main market', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Swat'), 'White Palace Marghazar', 'History', 'Royal palace', 1.5);

INSERT INTO cities (name, description, province) VALUES ('Naran', 'Popular tourist valley', 'KPK');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Naran'), 'Saif-ul-Malook Lake', 'Nature', 'Famous alpine lake', 3.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Naran'), 'Lulusar Lake', 'Nature', 'Scenic lake', 1.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Naran'), 'Babusar Top', 'Nature', 'Mountain pass', 1.0);

-- Balochistan
INSERT INTO cities (name, description, province) VALUES ('Quetta', 'Fruit Garden of Pakistan', 'Balochistan');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Quetta'), 'Hanna Lake', 'Nature', 'Scenic lake', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Quetta'), 'Hazarganji Chiltan National Park', 'Nature', 'National park', 3.0);

INSERT INTO cities (name, description, province) VALUES ('Ziarat', 'Juniper forests', 'Balochistan');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Ziarat'), 'Quaid-e-Azam Residency', 'History', 'Summer residence of Jinnah', 1.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Ziarat'), 'Prospect Point', 'Nature', 'Viewpoint', 1.0);

INSERT INTO cities (name, description, province) VALUES ('Gwadar', 'Port City', 'Balochistan');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Gwadar'), 'Gwadar Port', 'Sightseeing', 'Deep sea port', 1.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Gwadar'), 'Hammerhead', 'Nature', 'Rock formation', 1.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Gwadar'), 'Princess of Hope', 'Nature', 'Rock formation', 1.0);

-- Gilgit-Baltistan
INSERT INTO cities (name, description, province) VALUES ('Hunza', 'Mountain valley', 'Gilgit-Baltistan');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Hunza'), 'Altit Fort', 'History', 'Ancient fort', 1.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Hunza'), 'Baltit Fort', 'History', 'Ancient fort', 1.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Hunza'), 'Attabad Lake', 'Adventure', 'Boating and jet ski', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Hunza'), 'Eagle''s Nest', 'Nature', 'Sunset viewpoint', 1.5);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Hunza'), 'Passu Cones', 'Nature', 'Iconic peaks', 1.0);

INSERT INTO cities (name, description, province) VALUES ('Skardu', 'Gateway to K2', 'Gilgit-Baltistan');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Skardu'), 'Shangrila Resort', 'Nature', 'Lower Kachura Lake', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Skardu'), 'Deosai Plains', 'Nature', 'High altitude plateau', 5.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Skardu'), 'Shigar Fort', 'History', 'Heritage hotel', 1.5);

INSERT INTO cities (name, description, province) VALUES ('Gilgit', 'Capital of GB', 'Gilgit-Baltistan');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Gilgit'), 'Naltar Valley', 'Nature', 'Skiing and lakes', 4.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Gilgit'), 'Kargah Buddha', 'History', 'Ancient rock carving', 0.5);

INSERT INTO cities (name, description, province) VALUES ('Fairy Meadows', 'Base of Nanga Parbat', 'Gilgit-Baltistan');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Fairy Meadows'), 'Fairy Meadows Trek', 'Hiking', 'Trek to base camp', 6.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Fairy Meadows'), 'Reflection Lake', 'Nature', 'View of Nanga Parbat', 1.0);

-- AJK
INSERT INTO cities (name, description, province) VALUES ('Muzaffarabad', 'Capital of AJK', 'AJK');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Muzaffarabad'), 'Pir Chinasi', 'Nature', 'Mountain top view', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Muzaffarabad'), 'Red Fort', 'History', 'Chak fort', 1.0);

INSERT INTO cities (name, description, province) VALUES ('Neelum Valley', 'Blue Gem', 'AJK');
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Neelum Valley'), 'Ratti Gali Lake', 'Hiking', 'Alpine glacial lake', 5.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Neelum Valley'), 'Keran', 'Nature', 'Riverside resort', 2.0);
INSERT INTO places (city_id, place_name, category, description, duration) VALUES ((SELECT city_id FROM cities WHERE name = 'Neelum Valley'), 'Sharda Peeth', 'History', 'Ancient temple ruins', 1.0);

