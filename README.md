# ScoreSaber
ScoreSaber-related stuff

### Setup
- Clone the repo
- Make sure to install dependencies using `npm install`.
- Create a `data/` directory
- Create a file in `data/` called `auth.json` with the following structure:
```
{
	"keys": {
		"YOUR_SECURE_KEY": "username",
		"OTHER_KEY": "trusted friend"
	}
}
```

### Running
When developing, start the server with `node index.js --dev` (or the equivalent `npm run dev`).  
The `--dev` option currently only prevents the "cron" (periodic script) updating the saved list of ranked maps (unnecessary requests to scoresaber servers, run it manually when needed), but might in the future disable other features intended to run only on a production server.  
Unless changed, the port defined in the main index.js file is `2148`, so access front-end pages using `http://localhost:2148`
On a production server, start the code using `node index.js`.

### Scripts
- `npm run sass`: builds css files in `client/` based on the files in `sass/`
- `npm run sass-watch`: same as sass but also watches for changes and auto-recompile when a save occurs
- `npm run compress`: generates .min.js files for all .js files in the client folder
- `npm run compress-peepee`: compress client/peepee.js into client/peepee.min.js

### Endpoints
Some admin endpoints are available. These all need to be accessed using a `key` query-string, using one of the keys from the auth.json file (created in the [Setup](#setup) step) as the value. For example, `?key=YOUR_SECURE_KEY`.
- `/admin/check-new`: runs the script checking new ranks (automatically ran every 5 minutes in production mode)
- `/admin/check-new/full`: like above but do not stop once we encounter a known ranked maps. Checks all the API pages.
- `/admin/remove-unranks`: Remove maps that have been unranked from the saved list. Goes through all the pages of the scoresaber API and compare against the saved list to know what to remove (automatically ran every hour in production mode)
- `/admin/remove-dupes`: While this should not happen (anymore), if something unexpected occurs, a single map could end up being multiple times in the saved list (no hard unique key check with the DB system used). This script checks that and removes these duplicates.
