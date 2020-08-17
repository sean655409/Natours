const mongoose = require('mongoose');
const slugify = require('slugify');
const validator = require('validator');

const tourSchema = new mongoose.Schema(
    {
        name: {
            type: String,
            required: [true, 'A tour must have a name'],
            unique: true,
            trim: true,
            maxlength: [40, 'A tour name must <= 40 characters'],
            minlength: [10, 'A tour name must >= 10 characters']
            //validate: [validator.isAlpha, 'test alpha']
        },
        slug: {
            type: String
        },
        duration: {
            type: Number,
            required: [true, 'A tour must have a duration']
        },
        maxGroupSize: {
            type: Number,
            required: [true, 'A tour must have a group size']
        },
        difficulty: {
            type: String,
            required: [true, 'A tour must have a difficulty'],
            enum: {
                values: ['easy', 'medium', 'difficult'],
                message: 'Difficulty is either: easy, medium, difficult'
            }
        },
        ratingsAverage: {
            type: Number,
            default: 4.5,
            min: [1, 'Rating must >=1'],
            max: [5, 'Rating must <=5']
        },
        ratingsQuantity: {
            type: Number,
            default: 0
        },
        price: {
            type: Number,
            required: [true, 'A tour must have price']
        },
        priceDiscount: {
            type: Number,
            validate: {
                validator: function(val) {
                    return val < this.price; // 100<200
                },
                message: 'Discount price ({VALUE}) must < price'
            }
        },
        summary: {
            type: String,
            trim: true,
            required: [true, 'A tour must have summary']
        },
        description: {
            type: String,
            trim: true
        },
        imageCover: {
            type: String,
            required: [true, 'A tour must have a cover iamge']
        },
        images: [String],
        createAt: {
            type: Date,
            default: Date.now(),
            // 不會顯示在query中
            select: false
        },
        startDates: [Date],
        secretTour: {
            type: Boolean,
            default: false
        }
    },
    {
        // 在schema中設定option，這樣才能顯示出virtual的屬性
        toJSON: {
            virtuals: true
        },
        toObject: {
            virtuals: true
        }
    }
);

// 新增virtual屬性，每次get資料都會加上
tourSchema.virtual('durationWeeks').get(function() {
    return this.duration / 7;
});
tourSchema.pre('save', function(next) {
    this.slug = slugify(this.name, { lower: true });
    next();
});
/*
tourSchema.post('save', function(doc, next) {
    console.log(doc);
    next();
});
*/

//tourSchema.pre('find', function(next) {
tourSchema.pre(/^find/, function(next) {
    this.find({ secretTour: { $ne: true } });
    this.start = Date.now();
    next();
});

tourSchema.post(/^find/, function(docs, next) {
    console.log(`Query took ${Date.now() - this.start} milliseconds`);
    next();
});

tourSchema.pre('aggregate', function(next) {
    this.pipeline().unshift({ $match: { secretTour: { $ne: true } } });
    console.log(this.pipeline());
    next();
});

// collection名稱,schema
const Tour = mongoose.model('Tour', tourSchema);

module.exports = Tour;

/*
const testTour = new Tour({
    name: 'The Park Camper',

    price: 997
});

testTour
    .save()
    .then(doc => {
        console.log(doc);
    })
    .catch(err => {
        console.log('ERROR : ', err);
    });

    */
