const path = require('path');
const express = require('express');
const request = require('request');
// const cors = require('cors');
const app = express();
const port = 2148;

// app.use(cors());
app.use('/client', express.static('client'));
app.get('/', (req, res) => res.sendFile(path.resolve('client/index.html')));
app.get('/ranked', (req, res) => res.sendFile(path.resolve('data/ranked.json')));
app.get('/peepee', (req, res) => res.sendFile(path.resolve('client/peepee.html')));
app.use('/proxy', (req, res) => req.pipe(request('https://scoresaber.com' + req.url)).pipe(res));

app.listen(port, () => console.log('Scoresaber server listening (port '+port+')'));
