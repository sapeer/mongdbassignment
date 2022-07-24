import { ObjectId } from "mongodb";
import * as mongoUtil from "./mongoUtil.js";

let projectFlight = {
  callsign: 1,
  currentLocation: 1,
  heading: 1,
  route: 1,
  landed: 1,
};

let projectCity = {
  name: 1,
  country: 1,
  location: 1,
};

let projectCargo = {
  id: 0,
  destination: 1,
  location: 1,
  courier: 1,
  received: 1,
  status: 1,
};

export function createNewError(errorMessage, errorCode) {
  let error = new Error(errorMessage);
  error.status = errorCode;
  return error;
}

async function validateCallsign(callsign) {
  try {
    if (callsign) {
      const dbConnect = mongoUtil.getDb();
      const collection = dbConnect.collection("planes");
      const result = await collection.findOne({ _id: callsign });
      if (result) {
        return true;
      }
      return false;
    } else {
      throw createNewError("Please Specify Valid callsign", 400);
    }
  } catch (err) {
    console.log(err);
    throw createNewError("Unable to validate callsign please try again", 500);
  }
}

async function validateCity(city) {
  try {
    if (city) {
      const dbConnect = mongoUtil.getDb();
      const collection = dbConnect.collection("cities");
      const result = await collection.findOne({ _id: city });
      if (result) {
        return true;
      }
      return false;
    } else {
      throw createNewError("Please Specify Valid city", 400);
    }
  } catch (err) {
    console.log(err);
    throw createNewError("Unable to validate city please try again", 500);
  }
}

async function validateCargo(cargoId) {
  try {
    if (cargoId) {
      const dbConnect = mongoUtil.getDb();
      const collection = dbConnect.collection("cargo");
      let result = await collection.findOne({ _id: new ObjectId(cargoId) });
      if (result) {
        return true;
      }
      return false;
    } else {
      throw createNewError("Please Specify Valid cargoId", 400);
    }
  } catch (err) {
    throw createNewError("Unable to validate cargo please try again", 500);
  }
}

let updateLocation = async (req) => {
  if (req.params.location) {
    let location = req.params.location
      .split(",")
      .slice(0, 2)
      .map((number) => parseFloat(number));
    if (location.length !== 2 || location.find((x) => x.isNaN))
      throw createNewError("Invalid location", 400);
    else return { location: location };
  } else return undefined;
};

let filterCallSign = async (req, optional = false) => {
  let validateCallsignRes = await validateCallsign(req.params.callsign);
  if (req.params.callsign && validateCallsignRes) {
    return { _id: req.params.callsign };
  } else if (optional) return undefined;
  else if (!validateCallsignRes) throw createNewError("Plane not found", 400);
  else throw createNewError("Please Specify Valid callsign", 400);
};

let filterCallSignLocation = async (req, optional = false) => {
  let validateCallsignRes = await validateCallsign(req.params.location);
  if (req.params.location && validateCallsignRes) {
    return { location: req.params.location };
  } else if (optional) return undefined;
  else if (!validateCallsignRes) throw createNewError("Plane not found", 400);
  else throw createNewError("Please Specify Valid location", 400);
};

let filterCity = async (req, optional = false) => {
  let validateCityRes = await validateCity(req.params.city);
  if (req.params.city && validateCityRes) {
    return { _id: req.params.city };
  } else if (optional) return undefined;
  else if (!validateCityRes) throw createNewError("City not found", 404);
  else throw createNewError("Please Specify Valid city", 400);
};

let filterLocation = async (req, optional = false) => {
  let validateCityRes = await validateCity(req.params.location);
  if (req.params.location && validateCityRes) {
    return { location: req.params.location };
  } else if (optional) return undefined;
  else if (!validateCityRes) throw createNewError("Location not found", 400);
  else throw createNewError("Please Specify Valid location", 400);
};

let updateHeading = async (req) => {
  if (
    req.params.heading &&
    !isNaN(parseFloat(req.params.heading)) &&
    parseFloat(req.params.heading) >= 0 &&
    parseFloat(req.params.heading) <= 360
  ) {
    return { heading: parseFloat(req.params.heading) };
  } else throw createNewError("Invalid heading", 400);
};

