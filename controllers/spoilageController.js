const Spoilage = require("../models/spoilage");
const FruitInstance = require("../models/fruitinstance");
const Fruit = require("../models/fruit")
const asyncHandler = require("express-async-handler");
const { body, param, validationResult } = require("express-validator");
const cloudinary = require("../utils/cloudinary")


// Display list of all spoilage.
exports.spoilage_list = asyncHandler(async (req, res, next) => {
  const allSpoilage = await Spoilage.find().sort({ date: 1 }).exec()

  res.render("spoilage_list", {
    title: "Spoilages List", 
    spoilage_list: allSpoilage,
  });
});

// Display detail page for a specific spoilage.
exports.spoilage_detail = asyncHandler(async (req, res, next) => {

  const spoilage = await Spoilage.findById(req.params.id).exec()

  if(spoilage === null){
    const err = new Error("Spoilage not found");
    err.status = 404;
    return next(err)
  }
  
  const fruitInstanceId = spoilage.fruitInstance
  const fruitInstance = await FruitInstance.findById(fruitInstanceId).exec()
  const fruitId = fruitInstance.fruit
  const fruit = await Fruit.findById(fruitId).exec()

  res.render("spoilage_detail", { 
  title: spoilage._id,
  spoilage: spoilage,
  fruit_instance: fruitInstance,
  fruit: fruit
  })
});

// Display spoilage create form on GET.
exports.spoilage_create_get = asyncHandler(async (req, res, next) => {
  const fruitInstance = await FruitInstance.findById(req.params.id).exec()
  const fruitId = fruitInstance.fruit
  const fruit = await Fruit.findById(fruitId).exec()
   
  res.render("spoilage_form", {title: "Create Spoilage", fruit: fruit, fruit_instance: fruitInstance, spoilage: undefined, errors: []})
});

exports.spoilage_create_post = [


  // Validate id
  param("id").isMongoId().withMessage("Invalid Fruit Instance ID"),
  // Validate and sanitize fields
  body("date").isISO8601().toDate().escape(),
  body("amount")
      .isNumeric()
      .toInt()
      .custom(async (value, { req }) => {
          // Ensure amount is not greater than available quantity
          const fruitInstance = await FruitInstance.findById(req.params.id).exec();
          if (!fruitInstance) {
              throw new Error("Fruit instance not found");
          }
          if (value > fruitInstance.stock.availableQtt) {
              throw new Error("Amount cannot exceed available quantity");
          }
          return true;
      }),

  asyncHandler(async (req, res, next) => {
      // Check for validation errors
      const errors = validationResult(req);
       // Upload images to Cloudinary
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload(file.path, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result.secure_url);
            }
          });
        });
      });
      // Wait for all uploads to complete
      const newImgUrls = await Promise.all(uploadPromises);

      if (!errors.isEmpty()) {
        const fruitInstance = await FruitInstance.findById(req.params.id).exec()
        const fruitId = fruitInstance.fruit
        const fruit = await Fruit.findById(fruitId).exec()
    
        res.render("spoilage_form", {title: "Create Spoilage", fruit: fruit, fruit_instance: fruitInstance, spoilage: undefined, errors: errors.array()})

      } else {
   
          // No validation errors, proceed with saving the spoilage
          const fruitInstanceId = req.params.id.toString();
          const spoilage = new Spoilage({
              fruitInstance: fruitInstanceId,
              date: req.body.date,
              amount: req.body.amount,
              imgurls: newImgUrls, 
          });

          try {
              // Update the corresponding FruitInstance's stock.spoilages array
              const fruitInstance = await FruitInstance.findById(fruitInstanceId).exec();
              if (!fruitInstance) {
                  throw new Error("Fruit instance not found");
              }
             
              fruitInstance.stock.spoilages.push(spoilage._id); // Add spoilage ID to stock.spoilages array
              fruitInstance.stock.spoilagesQtt.push(spoilage.amount); // Add spoilage ID to stock.spoilages array
              
              console.log("Fruit instance: ",spoilage.amount)
              await spoilage.save()
              await fruitInstance.save()

              // Redirect to the spoilage URL
              res.redirect(spoilage.url);
          } catch (error) {
              console.error(error)
              next(error);
          }
      }
  }),
];

// Display spoilage delete form on GET.
exports.spoilage_delete_get = asyncHandler(async (req, res, next) => {
  const spoilage = await Spoilage.findById(req.params.id).exec()
  res.render("spoilage_delete", { 
    title: "Delete Spoilage",
    spoilage: spoilage,
    })

});

// Handle spoilage delete on POST.
exports.spoilage_delete_post = asyncHandler(async (req, res, next) => {
  const fruitinstance = await FruitInstance.find({"stock.spoilages": req.params.id}).exec()
  await Spoilage.findByIdAndDelete(req.body.spoilageid)
  res.redirect("/catalog/fruitinstance/"+fruitinstance[0]._id)
});

// Display spoilage update form on GET.
exports.spoilage_update_get = asyncHandler(async (req, res, next) => {
  const spoilage = await Spoilage.findById(req.params.id).exec()
  const fi = await FruitInstance.find({"stock.spoilages": spoilage._id}).exec()
  const fruitInstance = fi[0]
  const fruitId = fruitInstance.fruit
  const fruit = await Fruit.findById(fruitId).exec()

  res.render("spoilage_form", {title: "Update Spoilage", fruit: fruit, fruit_instance: fruitInstance, spoilage: spoilage, errors: []})

});

// Handle spoilage update on POST.
exports.spoilage_update_post = [
  // Validate id
  param("id").isMongoId().withMessage("Invalid Spoilage ID"),
  // Validate and sanitize fields
  body("date").isISO8601().toDate().escape(),
  body("amount").isNumeric().toInt(),

  asyncHandler(async (req, res, next) => {
      
    try {
      // Check for validation errors
      const errors = validationResult(req);
      //Upload img to Cloudinary
      // Upload images to Cloudinary
      const uploadPromises = req.files.map(file => {
        return new Promise((resolve, reject) => {
          cloudinary.uploader.upload(file.path, (err, result) => {
            if (err) {
              reject(err);
            } else {
              resolve(result.secure_url);
            }
          });
        });
      });
     // Wait for all uploads to complete
     const newImgUrls = await Promise.all(uploadPromises);

      if (!errors.isEmpty()) {
        const spoilage = await Spoilage.findById(req.params.id).exec();
        const fruitInstance = await FruitInstance.findOne({"stock.spoilages": req.params.id}).exec();
        const fruitId = fruitInstance.fruit;
        const fruit = await Fruit.findById(fruitId).exec();

        res.render("spoilage_form", { title: "Update Spoilage", fruit: fruit, fruit_instance: fruitInstance, spoilage: spoilage, errors: errors.array() });
      } else {
        const existingImgUrls = req.body.spoilage.split(",")
        const allImgUrls = await (existingImgUrls || []).concat( newImgUrls )

        const spoilage = {
        fruitInstance: req.body.fruitInstanceId,
        date: req.body.date,
        amount: req.body.amount,
        imgurls: allImgUrls, // Append newly uploaded images to existing ones
        _id: req.params.id
        };

        const updatedSpoilage = await Spoilage.findByIdAndUpdate(req.params.id, spoilage, { new: true });

        if (!updatedSpoilage) {
          const error = new Error("Spoilage not found");
          error.status = 404;
          throw error;
        }

        res.redirect(updatedSpoilage.url);
      }
    } catch (error) {
      next(error);
    }
  })
  
]

