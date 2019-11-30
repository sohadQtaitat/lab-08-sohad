'use strict';

require('dotenv').config();

const express = require('express');

const cors = require('cors');

const superagent = require('superagent');

const pg = require('pg');

const PORT = process.env.PORT;

const app = express();



///////////////////////////////////////// Database Connection Setup/////////////////////////////////////////



const client = new pg.Client(process.env.DATABASE_URL);

client.on('error', err => { throw err; });

app.use(cors());




app.get('/location', locationData);

app.get('/weather', weatherData);

app.get('/events', eventinfo);








client.connect()
  .then(() => {
    app.listen(PORT, () => console.log(`App Listening on ${PORT}`));
  })
  .catch(err => {
    throw `PG Startup Error: ${err.message}`;
  });
//////////////////////////////////////////////////////////// Location///////////////////////////////////////////////


function locationData(request, response) {

  let city = request.query.data;

  let SQL = 'SELECT * FROM location WHERE search_query = $1 ;';

  let values = [city];

  client.query(SQL, values)



    .then(results => {
      if (results.rowCount) {

        return response.status(200).json(results.rows[0]);
      } else {
        console.log(city + 'not found in DB');
        getlocationData(city, response);
      }
    });

}



function getlocationData(city, response) {
  const url = `https://maps.googleapis.com/maps/api/geocode/json?address=${city}&key=${process.env.GEOCODE_API_KEY}`;

  return superagent.get(url)
    .then(data => {
      return new Location(city, data.body);
    })

    
    .then(locationInstance => {

      let SQL = 'INSERT INTO location (search_query , formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING *;';
      
      let dataBaseValue = [locationInstance.search_query, locationInstance.formatted_query, locationInstance.latitude, locationInstance.longitude];
      
      client.query(SQL, dataBaseValue)
      
      
      .then(results => {
          return response.status(200).json(results.rows[0]);
        });
    });
}


function Location(city, data) {
  this.search_query = city;
  this.formatted_query = data.results[0].formatted_address;
  this.latitude = data.results[0].geometry.location.lat;
  this.longitude = data.results[0].geometry.location.lng;
}





/////////////////////////////////////////////////////////////////////////Weather/////////////////////////////////////////////////////////////////////




function weatherData(request, response) {

  getweatherData(request.query.data)
  
  .then(weatherData => response.status(200).json(weatherData));
}



function getweatherData(query) {

  const url = `https://api.darksky.net/forecast/${process.env.DARKSKY_API_KEY}/${query.latitude},${query.longitude}`;

  return superagent.get(url)
    .then(data => {
      let weather = data.body;
      return weather.daily.data.map((day) => {
        return new Weather(day);
      });
    });
}



function Weather(day) {
  // this.dailyForecast = [...jsonData.body.daily.data].map(forecast => {

  this.forecast = day.summary;
  this.time = new Date(day.time * 1000).toDateString();
   return {
      'forecast': summary,
      'time': time
    };
}


//////////////////////////////////////////// Event//////////////////////////////////////////////////////////////////////
function eventinfo(request, response) {

  eventData(request.query.data.search_query)
  
  .then(eventData => response.status(200).json(eventData));
}



function eventData(city) {

  const url = `http://api.eventful.com/json/events/search?app_key=${process.env.EVENTBRITE_API_KEY}&location=${city}`;

  return superagent.get(url)

  
  
  .then(data => {
      let list = JSON.parse(data.text);
      if (list.events) {
        return list.events.event.map((day) => {
          return new Event(day);
        });
      }
    });
}



function Event(day) {
  this.link = day.url;
  this.name = day.title;
  this.event_date = day.start_time;
  this.summary = day.description;
}



app.use('*', (request, response) => {
  response.status(404).send('something goes wrong ');
});
app.use((error, request, response) => {
  response.status(500).send(error);
});
