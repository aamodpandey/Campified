const mongoose = require('mongoose');
const Review = require('./review')
const Schema = mongoose.Schema;

const ImageSchema = new Schema({
    url: String,
    filename: String
});
// ImageSchema.virtual('bigthumb').get(function () {
//     return this.url.replace('/upload', '/upload/w_500');
// })
ImageSchema.virtual('smallthumb').get(function () {
    return this.url.replace('/upload', '/upload/w_300');
})

const opts = {toJSON: {virtuals: true}};
const CampgroundSchema = new Schema({
    title: String,
    images: [ImageSchema],
    geometry: {
        type: {
            type: String,
            enum: ['Point'],
            required: true
        },
        coordinates: {
            type: [Number],
            required: true
        }
    },
    price: Number,
    description: String,
    location: String,
    author: {
        type: Schema.Types.ObjectId,
        ref: 'User',
    },
    reviews: [
        {
            type: Schema.Types.ObjectId,
            ref: 'Review'
        }
    ],
    decrementalIndex: {type: Number, index: true},
    deleteImages: [String]
}, opts);

CampgroundSchema.virtual('properties.popupMarkUp').get(function () {
    return `<p><h3><a style="text-decoration: none" href='campgrounds/${this.id}'>${this.title}</a></h3>${this.location}<br>${this.description.substring(0, 35)}...</p>`
})

CampgroundSchema.post('findOneAndDelete', async function (doc) {
    if (doc) {
        await Review.deleteMany({
            _id: {
                $in: doc.reviews
            }
        })
    }
})

module.exports = mongoose.model('Campground', CampgroundSchema);