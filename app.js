const express = require('express');
const bodyParser = require('body-parser');
const mongoose = require('mongoose');
const fs = require('fs');
const path = require('path');
var { graphqlHTTP } = require('express-graphql');
const graphqlSchema = require('./graphql/schema');
const graphqlResolver = require('./graphql/resolvers');
require('dotenv').config();
const helmet = require('helmet');
const compression = require('compression');
const morgan = require('morgan');
const auth = require('./middleware/is-auth');

const app = express();
app.use(helmet());
app.use(compression());
app.use(bodyParser.json());

const accessLogStream = fs.createWriteStream(
    path.join(__dirname, 'access.log'),
    { flags: 'a' });
app.use(morgan('combined', { stream: accessLogStream }));
app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'OPTIONS, GET, POST')
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization')

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

app.use(auth);

app.use('/graphql',
    graphqlHTTP({
        schema: graphqlSchema,
        rootValue: graphqlResolver,
        graphiql: true,
        customFormatErrorFn(err) {
            if (!err.originalError) {
              return err;
            }
            const data = err.originalError.data;
            const message = err.message || 'An error occurred.';
            const code = err.originalError.code || 500;
            return ({ message: message, status: code, data: data });
          }
    }));

// the commented code below is used for exception handling when the API is REST, not a GraphQL one
// app.use((error, req, res, next) => {
//     const status = error.code;
//     const message = error.message;
//     const data = error.data;
//     return res.status(status).json({ message: message, data: data })
// });

mongoose.set('strictQuery', false);
mongoose
    .connect(`${MONGO_PROTOCOL}://${process.env.MONGO_USERNAME}:${process.env.MONGO_PASSWORD}@${MONGO_SERVER}/${process.env.MONGO_DEFAULT_DATABASE}?${process.env.MONGO_PROPS}`)
    .then(result => {
        app.listen(process.env.PORT || 3000);
        console.log('App running!');
    })
    .catch(err => console.log(err));