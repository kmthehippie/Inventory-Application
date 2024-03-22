const Category = require("../models/category");
const asyncHandler = require("express-async-handler");
const Fruit = require("../models/fruit")
const { body, validationResult } = require("express-validator");

// Display list of all Categories.
exports.category_list = asyncHandler(async (req, res, next) => {
  const [allCats, allFruits] = await Promise.all([
    Category.find().populate("name").exec(),
    Fruit.find().exec()
  ])
  res.render("category_list", {
    title: "Categories of Fruits",
    category_list: allCats,
    fruit_list: allFruits
  });
});

// Display detail page for a specific category.
exports.category_detail = asyncHandler(async (req, res, next) => {
  const [cat, fruit] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Fruit.find({category: req.params.id}).exec()
  ])

  if(cat === null){
    const err = new Error("Category not found");
    err.status = 404;
    return next(err)
  }

  res.render("category_detail", { 
  title: cat.name,
  cat: cat,
  fruit: fruit
  })
});

// Display category create form on GET.
exports.category_create_get = asyncHandler(async (req, res, next) => {
res.render("category_form", {title: "Create Category", errors: []})
});

// Handle category create on POST.
exports.category_create_post = [
  // Validate and sanitize the name field.
  body("name", "category name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(),

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    // Extract the validation errors from a request.
    const errors = validationResult(req);

    // Create a category object with escaped and trimmed data.
    const category = new Category({ name: req.body.name });

    if (!errors.isEmpty()) {
      // There are errors. Render the form again with sanitized values/error messages.
      res.render("category", {
        title: "Create category",
        category: category,
        errors: errors.array(),
      });
      return;
    } else {
      // Data from form is valid.
      // Check if Genre with same name already exists.
      const categoryExists = await Category.findOne({ name: req.body.name })
        .collation({locale: "en", strength: 2})
        .exec();
      if (categoryExists) {
        // Genre exists, redirect to its detail page.
        res.redirect(categoryExists.url);
      } else {
        await category.save();
        // New category saved. Redirect to category detail page.
        res.redirect(category.url);
      }
    }
  }),
];

// Display category delete form on GET.
exports.category_delete_get = asyncHandler(async (req, res, next) => {
  const [ category, allFruitsWithCategory ] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Fruit.find({category: req.params.id}, "category name").exec()
  ])
  if (category === null) {
    res.redirect("/catalog/categories")
  }

  res.render("category_delete", {
    title: "Delete Category",
    category: category,
    category_fruits: allFruitsWithCategory
  })
  
});

// Handle category delete on POST.
exports.category_delete_post = asyncHandler(async (req, res, next) => {
  const [ category, allFruitsWithCategory ] = await Promise.all([
    Category.findById(req.params.id).exec(),
    Fruit.find({category: req.params.id}, "category name").exec()
  ])
  if(allFruitsWithCategory.length > 0){
    res.render("category_delete", {
      title: "Delete Category",
      category: category,
      category_fruits: allFruitsWithCategory
    })
    return
  } else{
    await Category.findByIdAndDelete(req.body.categoryid);
    res.redirect("/catalog/categories")
  }
  res.send("NOT IMPLEMENTED: category delete POST");
});

// Display category update form on GET.
exports.category_update_get = asyncHandler(async (req, res, next) => {
  const category = await Category.findById(req.params.id).exec()
  res.render("category_form", {title: "Update Category",category: category, errors: []})
});

// Handle category update on POST.
exports.category_update_post = [
  // Validate and sanitize the name field.
  body("name", "Category name must contain at least 3 characters")
    .trim()
    .isLength({ min: 3 })
    .escape(), // Removed the semicolon here

  // Process request after validation and sanitization.
  asyncHandler(async (req, res, next) => {
    try {
      // Extract the validation errors from a request.
      const errors = validationResult(req);

      // Create a category object with escaped and trimmed data.
      const updatedCategory = { name: req.body.name };

      if (!errors.isEmpty()) {
        // There are errors. Render the form again with sanitized values/error messages.
        res.render("category_form", {
          title: "Update category",
          category: updatedCategory,
          errors: errors.array(),
        });
      } else {
        const categoryExists = await Category.findOne({ name: req.body.name })
          .collation({ locale: "en", strength: 2 })
          .exec();
        if (categoryExists) {
          // If the category already exists, render the form again with an error message.
          res.render("category_form", {
            title: "Update Category",
            category: updatedCategory,
            errors: [{ msg: "Category already exists" }],
          });
        } else {
          // Update the existing category with the new name.
          const updatedCategory = await Category.findByIdAndUpdate(
            req.params.id,
            { name: req.body.name },
            { new: true }
          );
          // Redirect to the category page.
          res.redirect(updatedCategory.url);
        }
      }
    } catch (error) {
      next(error)
    }
  })
];
