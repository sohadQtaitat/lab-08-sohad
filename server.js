'use strict';

// server setup
const express = require('express');
require('dotenv').config();
const app = express();
const cors = require('cors');
const pg = require('pg');
const PORT = process.env.PORT || 3000;
const superagent = require('superagent');
app.use(cors());

// connecting to the database
const client = new pg.Client(process.env.DATABASE_URL);
client.connect();
client.on('error', err => console.error(err));


//////////////////////////////////////////////////////////////////////LOCATION///////////////////////////////////////////////////////////////////
app.get('/location', (request, response) =>{
  
  let searchQuery = request.query.data;
  
  const URL = `https://maps.googleapis.com/maps/api/geocode/json?address=${searchQuery}&key=${process.env.GEOCODE_API_KEY}`;

  
  superagent.get(URL)
  
  .then(superagentResults => {
      let locationData = superagentResults.body.results[0];
      const location = new Location(searchQuery, locationData);
      return saveLocation(location)
        .then(result=>{
          location.id = result.rows[0].id;
          response.status(200).send(location);
        })     
    })
    .catch(error => {
      handleError(error, response);
    })

})


////////////////////////////////////////////////////////////////////////WEATHER///////////////////////////////////////////////////////////////////


app.get('/weather', (request, response) => {
  const URL = `https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${request.query.data.latitude},${request.query.data.longitude}`
  superagent.get(URL)
    .then(superagentResults => {
      let weatherData = superagentResults.body.daily.data;
      const weatherForecast = weatherData.map(obj => {
        let oneDay = new Weather(obj);    
        saveWeather(oneDay, request);
        return oneDay;
      })

      response.status(200).send(weatherForecast);
    })
    .catch(error => {
      handleError(error, response);
    })
})

/////////////////////////////////////////////////////////////////////Events///////////////////////////////////////////////////////////////////
app.get('/events', (request, response) => {

  const URL = `https://www.eventbriteapi.com/v3/events/search?location.longitude=${request.query.data.longitude}&location.latitude=${request.query.data.latitude}&expand=venue&token=${process.env.EVENTBRITE_API_KEY}`;


  
  superagent.get(URL)
    .then(superagentResults => {
      let eventData = superagentResults.body.events;
      const eventSchedule = eventData.map(obj => {
        return new Event(obj);
      })
      // console.log(eventSchedule);
      response.status(200).send(eventSchedule);
    })
    .catch(error => {
      handleError(error, response);
    })
})




function saveLocation(location){
  let sql = `INSERT INTO locationtable (search_query, formatted_query, latitude, longitude) VALUES ($1, $2, $3, $4) RETURNING id;`;
  let safeValues = [location.search_query, location.formatted_query, location.latitude, location.longitude];
  return client.query(sql,safeValues);
}

function saveWeather(oneDay, request){
  let sql = `INSERT INTO weather (forecast, time, location_id) VALUES ($1, $2, $3);`;
  let safeValues = [oneDay.forecast, oneDay.time, request.query.data.id];
  client.query(sql,safeValues);
}



function Event(obj){
  this.link = obj.url;
  this.name = obj.name.text;
  this.event_date = obj.start.local;
  this.summary = obj.summary;
}


function Location(searchQuery, locationData){
  this.search_query = searchQuery;
  this.formatted_query = locationData.formatted_address;
  this.latitude = locationData.geometry.location.lat;
  this.longitude = locationData.geometry.location.lng;
}

function Weather(obj){
  this.forecast = obj.summary;
  this.time = this.formattedDate(obj.time);
}

Weather.prototype.formattedDate = function(time) {
  let date = new Date(time*1000);
  return date.toDateString();
}

function handleError(error, response){
  console.error(error);
  const errorObj = {
    status: 500,
    text: 'Sorry, something went wrong'
  }
  response.status(500).send(errorObj);
}

// connect client to database
// client.connect()
//   .then(() => {
//   }) 
//   .catch(error => handleError(error));
app.listen(PORT, () => console.log(`listening on ${PORT}`));


