import logger from "./logger.js";
import axios from "axios";
import fs from "node:fs";

const zoomAuth = "https://zoom.us/oauth/";
const zoomAPI = "https://api.zoom.us/v2/";

function createHeader(accessToken) {
  return {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };
}

export async function getAccessToken() {
  try {
    let oauthToken = Buffer.from(
      `${process.env.clientID}:${process.env.clientSecret}`
    ).toString("base64");

    let res = await axios({
      method: "post",
      url: `${zoomAuth}token?grant_type=account_credentials&account_id=${process.env.accountID}`,
      headers: { Authorization: `Basic ${oauthToken}` },
    });
    return res.data.access_token;
  } catch (e) {
    return false;
  }
}

export async function getUser(accessToken, email) {
  try {
    let res = await axios({
      method: "get",
      url: `${zoomAPI}users/${email}`,
      headers: createHeader(accessToken),
    });
    return res.data;
  } catch (e) {
    return e.response.data;
  }
}

export async function listRecordings(accessToken, userId, list, token) {
  try {
    let today = new Date();
    let from = new Date(new Date().setDate(today.getDate() - 30));

    let res = await axios({
      method: "get",
      url: `${zoomAPI}users/${userId}/recordings`,
      headers: createHeader(accessToken),
      params: {
        from: `${from.getFullYear()}-${from.getMonth()}-${from.getDate()}`,
        page_size: 300,
        next_page_token: token ? token : null,
      },
    });
    list = list.concat(res.data.meetings);
    if (res.data.next_page_token) {
      return await listRecordings(
        accessToken,
        userId,
        list,
        res.data.next_page_token
      );
    } else {
      return list;
    }
  } catch (e) {
    return false;
  }
}

export async function processFile(token, object, email) {
  logger.info(`Processing ${object.id}`);

  let directory = `./downloads/${email}/`;

  let start_time = object.start_time.replace(/[^a-z0-9]/gi, "_");
  let id = object.id;
  let topic = object.topic.replace(/[^a-z0-9]/gi, "_");

  if (object.recording_files.length <= 0) {
    logger.warn("No recording files");
    return;
  }

  for (let file of object.recording_files) {
    let type = file.recording_type;
    let ext = file.file_extension.toLowerCase();
    let filename = `${start_time} [${id}] ${topic}_${type}.${ext}`;

    if (!fs.existsSync(directory)) fs.mkdirSync(directory, { recursive: true });

    try {
      let blob = await axios({
        method: "get",
        url: file.download_url,
        headers: { Authorization: `Bearer ${token}` },
        responseType: "stream",
      });

      blob.data.pipe(fs.createWriteStream(`${directory}${filename}`));
    } catch (e) {
      logger.warn(`error: ${e}`);
      return false;
    }
  }
}
