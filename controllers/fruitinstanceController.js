const FruitInstance = require("../models/fruitinstance");
const Fruit = require("../models/fruit")
const Spoilage = require("../models/spoilage")
const Sale = require("../models/sale")
const Category = require("../models/category")
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require('express-validator');


// Display list of all fruitinstance.
exports.fruitinstance_list = asyncHandler(async (req, res, next) => {
  const allFruitInstances = await FruitInstance.find().sort("fruit").populate("fruit").exec()
  res.render("fruitinstance_list", {
    title: "Fruit Instances",
    fruitinstance_list: allFruitInstances
  });
});

exports.fruitinstance_detail = asyncHandler(async (req, res, next) => {
  // Get the ID of the fruit instance from the request parameters
  const fruitInstanceId = req.params.id;

  // Get the detail of the fruit instance
  const fruitInstance = await FruitInstance.findById(fruitInstanceId).exec();

  // If fruit instance not found, return 404
  if (!fruitInstance) {
    const err = new Error("Fruit instance not found");
    err.status = 404;
    return next(err);
  }

  // Get the ID of the fruit from the fruit instance
  const fruitId = fruitInstance.fruit;

  // Find the fruit using the fruit ID
  const fruit = await Fruit.findById(fruitId).exec();

  const spoilagesId = fruitInstance.stock.spoilages
  const salesId = fruitInstance.stock.sales
  //Find Spoilage and Sale urls
  const spoilages = await Spoilage.find({ _id: { $in: spoilagesId } }).exec()
  const sales = await Sale.find({ _id: { $in: salesId } }).exec()
  // If fruit not found, return 404
  if (!fruit) {
    const err = new Error("Fruit not found");
    err.status = 404;
    return next(err);
  }

  // Render the fruit detail page with the retrieved fruit and fruit instance
  res.render("fruitinstance_detail", {
    title: fruitInstance._id,
    fruit: fruit,
    fruit_instance: fruitInstance,
    spoilages: spoilages,
    sales: sales
  });
});

// Display fruitinstance create form on GET.
exports.fruitinstance_create_get = asyncHandler(async (req, res, next) => {
  const [allFruitInstances, allFruits] = await Promise.all([
    FruitInstance.find().exec(),
    Fruit.find().sort({ category: 1 }).exec(),
  ]);

  res.render("fruitinstance_form", {
    title: "Create Fruit Instance",
    fruitinstances : allFruitInstances,
    fruits: allFruits,
    fruitinstance: undefined,
    errors: []
  });
});

// Handle fruitinstance create on POST.
exports.fruitinstance_create_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.fruitinstance)) {
      req.body.fruitinstance =
        typeof req.body.fruitinstance === "undefined" ? [] : [req.body.fruitinstance];
    }
    next();
  },
  // Validate and sanitize fields.
  body("fruit.*")
    .isMongoId()
    .escape(),
  body("arrival")
    .isISO8601()
    .toDate()
    .escape(),
  body("size")
    .isNumeric()
    .toInt(),
  body("purchaseprice")
    .isNumeric()
    .toFloat(),
  body("quantitytype")
    .trim()
    .escape(),
  body("quantityIn")
    .isNumeric()
    .toInt(),

  asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req)

    if(!errors.isEmpty()){
      const [allFruitInstances, allFruits] = await Promise.all([
        FruitInstance.find().exec(),
        Fruit.find().sort({ category: 1 }).exec(),
      ]);
      // Mark selected fruit
      allFruits.forEach((fruit) => {
        if (req.body.fruit.includes(fruit._id.toString())) {
          fruit.checked = true;
        }
      });
  
      res.render("fruitinstance_form", {
        title: "Create Fruit Instance",
        fruitinstances : allFruitInstances,
        fruits: allFruits,
        fruitinstance: undefined,
        errors: errors.array(),
      });
    } else {
      // No validation errors, proceed with saving the fruit
      const fruitinstance = new FruitInstance({
        fruit: req.body.fruit,
        arrival: req.body.arrival,
        size: req.body.size,
        purchaseprice: req.body.purchaseprice,
        quantitytype: req.body.quantitytype,
        stock: {
          quantityIn: req.body.quantityIn
        }
      })
      await fruitinstance.save()
      res.redirect(fruitinstance.url)
    }
  }),
]

// Display fruitinstance delete form on GET.
exports.fruitinstance_delete_get = asyncHandler(async (req, res, next) => {
  const [ fruitinstance, spoilages, sales ] = await Promise.all([
    FruitInstance.findById(req.params.id).exec(),
    Spoilage.find({fruitInstance: req.params.id}).exec(),
    Sale.find({fruitInstance: req.params.id}).exec()
  ])
  const fruitinstanceFruit = fruitinstance.fruit
  const fruit = await Fruit.findById(fruitinstanceFruit).exec()
  if (fruitinstance === null) {
    res.redirect("/catalog/fruitinstances")
  }

  res.render("fruitinstance_delete", {
    title: "Delete Fruit Instance",
    spoilages: spoilages,
    sales: sales,
    fruit_instance: fruitinstance,
    fruit: fruit
  })
});

