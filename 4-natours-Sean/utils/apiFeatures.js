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

        this.query = this.query.find(JSON.parse(queryString));
        // let query = Tour.find(JSON.parse(queryString));
        return this;
    }

    sort() {
        if (this.queryString.sort) {
            console.log(this.queryString.sort);
            const sortBy = this.queryString.sort.split(',').join(' ');
            this.query = this.query.sort(sortBy);
            //sort(price duration ...)
        } else {
            this.query = this.query.sort('-createdAt');
            //this.query = this.query.sort('price');
        }
        return this;
    }

    limitFields() {
        if (this.queryString.fields) {
            const fields = this.queryString.fields.split(',').join(' ');
            this.query = this.query.select(fields);
        }
        return this;
    }

    pagination() {
        const page = this.queryString.page * 1 || 1;
        const limit = this.queryString.limit * 1 || 100;
        const skip = (page - 1) * limit;

        this.query = this.query.skip(skip).limit(limit);

        return this;
    }
}

module.exports = APIFeatures;