let filterCargoId = async (req) => {
  let validateCargoRes = await validateCargo(req.params.id);
  if (req.params.id && validateCargoRes) {
    return { _id: new ObjectId(req.params.id) };
  } else if (!validateCargoRes) throw createNewError("Cargo not found", 400);
  else throw createNewError("Please Specify Valid id", 400);
};

let updatedLanded = async (req) => {
  let validateCityRes = await validateCity(req.params.city);
  if (req.params.city && validateCityRes) {
    return { landed: req.params.city, landedTimeStamp: new Date().toISOString() };
  } else if (!validateCityRes) throw createNewError("City not found", 400);
  else throw createNewError("Please Specify Valid city", 400);
};

//Fetch planes Done
// E.G. curl -X GET http://localhost:5000/planes
export async function api_getPlanes(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    var filter;
    if (req.params.callsign) {
      filter = await filterCallSign(req, true);
    }
    await dbConnect
      .collection("planes")
      .find(filter, projectFlight)
      .toArray(function (err, result) {
        if (err) {
          console.error(err);
          throw createNewError("Error fetching planes", 400);
        } else if (req.params.callsign) {
          res.json(
            result.map((plane) => {
              plane.callsign = plane._id;
              plane._id = undefined;
              plane.location = plane.postion;
              plane.postion = undefined;
              plane.heading = plane.heading * 1.0;
              return plane;
            })[0]
          );
        } else {
          res.json(
            result.map((plane) => {
              plane.callsign = plane._id;
              plane._id = undefined;
              plane.location = plane.postion;
              plane.postion = undefined;
              return plane;
            })
          );
        }
      });
  } catch (err) {
    next(err);
  }
}

// Write function to get cities Done
export async function api_getCities(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    var filter;
    if (req.params.city) {
      filter = await filterCity(req);
    }
    await dbConnect
      .collection("cities")
      .find(filter, projectCity)
      .toArray(function (err, result) {
        if (err) {
          console.error(err);
          throw createNewError("Error fetching Cities", 400);
        } else if (filter) {
          let city = result.map((city) => {
            city.name = city._id;
            city._id = undefined;
            city.location = [...city.position];
            city.position = undefined;
            return city;
          })[0];
          res.json(city);
        } else {
          res.json(
            result.map((city) => {
              city.name = city._id;
              city._id = undefined;
              city.location = [...city.position];
              city.position = undefined;
              return city;
            })
          );
        }
      });
  } catch (err) {
    console.log(err);
    next(err);
  }
}

//Fetch Cargo by ID DOne
// E.G. curl -X GET http://localhost:5000/cargo/location/London

export async function api_getCargo(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let locationFilter = await filterLocation(req, true);
    let callSignCourierFilter = await filterCallSignLocation(req, true);
    let filter = {};
    if (locationFilter) {
      filter = { ...filter, ...locationFilter, ...{ status: "in process" } };
    } else if (callSignCourierFilter) {
      filter = {
        ...filter,
        ...callSignCourierFilter,
        ...{ status: "in process" },
      };
    }
    await dbConnect
      .collection("cargo")
      .find(filter, projectCargo)
      .toArray(function (err, result) {
        if (err) {
          console.error(err);
          throw createNewError("Error fetching cargo", 400);
        } else
          res.json(
            result.map((cargo) => {
              cargo.id = cargo._id;
              cargo._id = undefined;
              return cargo;
            })
          );
      });
  } catch (err) {
    next(err);
  }
}

// Fetch the plan and Update location, heading, and landed for a plane Done
// E.G. curl -X PUT http://localhost:5000/planes/CARGO10/location/2,3/240/London

