const Fruit = require("../models/fruit");
const Category = require("../models/category");
const FruitInstance = require("../models/fruitinstance");
const Sale = require("../models/sale");
const Spoilage = require("../models/spoilage");
const asyncHandler = require("express-async-handler");
const { body, validationResult } = require("express-validator");

//index
exports.index = asyncHandler(async (req, res, next) => {
  //Get details of everything and count it.
  const [numFruits, numCategories, numFruitInstances, numSales, numSpoilages] = await Promise.all([
    Fruit.countDocuments({}).exec(),
    Category.countDocuments({}).exec(),
    FruitInstance.countDocuments({}).exec(),
    Sale.countDocuments({}).exec(),
    Spoilage.countDocuments({}).exec(),
  ])

  res.render("index", {
    title: "Fruit Inventory Home Page",
    fruit_count: numFruits,
    category_count: numCategories,
    fruit_instance_count: numFruitInstances,
    sale_count: numSales,
    spoilage_count: numSpoilages
  })
});
// Display list of all fruit.
exports.fruit_list = asyncHandler(async (req, res, next) => {
  const allFruits = await Fruit.find({}, "name origin category")
  .sort({name : 1})
  .populate("origin")
  .exec()
  res.render("fruit_list", { title: "Fruit List", fruit_list: allFruits})
});

// Display detail page for a specific fruit.
exports.fruit_detail = asyncHandler(async (req, res, next) => {
  
  //get detail of fruit and the fruit instances for a specific fruit
  const [fruit, fruitInstances ] = await Promise.all([
    Fruit.findById(req.params.id).populate("name").populate("origin").exec(),
    FruitInstance.find({fruit: req.params.id}).exec()
  ])

  if(fruit === null){
    const err = new Error("Fruit not found");
    err.status = 404;
    return next(err)
  }

  res.render("fruit_detail", { 
  title: fruit.name,
  fruit: fruit,
  fruit_instances: fruitInstances
  })
  
  
});

// Display fruit create form on GET.
exports.fruit_create_get = asyncHandler(async (req, res, next) => {
  // Get all authors and genres, which we can use for adding to our book.
  const [allFruits, allCategories] = await Promise.all([
    Fruit.find().sort({ category: 1 }).exec(),
    Category.find().sort({ name: 1 }).exec(),
  ]);

  res.render("fruit_form", {
    title: "Create Fruit",
    fruits: allFruits,
    categories: allCategories,
    fruit: undefined,
    errors: []
  });
});

exports.fruit_create_post = [
  // Convert the genre to an array.
  (req, res, next) => {
    if (!Array.isArray(req.body.fruit)) {
      req.body.fruit =
        typeof req.body.fruit === "undefined" ? [] : [req.body.fruit];
    }
    next();
  },
  // Validate and sanitize fields.
  body("name")
    .trim()
    .isLength({ min: 3 })
    .escape()
    .withMessage("Name must be specified."),
  body("origin")
    .trim()
    .isLength({ min: 1 })
    .escape()
    .withMessage("Origin must be specified."),
  body("description")
    .trim()
    .isLength({ min: 1 })
    .optional({ checkFalsy: true }), // Check falsy values,
  body("category.*").escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Check for validation errors
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      // There are errors? Render form again with Sanitization
      // Get all fruits and categories for form.
      const [allFruits, allCategories] = await Promise.all([
        Fruit.find().sort({ category: 1 }).exec(),
        Category.find().sort({ name: 1 }).exec(),
      ]);
      // Mark selected categories
      allCategories.forEach((category) => {
        if (req.body.category.includes(category._id.toString())) {
          category.checked = true;
        }
      });
      res.render("fruit_form", {
        title: "Create Fruit",
        fruits: allFruits,
        categories: allCategories,
        fruit: undefined,
        errors: errors.array(),
      });
    } else {
      // No validation errors, proceed with saving the fruit
      const fruit = new Fruit({
        name: req.body.name,
        origin: req.body.origin,
        description: req.body.description,
        category: req.body.category,
      });
      await fruit.save();
      res.redirect(fruit.url);
    }
  }),
];

