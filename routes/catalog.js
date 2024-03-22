const express = require("express");
const router = express.Router();
const multer = require('multer');

//require controller modules
const fruit_controller = require("../controllers/fruitController");
const category_controller = require("../controllers/categoryController");
const fruitinstance_controller = require("../controllers/fruitinstanceController");
const sale_controller = require("../controllers/saleController");
const spoilage_controller = require("../controllers/spoilageController");

// Set up Multer storage for image uploads
const upload = require("../middleware/multer")


/// CATEGORY ROUTES ///fruit
//GET catalog home page.
router.get("/", fruit_controller.index)

// GET request for creating a Fruit. NOTE This must come before routes that display Fruit (uses id).
router.get("/fruit/create", fruit_controller.fruit_create_get)

// POST request for creating Fruit.
router.post("/fruit/create", fruit_controller.fruit_create_post);

// GET request to delete Fruit.
router.get("/fruit/:id/delete", fruit_controller.fruit_delete_get);

// POST request to delete Fruit.
router.post("/fruit/:id/delete", fruit_controller.fruit_delete_post);

// GET request to update Fruit.
router.get("/fruit/:id/update", fruit_controller.fruit_update_get);

// POST request to update Fruit.
router.post("/fruit/:id/update", fruit_controller.fruit_update_post);

// GET request for list of all Fruit items.
router.get("/fruits", fruit_controller.fruit_list);

// GET request for one Fruit.
router.get("/fruit/:id", fruit_controller.fruit_detail);

/// Category ROUTES ///

// GET request for creating Category. NOTE This must come before route for id (i.e. display Category).
router.get("/category/create", category_controller.category_create_get);

// POST request for creating Category.
router.post("/category/create", category_controller.category_create_post);

// GET request to delete Category.
router.get("/category/:id/delete", category_controller.category_delete_get);

// POST request to delete Category.
router.post("/category/:id/delete", category_controller.category_delete_post);

// GET request to update Category.
router.get("/category/:id/update", category_controller.category_update_get);

// POST request to update Category.
router.post("/category/:id/update", category_controller.category_update_post);

// GET request for list of all Categories.
router.get("/categories", category_controller.category_list);

// GET request for one Category.
router.get("/category/:id", category_controller.category_detail);

/// Fruit Instance ROUTES ///

// GET request for creating fruitinstance. NOTE This must come before route for id (i.e. display fruitinstance).
router.get("/fruitinstance/create", fruitinstance_controller.fruitinstance_create_get);

// POST request for creating fruitinstance.
router.post("/fruitinstance/create", fruitinstance_controller.fruitinstance_create_post);

// GET request to delete fruitinstance.
router.get("/fruitinstance/:id/delete", fruitinstance_controller.fruitinstance_delete_get);

// POST request to delete fruitinstance.
router.post("/fruitinstance/:id/delete", fruitinstance_controller.fruitinstance_delete_post);

// GET request to update fruitinstance.
router.get("/fruitinstance/:id/update", fruitinstance_controller.fruitinstance_update_get);

// POST request to update fruitinstance.
router.post("/fruitinstance/:id/update", fruitinstance_controller.fruitinstance_update_post);

// GET request for one fruitinstance.
router.get("/fruitinstance/:id", fruitinstance_controller.fruitinstance_detail);

// GET request for list of all fruitinstance.
router.get("/fruitinstances", fruitinstance_controller.fruitinstance_list);

/// Sale ROUTES ///

// GET request for creating sale. NOTE This must come before route for id (i.e. display sale).
router.get("/sale/create/:id", sale_controller.sale_create_get);

// POST request for creating sale.
router.post("/sale/create/:id", sale_controller.sale_create_post);

// GET request to delete sale.
router.get("/sale/:id/delete", sale_controller.sale_delete_get);

// POST request to delete sale.
router.post("/sale/:id/delete", sale_controller.sale_delete_post);

// GET request to update sale.
router.get("/sale/:id/update", sale_controller.sale_update_get);

// POST request to update sale.
router.post("/sale/:id/update", sale_controller.sale_update_post);

// GET request for list of all sale.
router.get("/sales", sale_controller.sale_list);
// GET request for one sale.
router.get("/sale/:id", sale_controller.sale_detail);

/// Spoilage ROUTES ///

// GET request for creating spoilage. NOTE This must come before route for id (i.e. display spoilage).
router.get("/spoilage/create/:id", spoilage_controller.spoilage_create_get);

// POST request for creating spoilage with multiple image upload
router.post("/spoilage/create/:id", upload.array('images', 5), spoilage_controller.spoilage_create_post);

// GET request to delete spoilage.
router.get("/spoilage/:id/delete", spoilage_controller.spoilage_delete_get);

// POST request to delete spoilage.
router.post("/spoilage/:id/delete", spoilage_controller.spoilage_delete_post);

// GET request to update spoilage.
router.get("/spoilage/:id/update", spoilage_controller.spoilage_update_get);

// POST request to update spoilage with multiple image upload
router.post("/spoilage/:id/update", upload.array('images', 5), spoilage_controller.spoilage_update_post);

// GET request for list of all spoilage.
router.get("/spoilages", spoilage_controller.spoilage_list);

// GET request for one spoilage.
router.get("/spoilage/:id", spoilage_controller.spoilage_detail);

module.exports = router;