// Handle fruitinstance delete on POST.
exports.fruitinstance_delete_post = asyncHandler(async (req, res, next) => {
  const [ fruitinstance, spoilages, sales ] = await Promise.all([
    FruitInstance.findById(req.params.id).exec(),
    Spoilage.find({fruitInstance: req.params.id}).exec(),
    Sale.find({fruitInstance: req.params.id}).exec()
  ])
  const fruitinstanceFruit = fruitinstance.fruit
  const fruit = await Fruit.findById(fruitinstanceFruit).exec()
  if (fruitinstance === null) {
    res.redirect("/catalog/fruitinstances")
  }
  if(spoilages.length > 0 || sales.length > 0){
    res.render("fruitinstance_delete", {
      title: "Delete Fruit Instance",
      spoilages: spoilages,
      sales: sales,
      fruit_instance: fruitinstance,
      fruit: fruit
    })
    return
  } else {
    await FruitInstance.findByIdAndDelete(req.body.fruitinstanceid);
    res.redirect("/catalog/fruitinstances")
  }

  
  res.send("NOT IMPLEMENTED: fruitinstance delete POST");
});

// Display fruitinstance update form on GET.
exports.fruitinstance_update_get = asyncHandler(async (req, res, next) => {
  const [allFruitInstances, allFruits] = await Promise.all([
    FruitInstance.find().exec(),
    Fruit.find().sort({ category: 1 }).exec(),
  ]);
  const thisFruitInstance = await FruitInstance.findById(req.params.id).exec()

  res.render("fruitinstance_form", {
    title: "Update Fruit Instance",
    fruitinstances : allFruitInstances,
    fruits: allFruits,
    fruitinstance: thisFruitInstance,
    errors: []
  });

});

// Handle fruitinstance update on POST.
exports.fruitinstance_update_post = [ 
  (req, res, next) => {
  if (!Array.isArray(req.body.fruitinstance)) {
  req.body.fruitinstance =
    typeof req.body.fruitinstance === "undefined" ? [] : [req.body.fruitinstance];
}
next();
},
// Validate and sanitize fields.
body("fruit.*")
.isMongoId()
.escape(),
body("arrival")
.isISO8601()
.toDate()
.escape(),
body("size")
.isNumeric()
.toInt(),
body("purchaseprice")
.isNumeric()
.toFloat(),
body("quantitytype")
.trim()
.escape(),
body("quantityIn")
.isNumeric()
.toInt(),

asyncHandler(async (req, res, next) => {
  try{
    // Check for validation errors
  const errors = validationResult(req)

  if(!errors.isEmpty()){
  const [allFruitInstances, allFruits] = await Promise.all([
    FruitInstance.find().exec(),
    Fruit.find().sort({ category: 1 }).exec(),
  ]);
  // Mark selected fruit
  allFruits.forEach((fruit) => {
    if (req.body.fruit.includes(fruit._id.toString())) {
      fruit.checked = true;
    }
  });

  res.render("fruitinstance_form", {
    title: "Update Fruit Instance",
    fruitinstances : allFruitInstances,
    fruits: allFruits,
    fruitinstance: undefined,
    errors: errors.array(),
  });
} else {
// Retrieve existing spoilages and sales
const [existingSpoilages, existingSales] = await Promise.all([
  Spoilage.find({ fruitInstance: req.params.id }).exec(),
  Sale.find({ fruitInstance: req.params.id }).exec(),
]);

// Calculate spoilagesQtt and salesQtt arrays
const spoilagesQtt = existingSpoilages.map(spoilage => spoilage.amount);
const salesQtt = existingSales.map(sale => sale.amount);

// Construct the updated FruitInstance object
const updatedFruitInstance = {
  fruit: req.body.fruit,
  arrival: req.body.arrival,
  size: req.body.size,
  purchaseprice: req.body.purchaseprice,
  quantitytype: req.body.quantitytype,
  stock: {
    quantityIn: req.body.quantityIn,
    spoilages: existingSpoilages, // Array of existing spoilages
    spoilagesQtt: spoilagesQtt, // Array of spoilage quantities
    sales: existingSales, // Array of existing sales
    salesQtt: salesQtt, // Array of sale quantities
  },
  _id: req.params.id
};

  // Save the updated FruitInstance
  const fruitInstance = await FruitInstance.findByIdAndUpdate(req.params.id, updatedFruitInstance, { new: true });
  fruitInstance.save()

  if (!fruitInstance) {
      const error = new Error("Fruit Instance not found");
      error.status = 404;
      throw error;
  }
  res.redirect(fruitInstance.url)
}
  } catch (error) {
    next(error)
  }
}),
]