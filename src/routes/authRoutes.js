const express = require('express');
const router = express.Router();
const { login, register, verifyToken, verifyRole } = require('../controllers/authController');

// Rutas públicas
router.post('/login', login);
router.post('/register', register);

// Exportar rutas y middlewares útiles
module.exports = router;
module.exports.verifyToken = verifyToken;
module.exports.verifyRole = verifyRole;