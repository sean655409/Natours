const mongoose = require('mongoose');
const dotenv = require('dotenv');
const app = require('./app');

dotenv.config({ path: './config.env' });
//console.log(process.env);

const DB = process.env.DATABASE_CONNECTION.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
).replace('DBNAME', process.env.DATABASE_DBNAME);

mongoose
    .connect(DB, {
        useNewUrlParser: true,
        useCreateIndex: true,
        useFindAndModify: false
    })
    .then(() => {
        console.log('DB Connection success');
    });

const port = process.env.PORT;
const server = app.listen(port, () => {
    console.log(`App running on port ${port}`);
});

process.on('unhandledRejection', err => {
    console.log(err.name, '\n', err.message);
    console.log('UNHANDLER REJECTION! Shtting down...');
    server.close(() => {
        process.exit(1); // 0=success,1=uncaught exception
    });
});

process.on('uncaughtException', err => {
    console.log(err.name, '\n', err.message);
    console.log('UNHANDLER EXCEPTION! Shtting down...');
    server.close(() => {
        process.exit(1); // 0=success,1=uncaught exception
    });
});
