# ScoreSaber
ScoreSaber-related stuff: https://scoresaber.balibalo.xyz

### Setup
- Clone the repo
- Make sure to install dependencies using `npm install`.
- Create a `data/` directory
- If you intend to user the admin endpoints (listed lower), create a file in `data/` called `auth.json` with the following structure:
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
When developing, use `npm run dev`. This will start the server but also compile the raw .js and .scss files from `pages/` into `client/` (and keep doing it every time these raw files are changed).  

If you only want to start the server, without automatically compiling JS/CSS files, use `npm run serve-dev` (or the equivalent `node index.js --dev`).  
The `--dev` option (automatically use in `npm run dev` and `npm run serve-dev`) currently only prevents the "cron" regularly updating the saved list of ranked maps (unnecessary requests to the scoresaber and beatsaver servers, run the updates manually when needed if you want to refresh your local data), but might in the future disable other features intended to run only on a production server.

Unless changed, the port defined in the main index.js file is `2148`, so access front-end pages using `http://localhost:2148`  
On a production server, start the code using `node index.js`.

### Scripts
- `npm run dev`: start the development setup, running the server in dev mode and auto-compiling files from `pages/` to `client/`
- `npm run serve-dev`: running the server in dev mode
- `npm run sass`: builds css files in `client/` based on the files in `sass/`
- `npm run sass-watch`: same as sass but also watches for changes and auto-recompile when a save occurs
- `npm run compress`: generates .min.js files in `client/` for all .js files in the `pages/` folder
- `npm run compress-watch`: same as compress but also watches for changes and auto-recompile when a save occurs

### Endpoints
Some admin endpoints are available. These all need to be accessed using a `key` query-string, using one of the keys from the auth.json file (created in the [Setup](#setup) step) as the value. For example, `?key=YOUR_SECURE_KEY`.
- `/admin/check-new`: runs the script checking new ranks (automatically ran every 5 minutes in production mode)
- `/admin/check-new/full`: like above but do not stop once we encounter a known ranked maps. Checks all the scoresaber API pages.
- `/admin/remove-unranks`: Remove maps that have been unranked from the saved list. Goes through all the pages of the scoresaber API and compare against the saved list to know what to remove (automatically ran every hour in production mode)
- `/admin/remove-dupes`: While this should not happen (anymore), if something unexpected occurs, a single map could end up being multiple times in the saved list (no hard unique key check with the DB system used). This script checks that and removes these duplicates.
- `/admin/update-scoresaber-values`: Performs a global check on the scoresaber data and update values like the star difficulty, raw pp value, number of scores set, etc. of maps currently in the DB
- `/admin/update-stats`: Triggers an update of the scoresaber data (votes etc.) on the existing maps
