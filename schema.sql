DROP TABLE IF EXISTS location;
DROP TABLE IF EXISTS weather;
DROP TABLE IF EXISTS events;

CREATE TABLE location (
  search_query VARCHAR(255),
  formatted_query VARCHAR(255),
  latitude DECIMAL,
  longitude DECIMAL
);


CREATE TABLE events (
  formatted_query VARCHAR(255),
  link VARCHAR(255),
  name VARCHAR(255),
  event_date VARCHAR(255),
  summary TEXT
)


CREATE TABLE weather (
  forecast VARCHAR(512),
  time VARCHAR(255),
  formatted_query VARCHAR(255)
);

