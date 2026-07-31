-- heads up: postgres only runs this when the volume is empty, so editing it does nothing
-- to a db that already exists. to pick up changes (deployed db included):
--   docker compose down -v && docker compose up --build
--   npm run seed

-- note: we can consider changing some of the varchar's to smaller/bigger allowances, or just use TEXT

-- there is also a "session" table that isn't defined here. connect-pg-simple owns it and
-- creates it on boot, so we don't hand write the ddl for it.

-- user entity
CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE, -- unique since we log in with it
    password_hash VARCHAR(255) NOT NULL,
    contact_info VARCHAR(100),
    campus_schedule CHAR(336) DEFAULT REPEAT('0', 336) NOT NULL, -- default set to not on campus
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    role VARCHAR(20) DEFAULT 'user' NOT NULL, -- 'admin' can manage other users
    CONSTRAINT chk_valid_role CHECK (role IN ('user', 'admin'))
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
CREATE TABLE saved_courses (
    course_id SERIAL PRIMARY KEY,
    department VARCHAR(10) NOT NULL,
    course_number VARCHAR(10) NOT NULL,
    section VARCHAR(10) NOT NULL,
    CONSTRAINT unique_course_offering UNIQUE (department, course_number, section)
);

-- many to many relationship
CREATE TABLE course_collection_items (
    user_id INT,
    semester VARCHAR(10),
    year INT,
    course_id INT REFERENCES saved_courses(course_id) ON DELETE CASCADE,
    PRIMARY KEY (user_id, semester, year, course_id),
    FOREIGN KEY (user_id, semester, year) REFERENCES course_collections(user_id, semester, year) ON DELETE CASCADE
);

-- weak entity, owned by user
CREATE TABLE packs (
    pack_id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    group_name VARCHAR(100) NOT NULL,
    semester VARCHAR(10) NOT NULL,
    year INT NOT NULL
);

-- many to many relationship, someone needs to double check this one
CREATE TABLE pack_members (
    pack_id INT REFERENCES packs(pack_id) ON DELETE CASCADE,
    user_id INT REFERENCES users(user_id) ON DELETE CASCADE,
    PRIMARY KEY (pack_id, user_id)
);