export async function api_updatePlaneLocationWithLanding(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();

    var updateStmt = {};

    for (let curr of [updateLocation, updateHeading, updatedLanded]) {
      let updateSt = await curr(req);
      if (updateSt) {
        updateStmt = Object.assign(updateStmt, updateSt);
      }
    }

    let filter = await filterCallSign(req);
    await dbConnect
      .collection("planes")
      .updateOne(filter, { $set: updateStmt }, function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error updating Plane!");
        } else if (result.modifiedCount === 0) {
          res.status(200).send('{"info": "No Changes made to Plane!"}');
        } else res.json(result);
      });
  } catch (err) {
    next(err);
  }
}

//Update location and heading for a plane DOne
// E.G. curl -X PUT http://localhost:5000/planes/CARGO10/location/2,3/240
export async function api_updatePlaneLocation(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let updateCurrentLocation = async (req) => {
      if (req.params.location) {
        let currentLocation = req.params.location
          .split(",")
          .slice(0, 2)
          .map((number) => parseFloat(number));
        if (
          currentLocation.length !== 2 ||
          currentLocation.find((x) => x.isNaN)
        )
          throw createNewError("Invalid location", 400);
        else return { currentLocation };
      } else return undefined;
    };

    var updateStmt = {};
    for (let curr of [updateCurrentLocation, updateHeading]) {
      let updateSt = await curr(req);
      if (updateSt) {
        updateStmt = Object.assign(updateStmt, updateSt);
      }
    }
    //TODO handle undefined update statements

    let filter = await filterCallSign(req);
    await dbConnect
      .collection("planes")
      .updateOne(filter, { $set: updateStmt }, function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error updating Plane!");
        } else if (result.modifiedCount === 0) {
          res.status(200).send('{"info": "No Changes made to Plane!"}');
        } else res.json(result);
      });
  } catch (err) {
    next(err);
  }
}

//Replace a Plane's Route with a single city Done
// E.G. curl -X PUT http://localhost:5000/planes/CARGO10/route/London
export async function api_replacePlaneRoute(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let updateRoute = async (req) => {
      let validateCityRes = await validateCity(req.params.city);
      if (req.params.city && validateCityRes) {
        return { route: [req.params.city] };
      } else if (!validateCityRes) throw createNewError("Invalid city", 400);
      else throw createNewError("Please Specify Valid city", 400);
    };
    let filter = await filterCallSign(req, false);
    let updateStmt = await updateRoute(req);
    await dbConnect
      .collection("planes")
      .updateOne(filter, { $set: updateStmt }, function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error updating Plane!");
        } else if (result.modifiedCount === 0) {
          res.status(400).send("No Plane found with that flight number");
        } else res.json(result);
      });
  } catch (err) {
    next(err);
  }
}

//Add a city to a Plane's Route
// E.G. curl -X POST http://localhost:5000/planes/CARGO10/route/London

export async function api_addPlaneRoute(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let filter = await filterCallSign(req);

    let updateRoute = async (req) => {
      let validateCityRes = await validateCity(req.params.city);
      if (req.params.city && validateCityRes) {
        return {
          $push: {
            route: req.params.city,
          },
        };
      } else if (!validateCityRes) throw createNewError("Invalid city", 400);
      else throw createNewError("Please Specify Valid city", 400);
    };

    let updateStmt = await updateRoute(req);

    await dbConnect
      .collection("planes")
      .updateOne(filter, updateStmt, function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error updating Plane!");
        } else if (result.modifiedCount === 0) {
          res.status(404).send("No Planes where updated");
        } else res.json(result);
      });
  } catch (err) {
    next(err);
  }
}

//Remove the first entry in the list of a Planes route
// E.G. curl -X DELETE http://localhost:5000/planes/CARGO10/route/destination
export async function api_removeFirstPlaneRoute(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let filter = await filterCallSign(req);
    await dbConnect.collection("planes").updateOne(
      filter,
      {
        $pop: { route: -1 },
      },
      function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error updating Plane!");
        } else if (result.modifiedCount === 0) {
          res.status(404).send("No Planes where updated");
        } else res.json(result);
      }
    );
    await dbConnect.collection("planes").updateOne(
      filter,
      [
        {
          $set: {
            prevCity: "$landed",
            prevLandedTime: "$landedTimeStamp",
          },
        },
      ]
    );
  } catch (err) {
    next(err);
  }
}

