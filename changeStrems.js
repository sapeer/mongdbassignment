//Implement changed streams for planes on update of landed field. calculate the distance travelled and update the plane's distance travelled.

//Code starts here
import dotenv from "dotenv";
import { createNewError } from "./APIRoutes.js";
import { MongoClient } from "mongodb";

async function main() {
  dotenv.config();
  /**
   * Connection URI. Update <username>, <password>, and <your-cluster-url> to reflect your cluster.
   * See https://docs.mongodb.com/drivers/node/ for more details
   */
  const uri = process.env.MONGODB_SRV;
  /**
   * The Mongo Client you will use to interact with your database
   * See https://mongodb.github.io/node-mongodb-native/3.6/api/MongoClient.html for more details
   * In case: '[MONGODB DRIVER] Warning: Current Server Discovery and Monitoring engine is deprecated...'
   * pass option { useUnifiedTopology: true } to the MongoClient constructor.
   * const client =  new MongoClient(uri, {useUnifiedTopology: true})
   */
  const client = new MongoClient(uri);

  try {
    // Connect to the MongoDB cluster
    await client.connect();

    // Filter only the landing events from planes and calulate the distance travelled from prevCity to landed by fetiching the prevCity location and inc the distance travelled to the planes distance travelled.
    const pipeline = [
      {
        $match: {
          operationType: "update",
          //   $expr: {$gte: [{$size: "$updateDescription.truncatedArrays"}, 1]},
          "updateDescription.updatedFields.landed": { $exists: true },
        },
      },
    ];

    // Make the appropriate DB calls

    await monitorListingsUsingEventEmitter(client, pipeline);
  } catch (err) {
    console.error(err);
    await closeChangeStream(client);
  }
}

main().catch(console.error);

// Add functions that make DB calls here

function closeChangeStream(changeStream) {
  return new Promise((resolve) => {
    console.log("Closing the change stream");
    changeStream.close();
    resolve();
  });
}

async function monitorListingsUsingEventEmitter(client, pipeline = []) {
  const collection = client.db("logistics").collection("planes");
  const changeStream = collection.watch(pipeline, {
    fullDocument: "updateLookup",
  });
  changeStream.on("change", async (next) => {
    try {
      console.log("Change detected");
      let prom1 = getCity(next.fullDocument?.prevCity, client);
      let prom2 = getCity(next.fullDocument?.landed, client);
      Promise.all([prom1, prom2])
        .then(async (values) => {
          let prevCityDetails = values[0];
          let landedDetails = values[1];

          var distance = calculateDistance(
            prevCityDetails.position[0],
            prevCityDetails.position[1],
            landedDetails.position[0],
            landedDetails.position[1]
          );

          let maintainceRes = checkForMaintaince(
            next.fullDocument.distanceTravelled,
            distance
          );

          var update = {
            $inc: {
              distanceTravelled: distance,
              totalTimeFlownSecs: getSeconds(
                next.fullDocument?.landedTimeStamp,
                next.fullDocument?.prevLandedTime
              ),
            },
            $set: {            
              maintaince: maintainceRes,
            },
          };
          const dbConnect = client.db("logistics");
          const collection = dbConnect.collection("planes");
          await collection.updateOne({ _id: next.fullDocument._id }, update);
          const collectionPh = dbConnect.collection("planesHistory");
          await collectionPh.insertOne({
            landedTimeStamp: next.fullDocument.landedTimeStamp,
            landed: next.fullDocument.landed,
            planeId: next.fullDocument._id,
          });
        })
        .catch((err) => {
          console.log(err);
        });
    } catch (err) {
      console.log(err);            
    }
  });
}

//Write a fuction to calculate the distance bwteen two coordinates.
function calculateDistance(lat1, lon1, lat2, lon2) {
  var R = 6371; // Radius of the earth in km
  var dLat = deg2rad(lat2 - lat1); // deg2rad below
  var dLon = deg2rad(lon2 - lon1);
  var a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(deg2rad(lat1)) *
      Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  var c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  var d = R * c; // Distance in km
  // convert kms to miles
  return d * 0.621371;
}

function deg2rad(deg) {
  return deg * (Math.PI / 180);
}

async function getCity(city, client) {
  try {
    if (city) {
      const dbConnect = client.db("logistics");
      const collection = dbConnect.collection("cities");
      const result = await collection.findOne({ _id: city });
      if (result) {
        return result;
      }
      return undefined;
    } else return undefined;
  } catch (err) {
    throw createNewError("Unable to validate city please try again", 500);
  }
}

function checkForMaintaince(distanceTravelled, newDistanceTravelled) {
  if (distanceTravelled) {
    if (distanceTravelled + newDistanceTravelled >= 50000) {
      return true;
    }
  } else {
    if (newDistanceTravelled >= 50000) {
      return true;
    }
  }
  return false;
}

//Find the seconds between for ISO date format.
function getSeconds(date1, date2) {
  if (date1 && date2) {
    var date1 = new Date(date1);
    var date2 = new Date(date2);
    var timeDiff = Math.abs(date2.getTime() - date1.getTime());
    var diffSeconds = Math.ceil(timeDiff / 1000);
    return diffSeconds;
  } else return undefined;
}
