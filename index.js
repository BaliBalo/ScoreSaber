const path = require('path');
const express = require('express');
const app = express();
const port = 2148;

app.get('/', (req, res) => res.sendFile(path.resolve('data/ranked.json')));

app.listen(port, () => console.log('Scoresaber server listening (port '+port+')'));
