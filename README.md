# ZoomUserRecordingDownloader

This is a sample app for a specific Zoom use case.

Download all cloud recordings in the last 30 days for a user by email address API.

scopes:
- user:read:admin
- recording:read:admin

### Setup

First install nodejs 18 LTS on your machine.


```bash
# clone the repo
git clone https://github.com/Will4950/ZoomUserRecordingDownloader.git

# Navigate into the cloned project directory
cd ZoomUserRecordingDownloader

# edit .env
nano .env

# Install required dependencies
npm install 

# Start the app
npm start

```

App is listening on localhost:3000

Use it like this http://localhost:3000/?email=someuser@example.com
