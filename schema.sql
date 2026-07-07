-- note: we can consider changing some of the varchar's to smaller/bigger allowances, or just use TEXT

-- user entity
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL, -- consider if we want this to be unique
    password_hash VARCHAR(255) NOT NULL,
    contact_info VARCHAR(100),
    campus_schedule CHAR(336) DEFAULT REPEAT('0', 336) NOT NULL, -- default set to not on campus
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);
 
-- recursive friendships relationship (many to many)
CREATE TABLE friendships (
    user_id_1 INT REFERENCES users(user_id) ON DELETE CASCADE,
    user_id_2 INT REFERENCES users(user_id) ON DELETE CASCADE,
    pending BOOLEAN DEFAULT TRUE NOT NULL,
    PRIMARY KEY (user_id_1, user_id_2),
    CONSTRAINT chk_not_self_friend CHECK (user_id_1 <> user_id_2) -- make sure user didnt friend themselves lol
);

-- weak entity
CREATE TABLE course_collections (
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    semester VARCHAR(10) NOT NULL,
    year INT NOT NULL,
    PRIMARY KEY (user_id, semester, year)
);

-- reg entity
CREATE TABLE saved_courses ();

-- many to many relationship
CREATE TABLE course_collection_items ();

-- weak entity, owned by user
CREATE TABLE packs ();

-- many to many relationship
CREATE TABLE pack_members ();