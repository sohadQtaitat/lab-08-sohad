DROP TABLE IF EXISTS locationtable;
DROP TABLE IF EXISTS weather;
-- DROP TABLE IF EXISTS events;

CREATE TABLE locationtable(
    id SERIAL PRIMARY KEY,
    search_query VARCHAR(255),
    formatted_query VARCHAR(255),
    latitude NUMERIC(8,6),
    longitude NUMERIC(9,6)
);

CREATE TABLE weather(
    id SERIAL PRIMARY KEY,
    forecast VARCHAR(255),
    time VARCHAR(255),
    location_id INTEGER NOT NULL,
    FOREIGN KEY (location_id) REFERENCES locationtable (id)
);


-- CREATE TABLE events (
--   formatted_query VARCHAR(255),
--   link VARCHAR(255),
--   name VARCHAR(255),
--   event_date VARCHAR(255),
--   summary TEXT
-- )