const Tour = require('./../modules/tourModel');
const { Query } = require('mongoose');

exports.aliasTopTour = (req, res, next) => {
    req.query.limit = '5';
    req.query.fields = 'name,price,duration,difficulty';
    req.query.sort = 'price';
    next();
};

class APIFeatures {
    constructor(query, queryString) {
        this.query = query;
        this.queryString = queryString;
    }

    filter() {
        const queryObj = { ...this.queryString };
        const excludedFiles = ['page', 'sort', 'limit', 'fields'];
        excludedFiles.forEach(el => delete queryObj[el]);

        // 1B) Advance filtering
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(
            /\b(gte|gt|lte|lt)\b/g,
            match => `$${match}`
        );
        console.log(this.queryString, queryObj);
        console.log(queryString);

        this.query.find(JSON.parse(queryString));
        // let query = Tour.find(JSON.parse(queryString));
    }
}

exports.getAllTour = async (req, res) => {
    try {
        // BUILD QUERY
        // 1A)Filtering
        const queryObj = { ...req.query };
        const excludedFiles = ['page', 'sort', 'limit', 'fields'];
        excludedFiles.forEach(el => delete queryObj[el]);

        // 1B) Advance filtering
        let queryString = JSON.stringify(queryObj);
        queryString = queryString.replace(
            /\b(gte|gt|lte|lt)\b/g,
            match => `$${match}`
        );
        console.log(req.query, queryObj);
        console.log(queryString);

        let query = Tour.find(JSON.parse(queryString));

        // 2 Sorting
        if (req.query.sort) {
            const sortBy = req.query.sort.split(',').join(' ');
            query = query.sort(sortBy);
            //sort(price duration ...)
        } else {
            query = query.sort('-createdAt');
        }

        // 3 Select fields
        if (req.query.fields) {
            const fields = req.query.fields.split(',').join(' ');
            query = query.select(fields);
        }

        // 4 Pagination
        const page = req.query.page * 1 || 1;
        const limit = req.query.limit * 1 || 100;
        const skip = (page - 1) * limit;
        query = query.skip(skip).limit(limit);

        if (req.query.page) {
            const numTours = await Tour.countDocuments();
            if (skip > numTours) {
                throw new Error('This page does not exists');
            }
        }

        /*
        const query = await Tour.find({ name: 'The Forest Hiker' });
        
        const query = await Tour.find()
            .where('name')
            .equals('The Forest Hiker');
            */
        // const query = await Tour.where('name').equals('The Forest Hiker');

        // EXECUTE QUERY
        const features = new APIFeatures(Tour.find(), req.query).filter();
        const tours = await query;

        // SEND QUERY
        res.status(200).json({
            status: 'success',
            results: tours.length,
            data: {
                tours
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};
exports.getTour = async (req, res) => {
    try {
        const x = await Tour.findById(req.params.id);
        res.status(200).json({
            status: 'success',
            data: {
                x
            }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};

exports.createTour = async (req, res) => {
    try {
        const newTour = await Tour.create(req.body);

        res.status(201).json({
            status: 'success',
            data: {
                tour: newTour
            }
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        });
    }
};
exports.patchTour = async (req, res) => {
    try {
        const tour = await Tour.findByIdAndUpdate(req.params.id, req.body, {
            new: true,
            runValidators: true
        });

        res.status(200).json({
            status: 'success',
            data: { tour }
        });
    } catch (err) {
        res.status(404).json({
            status: 'fail',
            message: err
        });
    }
};
exports.deleteTour = async (req, res) => {
    try {
        await Tour.findByIdAndDelete(req.params.id);
        res.status(204).json({
            status: 'success',
            data: null
        });
    } catch (err) {
        res.status(400).json({
            status: 'fail',
            message: err
        });
    }
};
