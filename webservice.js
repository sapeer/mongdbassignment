import express from "express";
import { connectToServer } from "./mongoUtil.js";
import {
  api_getPlanes,
  api_updatePlaneLocationWithLanding,
  api_updatePlaneLocation,
  api_replacePlaneRoute,
  api_addPlaneRoute,
  api_removeFirstPlaneRoute,
  api_getCities,
  api_getCargo,
  api_createCargo,
  api_cargoDelivered,
  api_cargoAssignCourier,
  api_cargoUnsetCourier,
  api_cargoMove,
  api_cargoGetNearestCities
} from "./APIRoutes.js";

import * as path from "path";
import { dirname } from 'path';
import { fileURLToPath } from 'url';


const app = express();
const port = 5001;

const errorHandler = (error, request, response, next) => {
    // Error handling middleware functionality
    console.log( `error ${error.message}`) // log the error
    const status = error.status || 400
    // send back an easily understandable error message to the caller
    response.status(status).send(error.message)
  }

connectToServer(function (err, client) {
  if (err) console.log(err);
  app.listen(port, () => console.log(`Example app listening on port ${port}!`));
  const __filename = fileURLToPath(import.meta.url);
  app.use(express.static(path.join(dirname(__filename), "../static")));

  // *** PLANES ***
  //Fetch planes
  // E.G. curl -X GET http://localhost:5000/planes
  app.get("/planes", api_getPlanes);

  //Fetch plane by ID
  // E.G. curl -X GET http://localhost:5000/planes/CARGO10
  app.get("/planes/:callsign", api_getPlanes);

  // Update location, heading, and landed for a plane
  // E.G. curl -X PUT http://localhost:5000/planes/CARGO10/location/2,3/240/London
  app.put(
    "/planes/:callsign/location/:location/:heading/:city",
    api_updatePlaneLocationWithLanding
  );

  //Update location and heading for a plane
  // E.G. curl -X PUT http://localhost:5000/planes/CARGO10/location/2,3/240
  app.put(
    "/planes/:callsign/location/:location/:heading",
    api_updatePlaneLocation
  );

  //Replace a Plane's Route with a single city
  // E.G. curl -X PUT http://localhost:5000/planes/CARGO10/route/London
  app.put("/planes/:callsign/route/:city", api_replacePlaneRoute);

  //Add a city to a Plane's Route
  // E.G. curl -X POST http://localhost:5000/planes/CARGO10/route/London
  app.post("/planes/:callsign/route/:city", api_addPlaneRoute);

  //Remove the first entry in the list of a Planes route
  // E.G. curl -X DELETE http://localhost:5000/planes/CARGO10/route/destination
  app.delete("/planes/:callsign/route/destination", api_removeFirstPlaneRoute);
  // *** CITIES ***
  //Fetch ALL cities
  // E.G. curl -X GET http://localhost:5000/cities
  app.get("/cities", api_getCities);

  //Fetch City by ID
  // E.G. curl -X GET http://localhost:5000/cities/London
  app.get("/cities/:city", api_getCities);

  app.get("/cities/:city/neighbors/:count", api_cargoGetNearestCities);

  // *** CARGO ***
  // ************
  //Fetch Cargo by ID
  // E.G. curl -X GET http://localhost:5000/cargo/location/London
  app.get("/cargo/location/:location", api_getCargo);

  // Create a new cargo at "location" which needs to get to "destination" - error if neither location nor destination exist as cities. Set status to "in progress"
  // E.G. curl -X POST http://localhost:5000/cargo/London/to/Cairo
  app.post("/cargo/:location/to/:destination", api_createCargo);

  // Set status field to 'Delivered'
  // E.G. curl -X PUT http://localhost:5000/cargo/5f45303156fd8ce208650caf/delivered
  app.put("/cargo/:id/delivered", api_cargoDelivered);

  // Mark that the next time the courier (plane) arrives at the location of this package it should be onloaded by setting the courier field - courier should be a plane.
  // E.G. curl -X PUT http://localhost:5000/cargo/5f45303156fd8ce208650caf/courier/CARGO10
  app.put("/cargo/:id/courier/:callsign", api_cargoAssignCourier);

  // Unset the value of courier on a given piece of cargo
  // E.G. curl -X DELETE http://localhost:5000/cargo/5f4530d756fd8ce208650d83/courier
  app.delete("/cargo/:id/courier", api_cargoUnsetCourier);

  // Move a piece of cargo from one location to another (plane to city or vice-versa)
  // E.G. curl -X PUT http://localhost:5000/cargo/5f4530d756fd8ce208650d83/location/London
  app.put("/cargo/:id/location/:location", api_cargoMove);

});

app.use(errorHandler)