// Create a new cargo at "location" which needs to get to "destination"
//- error if neither location nor destination exist as cities. Set status to "in progress"
// E.G. curl -X POST http://localhost:5000/cargo/London/to/Cairo
export async function api_createCargo(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let updateSource = async (req) => {
      let validateCityRes = await validateCity(req.params.location);
      if (req.params.location && validateCityRes) {
        return { location: req.params.location };
      } else if (!validateCityRes) throw createNewError("Invalid city", 400);
      else throw createNewError("Please Specify Valid location", 400);
    };
    let updateDestination = async (req) => {
      let validateCityRes = await validateCity(req.params.destination);
      if (req.params.destination && validateCityRes) {
        return { destination: req.params.destination };
      } else if (!validateCityRes) throw createNewError("Invalid city", 400);
      else throw createNewError("Please Specify Valid destination", 400);
    };
    let updateStatusToInprogress = async (_) => {
      return { status: "in process" };
    };
    let setCourierNull = async (_) => {
      return { courier: null };
    };

    let setReceivedNull = async (_) => {
      return { received: null };
    };

    var insertStmt = {};
    for (let curr of [
      updateSource,
      updateDestination,
      updateStatusToInprogress,
      setCourierNull,
      setReceivedNull,
    ]) {
      let updateSt = await curr(req);
      if (updateSt) {
        insertStmt = Object.assign(insertStmt, updateSt);
      }
    }
    await dbConnect
      .collection("cargo")
      .insertOne(insertStmt, function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error creating Cargo!");
        } else if (result.insertedCount === 0) {
          res.status(404).send("No Cargo where inserted");
        } else {
          result.id = result.insertedId;
          result.insertedId = undefined;
          res.json(result);
        }
      });
  } catch (err) {
    next(err);
  }
}

// Set status field to 'Delivered'
// E.G. curl -X PUT http://localhost:5000/cargo/5f45303156fd8ce208650caf/delivered
export async function api_cargoDelivered(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let filter = await filterCargoId(req);
    await dbConnect
      .collection("cargo")
      .updateOne(
        filter,
        { $set: { status: "delivered", received: new Date().toISOString() } },
        function (err, result) {
          if (err) {
            console.error(err);
            res.status(400).send("Error updating Cargo!");
          } else if (result.modifiedCount === 0) {
            res.status(400).send("None of the cargo was updated");
          } else res.json(result);
        }
      );
  } catch (err) {
    next(err);
  }
}
// Mark next time the courier (plane) arrives at the location of this package
// it should be onloaded by setting the courier field - courier should be a plane.
// E.G. curl -X PUT http://localhost:5000/cargo/5f45303156fd8ce208650caf/courier/CARGO10
export async function api_cargoAssignCourier(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let updateCourier = async (req) => {
      let validatePlaneRes = await validateCallsign(req.params.callsign);
      if (req.params.callsign && validatePlaneRes) {
        return { courier: req.params.callsign };
      } else if (!validatePlaneRes) throw createNewError("Invalid plane", 400);
      else throw createNewError("Please Specify Valid courier", 400);
    };
    let filter = await filterCargoId(req);
    let updateStmt = await updateCourier(req);
    await dbConnect
      .collection("cargo")
      .updateOne(filter, { $set: updateStmt }, function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error updating Cargo!");
        } else if (result.modifiedCount === 0) {
          res.status(400).send("None of the cargo was updated");
        } else res.json(result);
      });
  } catch (err) {
    next(err);
  }
}

// Unset the value of courier on a given piece of cargo
// E.G. curl -X DELETE http://localhost:5000/cargo/5f4530d756fd8ce208650d83/courier
export async function api_cargoUnsetCourier(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let filter = await filterCargoId(req);
    await dbConnect
      .collection("cargo")
      .updateOne(filter, { $set: { courier: null } }, function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error updating Cargo!");
        } else if (result.modifiedCount === 0) {
          res.status(400).send("None of the cargo was updated");
        } else res.json(result);
      });
  } catch (err) {
    next(error);
  }
}

