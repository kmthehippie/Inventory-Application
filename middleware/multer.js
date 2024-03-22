const multer = require("multer");

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        // Specify the directory where uploaded files will be stored
        cb(null, 'uploads/');
    },
    filename: function(req, file, cb) {
        // Generate a unique filename for the uploaded file
        cb(null, file.originalname);
    }
});

const upload = multer({ storage: storage });

module.exports = upload;
