import { MongoClient } from "mongodb";
import dotenv from 'dotenv'

dotenv.config()

const url = process.env.MONGODB_SRV

var _db;


export function connectToServer(callback) {
  const options = { w: "majority", readConcern: { level: "majority" } };
  MongoClient.connect(
    url, //useNewUrlParser: true,
    {  useNewUrlParser: true, },
    function (err, client) {
      _db = client.db("logistics", options);
      return callback(err);
    }
  );
}
export function getDb() {
  return _db;
}
