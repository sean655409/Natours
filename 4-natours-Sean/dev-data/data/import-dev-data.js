const fs = require('fs');
const mongoose = require('mongoose');
const dotenv = require('dotenv');
const Tour = require('./../../modules/tourModel');

dotenv.config({ path: './../../config.env' });
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

//console.log(fs.readFileSync('./tours-simple.json', 'utf-8'));

const tours = JSON.parse(fs.readFileSync('./tours-simple.json', 'utf-8'));

const importData = async () => {
    try {
        await Tour.create(tours);
        console.log('Data success loaded!');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

const deleteData = async () => {
    try {
        await Tour.deleteMany();
        console.log('Data successfully removed!');
        process.exit();
    } catch (err) {
        console.log(err);
    }
};

console.log(process.argv);
if (process.argv[2] === '--import') {
    importData();
} else if (process.argv[2] === '--delete') {
    deleteData();
}
