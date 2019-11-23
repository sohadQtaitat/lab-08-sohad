'use strict';

require('dotenv').config();


const superagent = require('superagent');

const express = require('express');

const app = express();

const cors = require('cors');

const pg = require('pg');


const PORT = process.env.PORT || 3000;

app.use(cors());



////////////////////////////////////////////////////////////////////////////////////////////////

const pgClient = new pg.Client(process.env.DATABASE_URL);
pgClient.connect();



app.get('/events', (request, response) => {
    checkOtherDB(request, response, 'event', errorHandler);
  });

  

app.get('/weather', (request, response) => {
  checkOtherDB(request, response, 'weather', errorHandler);
});



app.get('/location', (request, response) => {
  const queryData = request.query.data;
  locationDatabase(queryData,response);
});






const Location = function(searchQuery, jsonData) {
  const formatQuery = jsonData['formatted_address'];


  const latitude = jsonData['geometry']['location']['lat'];


  const longitude = jsonData['geometry']['location']['lng'];




  this.search_query = searchQuery;
  this.formatted_query = formatQuery;
  this.latitude = latitude;
  this.longitude = longitude;
};




const Weather = function(jsonData) {

  this.dailyForecast = [...jsonData.body.daily.data].map(forecast => {

    const statues = forecast['statues'];

    const time = (new Date(forecast['time'] * 1000)).toDateString();


    return {
        'time': time,
        'forecast': statues
    };
  });
};

const Event = function(jsonData) {

  this.events = [...jsonData.body.events].slice(0, 20).map((event) => {

    const link = event.url;

    const title = event.title.text;

    const event_date = new Date(event.start.utc).toDateString();

    const statues = event.description.text;

    return {
      'link': link,
      'title': title,
      'event_date': event_date,
      'statues': statues
    };
  });
};



//////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





const locationDatabase = function(queryData, response){

  const querySQL = 'SELECT * FROM location WHERE search_query = $1';

  const values = [ queryData ];

  return pgClient.query(querySQL,values).then((data) => {

    if(data.rowCount) {
    
        return response.status(200).send(data.rows[0]);

    } else {



      let geocodeURL = `https://maps.googleapis.com/maps/api/geocode/json?address=${queryData}&key=${process.env.GEOCODE_API_KEY}`;


      superagent.get(geocodeURL)


        .end((err, res) => {
          if (err && err.status !== 200) {
            const errorResponse500 = {'status': 500, 'responseText': 'Sorry, something went wrong' };
            return response.status(500).send(errorResponse500);
          } else {


            let location = new Location(queryData, res.body.results[0]);
            const sqlInsert = 'INSERT INTO location (latitude, longitude, formatted_query, search_query) VALUES ($1, $2, $3, $4)';
            const args = [ location.latitude, location.longitude, location.formatted_query, location.search_query];

            pgClient.query(sqlInsert, args);
            return response.status(200).send(location);
          }
        });
    }
  });
};



////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////





const checkOtherDB = function(queryData, response, tabletitle, errorHandler){

  const weatherURL =`https://api.darksky.net/forecast/${process.env.WEATHER_API_KEY}/${queryData.query.data.latitude},${queryData.query.data.longitude}`;
  
  const eventURL =`https://www.eventbriteapi.com/v3/events/search?location.longitude=${queryData.query.data.longitude}&location.latitude=${queryData.query.data.latitude}&expand=venue&token=${process.env.EVENTBRITE_API_KEY}`;
 
 
  let querySQL;
  if (tabletitle === 'weather'){
    querySQL = 'SELECT * FROM weather WHERE search_query = $1';
  } else {
    querySQL = 'SELECT * FROM event WHERE search_query = $1';
  }
  let values = [ queryData.query.data.search_query ];
 
 
 
 
//   return pgClient.query(querySQL, values).then((data) => {
//     if(data.rowCount) {
//       let arr;
//       if (tabletitle === 'weather'){
//         arr = 'dailyforecast';
//       } else {
//         arr = 'events';
//       }
 
 
 

const errorHandler = function(res, code) {
  const errorResponse = {'status': code, 'something wrong' };
  return res.status(500).send(errorResponse);
};





/////////////////////////////////////////////////-----------Error------------/////////////////////////////Sohad/




app.get('/foo',(request,response) =>{
    throw new Error('ops');
})

app.use('*', (request, response) => {
    response.status(404).send('Not Found')
})

app.use((error,request,response) => {
    response.status(500).send(error)
})

/////////////////////////////////////////////////-----------listening for requests------------/////////////////////////////Sohad/

 
app.listen(PORT, () => console.log(`App is listening on ${PORT}`));