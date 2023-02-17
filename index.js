import dotenv from "dotenv/config"; // load .env
import logger from "./logger.js";
import {
  getAccessToken,
  getUser,
  listRecordings,
  processFile,
} from "./zoom.js";
import express from "express";

const app = express();
const port = process.env.PORT || 3000;

if (!process.env.accountID) logger.warn("accountID missing in .env");
if (!process.env.clientID) logger.warn("clientID missing in .env");
if (!process.env.clientSecret) logger.warn("clientSecret missing in .env");

app.set("query parser", "simple");

let START = false;

app.get("/", express.json(), async (req, res) => {

  // Check if we are already downloading files
  if (START) {
    res.status(400).json({
      error: "Currently processing another request.  Try again later.",
    });
    return;
  }
  START = true;

  // Check for the email query parameter
  if (!!req.query.email === false) {
    res.status(400).json({ error: "Missing email query parameter" });
    return;
  }

  // Get an access token for use in future requests
  const accessToken = await getAccessToken();
  if (!!accessToken === false) {
    res.status(500).json({ error: "Unable to get access token" });
    return;
  }

  // Check if the user exists
  const user = await getUser(accessToken, decodeURI(req.query.email));
  if (user.code === 1001) {
    res.status(404).json({ user: req.query.email, message: "Not found" });
    return;
  }

  // Get a list of all recordings for user
  const recordings = await listRecordings(accessToken, user.id, []);
  if (recordings.length <= 0) {
    res.status(404).json({ error: `No recordings for ${user.email}` });
    return;
  }

  // Send a 200 OK - processing will take a while
  logger.info(`Processing ${recordings.length} recordings...`);
  res.status(200).json({ status: "processing", records: recordings.length });

  // Download the recordings
  for (let meeting of recordings) {
    await processFile(accessToken, meeting, user.email);
  }

  // We are no longer downloading anything so another request can come in now
  START = false;
});

app.listen(port, () => {
  logger.info(`listening on port ${port}`);
});