// Display fruit delete form on GET.
exports.fruit_delete_get = asyncHandler(async (req, res, next) => {
  //Get details of fruit and all their fruit instances in parallel
  const [ fruit, allFruitInstancesWithFruit ] = await Promise.all([
    Fruit.findById(req.params.id).exec(),
    FruitInstance.find({fruit: req.params.id}, "_id stock").exec()
  ])
  if (fruit === null) {
    res.redirect("/catalog/fruits")
  }

  res.render("fruit_delete", {
      title: "Delete Fruit",
      fruit: fruit,
      fruit_fruitinstances: allFruitInstancesWithFruit,
  })
});

// Handle fruit delete on POST.
exports.fruit_delete_post = asyncHandler(async (req, res, next) => {
  const [ fruit, allFruitInstancesWithFruit ] = await Promise.all([
    Fruit.findById(req.params.id).exec(),
    FruitInstance.find({fruit: req.params.id}, "_id stock").exec()
  ])
  if (allFruitInstancesWithFruit.length > 0){
    res.render("fruit_delete", {
      title: "Delete Fruit",
      fruit: fruit,
      fruit_fruitinstances: allFruitInstancesWithFruit,
    })
    return
  } else {
    await Fruit.findByIdAndDelete(req.body.fruitid);
    res.redirect("/catalog/fruits")
  }
});

// Display fruit update form on GET.
exports.fruit_update_get = asyncHandler(async (req, res, next) => {
  const [allFruits, allCategories] = await Promise.all([
    Fruit.find().sort({ category: 1 }).exec(),
    Category.find().sort({ name: 1 }).exec(),
  ]);
  const thisFruit = await Fruit.findById(req.params.id).exec()
  res.render("fruit_form", {
    title: "Update Fruit",
    fruits: allFruits,
    categories: allCategories,
    fruit: thisFruit,
    errors: []
  });
});

// Handle fruit update on POST.
exports.fruit_update_post = [
  (req, res, next) => {
    if (!Array.isArray(req.body.fruit)) {
    req.body.fruit =
      typeof req.body.fruit === "undefined" ? [] : [req.body.fruit];
    }
    next();
  },
// Validate and sanitize fields.
body("name")
.trim()
.isLength({ min: 3 })
.escape()
.withMessage("Name must be specified."),
body("origin")
.trim()
.isLength({ min: 1 })
.escape()
.withMessage("Origin must be specified."),
body("description")
.trim()
.isLength({ min: 1 })
.optional({ checkFalsy: true }), // Check falsy values,
body("category.*").escape(),

asyncHandler(async (req,res,next) =>{
  try {
    // Check for validation errors
    const errors = validationResult(req)
    if (!errors.isEmpty()) {
      // There are errors? Render form again with Sanitization
      // Get all fruits and categories for form.
      const [allFruits, allCategories] = await Promise.all([
        Fruit.find().sort({ category: 1 }).exec(),
        Category.find().sort({ name: 1 }).exec(),
      ]);
      // Mark selected categories
      allCategories.forEach((category) => {
        if (req.body.category.includes(category._id.toString())) {
          category.checked = true;
        }
      });
      res.render("fruit_form", {
        title: "Create Fruit",
        fruits: allFruits,
        categories: allCategories,
        fruit: undefined,
        errors: errors.array(),
      });
    } else {
// Construct the updated Fruit object
  const updatedFruit = {
    name: req.body.name,
    origin: req.body.origin,
    description: req.body.description,
    category: req.body.category,
    _id: req.params.id
  }
  const fruit = await Fruit.findByIdAndUpdate(req.params.id, updatedFruit, {new: true})
  res.redirect(fruit.url);
  fruit.save()
  if (!fruit) {
    const error = new Error("Fruit not found");
    error.status = 404;
    throw error;
  }
  res.redirect(fruit.url)
    }
  }catch (err){
    console.error(err)
    next(err)
  }
})
]