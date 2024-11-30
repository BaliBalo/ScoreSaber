# ScoreSaber
ScoreSaber-related stuff: https://scoresaber.balibalo.xyz

### Setup
- Clone the repo
- Make sure to install dependencies using `npm install`.
- Create a `data/` directory
- If you intend to use the admin endpoints (listed lower), create a file in `data/` called `auth.json` with the following structure:
```
{
	"keys": {
		"YOUR_SECURE_KEY": "username",
		"OTHER_KEY": "trusted friend"
	}
}
```
  replace `YOUR_SECURE_KEY` by a secure secret string, preferably a long string of random characters - the value next to that key, here `username`, is used to indicate which user triggered each task in the logs. **WARNING**: any key defined in this file will be able to trigger the admin tasks.

### Running
When developing, use `npm run dev`. This will start the server but also compile the raw .js and .scss files from `pages/` into `client/` (and will keep doing it every time these raw files are changed).  

If you only want to start the server, without automatically compiling JS/CSS files, use `npm run serve-dev` (or the equivalent `node index.js --dev`).  
The `--dev` option (automatically use in `npm run dev` and `npm run serve-dev`) currently only prevents the "cron" regularly updating the saved list of ranked maps (unnecessary requests to the ScoreSaber and BeatSaver servers, run the updates manually when needed if you want to refresh your local data), but might in the future disable other features intended to run only on a production server.

Unless changed, the port defined in the main index.js file is `2148`, so access front-end pages using `http://localhost:2148`  
On a production server, start the code using `node index.js`.

In development the list of ranked maps will not update automatically. If you need it, you will likely need to generate it once. You can do so manually, for example by accessing `http://localhost:2148/admin/check-new/full?key=YOUR_SECURE_KEY` (see the [Endpoints](#endpoints) section below for more details)

### Scripts
- `npm run dev`: starts the development setup, running the server in dev mode and auto-compiling files from `pages/` to `client/`
- `npm run serve-dev`: runs the server in dev mode
- `npm run compress`: generates compressed .min.js files in `client/` for all .js files in the `pages/` folder, and compressed .css files in `client/` for all .scss files in the `pages/` folder
- `npm run compress-watch`: same as above but also auto-recompiles when saving a file

### Endpoints
Some admin endpoints are available. These all need to be accessed using a `key` query-string, using one of the keys from the auth.json file (created in the [Setup](#setup) step). For example, `?key=YOUR_SECURE_KEY`.
- `/admin/check-new`: runs the script checking new ranks (automatically ran every 5 minutes in production mode)
- `/admin/check-new/full`: like above but does not stop once it encounters a known ranked maps. Checks all the ScoreSaber API pages (automatically ran once a day in production mode)
- `/admin/remove-unranks`: Remove maps that have been unranked. Goes through all the pages of the ScoreSaber API and compares against the saved list to know what to remove (automatically ran every 6 hours in production mode)
- `/admin/remove-dupes`: While this should not happen (anymore), if something unexpected occurs, a single map could end up being multiple times in the DB (no hard unique key check with the DB system used). This script checks that and removes these duplicates.
- `/admin/update-scoresaber-values`: Performs a global check on the ScoreSaber data and update values like the star difficulty, raw pp value, number of scores set, etc. for maps currently in the DB (automatically ran once a day in production mode)
- `/admin/update-stats`: Triggers an update of the BeatSaver data (like votes, etc.) on the existing maps (automatically ran once a day in production mode)
