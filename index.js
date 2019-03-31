const path = require('path');
const express = require('express');
const cors = require('cors');
const app = express();
const port = 2148;

app.use(cors());
app.use('/client', express.static('client'));
app.get('/', (req, res) => res.sendFile(path.resolve('client/index.html')));
app.get('/ranked', (req, res) => res.sendFile(path.resolve('data/ranked.json')));
app.get('/peepee', (req, res) => res.sendFile(path.resolve('client/peepee.html')));

app.listen(port, () => console.log('Scoresaber server listening (port '+port+')'));