// Move a piece of cargo from one location to another (plane to city or vice-versa)
// E.G. curl -X PUT http://localhost:5000/cargo/5f4530d756fd8ce208650d83/location/London
export async function api_cargoMove(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let updateCityLocation = async (req) => {
      let validateCityRes = await validateCity(req.params.location);
      if (req.params.location && validateCityRes) {
        return { location: req.params.location };
      } else undefined;
    };
    let updateCallSignCargo = async (req) => {
      if (req.params.location) {
        return { location: req.params.location };
      } else undefined;
    };
    let filterCallSignCargo = async (req, optional = false) => {
      let validateCallsignRes = await validateCallsign(req.params.location);
      if (req.params.location && validateCallsignRes) {
        return { _id: req.params.location };
      } else throw createNewError("Invalid Callsign or location", 400);
    };
    let filter = await filterCargoId(req);

    let cargoRecord = await dbConnect.collection("cargo").findOne(filter);

    let isLocationPlane = await dbConnect
      .collection("planes")
      .findOne({ _id: cargoRecord.location });

    let isLocationCity = await dbConnect
      .collection("cities")
      .findOne({ _id: cargoRecord.location });

    var updateStmt;
    if (isLocationPlane) {
      updateStmt = await updateCityLocation(req);
    }
    if (isLocationCity) {
      let filterCallSignRes = await filterCallSignCargo(req);
      let planeRecord = await dbConnect
        .collection("planes")
        .findOne(filterCallSignRes);
      if (
        cargoRecord.location === planeRecord?.route[0] ||
        cargoRecord.location === planeRecord.landed
      ) {
        updateStmt = await updateCallSignCargo(req);
      }
    }

    await dbConnect
      .collection("cargo")
      .updateOne(filter, { $set: updateStmt }, function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error updating Cargo!");
        } else if (result.modifiedCount === 0) {
          res.status(400).send("None of the cargo was updated");
        } else res.json(result);
      });
  } catch (err) {
    next(err);
  }
}

//GET /cities/<id>/neighbors/< count>
// Return an array of length count nearby cities sorted by nearest first curl from the given city using geo 2d sphere nearest mongodb api
// E.G. curl -X GET http://localhost:5000/cities/London/neighbors/3
export async function api_cargoGetNearestCities(req, res, next) {
  try {
    const dbConnect = mongoUtil.getDb();
    let filterCityId = async (req) => {
      let validatedCityResult = await validateCity(req.params.city);
      if (req.params.city && validatedCityResult) {
        return { _id: req.params.city };
      } else if (!validatedCityResult) {
        throw createNewError("Please Specify Valid city", 404);
      } else throw createNewError("Please Specify Valid id", 400);
    };
    let filter = await filterCityId(req);
    let count = (req) => {
      if (req.params.count) {
        return { count: parseInt(req.params.count) };
      } else throw createNewError("Please Specify Valid count", 400);
    };
    let countFilter = count(req);

    await dbConnect
      .collection("cities")
      .find(filter)
      .toArray(async function (err, result) {
        if (err) {
          console.error(err);
          res.status(400).send("Error getting City!");
        } else {
          let coordinates = [...result[0].position];
          await dbConnect
            .collection("cities")
            .aggregate([
              {
                $geoNear: {
                  near: { type: "coordinates", coordinates },
                  distanceField: "distance",
                  spherical: false,
                  key: "position",
                },
              },
              { $sort: { distance: 1 } },
              { $limit: countFilter.count },
              {
                $project: {
                  _id: 1,
                  id: "$_id",
                  location: "$position",
                  distance: 1,
                },
              },
            ])
            .toArray(function (err, result) {
              if (err) {
                console.error(err);
                res.status(400).send("Error getting nearest cities!");
              } else
                res.json({
                  neighbors: result.map((cities) => {
                    cities.name = cities.id;
                    cities.id = undefined;
                    return cities;
                  }),
                });
            });
        }
      });
  } catch (err) {
    next(err);
  }
}
