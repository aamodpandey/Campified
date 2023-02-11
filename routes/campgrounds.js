const express = require('express');
const router = express.Router();
const campgrounds = require('../controllers/campgrounds');
const catchAsync = require('../utils/catchAsync');
const {isLoggedIn, isAuthor, validateCampground} = require('../middleware');
const multer = require('multer');
const ExpressError = require('../utils/ExpressError');
const {storage} = require('../cloudinary');
const maxSize = 2 * 1000000;
const allowedImageFormats = [
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp'
]
const upload = multer({
    storage, fileFilter: function (req, file, cb) {
        if (!allowedImageFormats.includes(file.mimetype)) {
            req.session.error = true
            req.flash('error', 'Invalid file format!')
            return cb(null, false)
        }
        cb(null, true)
    }, limits: {fileSize: maxSize}
});

const Campground = require('../models/campground');

router.route('/')
    .get(catchAsync(campgrounds.index))
    .post(isLoggedIn, upload.array('image'), validateCampground, catchAsync(campgrounds.createCampground))

router.get('/new', isLoggedIn, campgrounds.renderNewForm)

router.get('/authorsID/:authorsID', isLoggedIn, campgrounds.authorsCampgrounds)

router.route('/:id')
    .get(catchAsync(campgrounds.showCampground))
    .put(isLoggedIn, isAuthor, upload.array('image'), validateCampground, catchAsync(campgrounds.updateCampground))
    .delete(isLoggedIn, isAuthor, catchAsync(campgrounds.deleteCampground));


router.get('/:id/edit', isLoggedIn, isAuthor, catchAsync(campgrounds.renderEditForm))


module.exports = router;