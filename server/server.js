require('./config');
require('./db/mongoose');

const express = require('express');
const bodyParser = require('body-parser');

const app = express();

app.use(bodyParser.json());
app.use(express.static('public'));
app.use('/companies', require('./routes/companies'));

app.listen(process.env.PORT, () => {
    console.log(`Started on port ${process.env.PORT}`);
});