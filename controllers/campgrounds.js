const Campground = require("../models/campground");
const mbxGeocoding = require("@mapbox/mapbox-sdk/services/geocoding");
const randomString = require("randomstring");
const mapBoxToken = process.env.MAPBOX_TOKEN;
const geocoder = mbxGeocoding({ accessToken: mapBoxToken });
const cloudinary = require("cloudinary").v2;
const ExpressError = require("../utils/ExpressError");
const objectId = require("mongodb").ObjectId;
const baseValue = objectId("000000000000000000000000");
let startValue = baseValue;
let lastString, lastObjectID, firstObjectID, lastRecordedObj, numberPerPage;
let decrementalIndex = 2147483647;
const getCampgrounds = async (StartValue, direction = "f") => {
  let c = await Campground.count();
  if (!c) return null;
  const campgroundsPerPage = 10;
  let campgrounds;
  if (direction === "b") {
    campgrounds = await Campground.find({
      decrementalIndex: { $gt: StartValue },
    })
      .hint({ decrementalIndex: 1 })
      .limit(campgroundsPerPage);
    campgrounds.reverse();
    if (!campgrounds.length)
      campgrounds = await Campground.find({ _id: { $gt: baseValue } }).limit(
        campgroundsPerPage
      );
    else {
      startValue = await Campground.findOne({
        decrementalIndex: { $gt: campgrounds[0].decrementalIndex },
      }).hint({ decrementalIndex: 1 });
      if (!startValue) startValue = baseValue;
      else startValue = startValue._id;
    }
  } else {
    campgrounds = await Campground.find({ _id: { $gt: StartValue } }).limit(
      campgroundsPerPage
    );
    if (!campgrounds.length) {
      campgrounds = await Campground.find()
        .hint({ decrementalIndex: 1 })
        .limit(numberPerPage);
      campgrounds.reverse();
    }
  }
  const lastId = campgrounds[campgrounds.length - 1]._id;
  const firstId = campgrounds[0].decrementalIndex;
  numberPerPage = campgrounds.length;
  return { campgrounds, lastId, firstId };
};

module.exports.index = async (req, res) => {
  let result;
  if (req.query.f && req.query.f.length === 7) {
    if (req.query.f === lastString) {
      startValue = lastObjectID;
      result = await getCampgrounds(startValue);
    }
  } else if (req.query.b && req.query.b.length === 7) {
    if (req.query.b === lastString) {
      startValue = firstObjectID;
      result = await getCampgrounds(startValue, "b");
      if (result.campgrounds[0]._id.toString() === lastRecordedObj.toString())
        startValue = baseValue;
    }
  }
  if (!result) result = await getCampgrounds(startValue);
  if (!result)
    return res.render("campgrounds/index", {
      campgrounds: null,
      authorCampgrounds: false,
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    });
  lastObjectID = result.lastId;
  firstObjectID = result.firstId;
  lastRecordedObj = result.campgrounds[0]._id;
  const campgrounds = result.campgrounds;
  const verificationString = randomString.generate(7);
  lastString = verificationString;
  res.render("campgrounds/index", {
    campgrounds,
    verificationString,
    authorCampgrounds: false,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  });
};

module.exports.authorsCampgrounds = async (req, res) => {
  let { authorsID } = req.params;
  const campgrounds = await Campground.find({ author: authorsID });
  if (!campgrounds)
    return res.render("campgrounds/index", { campgrounds: null });
  res.render("campgrounds/index", {
    campgrounds,
    authorCampgrounds: true,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  });
};

module.exports.renderNewForm = (req, res) =>
  res.render("campgrounds/new", { decrementalIndex });

module.exports.createCampground = async (req, res) => {
  const geoData = await geocoder
    .forwardGeocode({
      query: req.body.campground.location,
      limit: 1,
    })
    .send();
  const campground = new Campground(req.body.campground);
  campground.images = req.files.map((f) => ({
    url: f.path,
    filename: f.filename,
  }));
  campground.author = req.user._id;
  campground.geometry = geoData.body.features[0].geometry;
  await campground.save();
  decrementalIndex--;
  req.flash("success", "Successfully made a new campground!");
  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.showCampground = async (req, res) => {
  const campground = await Campground.findById(req.params.id)
    .populate({
      path: "reviews",
      populate: {
        path: "author",
      },
    })
    .populate("author");
  if (!campground) {
    req.flash("error", "Cannot find that campground!");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/show", {
    campground,
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  });
};

module.exports.renderEditForm = async (req, res) => {
  const { id } = req.params;
  const campground = await Campground.findById(id);
  req.session.locationData = campground.location;
  if (!campground) {
    req.flash("error", "Cannot find that campground!");
    return res.redirect("/campgrounds");
  }
  res.render("campgrounds/edit", { campground });
};

module.exports.updateCampground = async (req, res) => {
  const { id } = req.params;
  if (req.body.campground.location !== req.session.locationData) {
    const geoData = await geocoder
      .forwardGeocode({
        query: req.body.campground.location,
        limit: 1,
      })
      .send();
    req.body.campground.geometry = geoData.body.features[0].geometry;
  }
  const campground = await Campground.findByIdAndUpdate(id, {
    ...req.body.campground,
  });
  const imgs = req.files.map((f) => ({ url: f.path, filename: f.filename }));
  let deletionSize = 0;
  if (req.body.deleteImages) {
    deletionSize += req.body.deleteImages.length;
    await campground.updateOne({
      $pull: { images: { filename: { $in: req.body.deleteImages } } },
    });
  }
  if (campground.images.length + imgs.length - deletionSize <= 5) {
    campground.images.push(...imgs);
  } else {
    throw new ExpressError("Images overflow!", 400);
  }
  await campground.save();
  if (req.body.deleteImages) {
    for (let filename of req.body.deleteImages)
      await cloudinary.uploader.destroy(filename);
  }
  if (!req.session.error) {
    req.flash("success", "Successfully updated campground!");
  }
  delete req.session.error;

  res.redirect(`/campgrounds/${campground._id}`);
};

module.exports.deleteCampground = async (req, res) => {
  const { id } = req.params;
  await Campground.findByIdAndDelete(id);
  req.flash("success", "Successfully deleted campground");
  res.redirect("/campgrounds");
};
