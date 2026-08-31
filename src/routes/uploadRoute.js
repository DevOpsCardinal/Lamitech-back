const multer = require("multer");
const path = require("path");
const express = require('express') 
const router = express.Router();

const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, "uploads/"); // Directorio donde se guardará el archivo
    },
    filename: function (req, file, cb) {
      const newFilename = `logo${path.extname(file.originalname)}`;
      cb(null, newFilename); // Nombre de archivo personalizado
    },
});

const upload = multer({ storage: storage });

router.post("/upload", upload.single("archivo"),
    function (req, res) {
      console.log("Archivo recibido:", req.file);
      res.send({ message: "Archivo subido correctamente" });
    }
);
module.exports = router;