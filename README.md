# ScoreSaber
ScoreSaber-related stuff

### Setup
Create a `data/` directory. Create a file in it called `auth.json` with the following structure:
```
{
	"keys": {
		"YOUR_SECURE_KEY": "username",
		"OTHER_KEY": "trusted friend"
	}
}
```

### Scripts
- `npm run sass`: builds css files in `client/` based on the files in `sass/`
- `npm run sass-watch`: same as sass but also watches for changes and auto-recompile when a save occurs
- `npm run compress`: generates peepee.min.js
