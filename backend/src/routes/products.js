const express = require('express');
const router = express.Router();
const { requireAuth } = require('../middleware/auth');
const { requirePermission, requireRoles } = require('../middleware/authorization');
const upload = require('../middleware/upload');
const productController = require('../controllers/productController');

// Public listing and details
router.get('/', productController.listProducts);
router.get('/:id', productController.getProduct);
router.get('/:id/stock', requireAuth, productController.checkStock);

// Protected: product management
router.post('/', requireAuth, requirePermission('PRODUCT_CREATE'), upload.array('images', 8), productController.createProduct);
router.put('/:id', requireAuth, requirePermission('PRODUCT_UPDATE'), upload.array('images', 8), productController.updateProduct);
router.delete('/:id', requireAuth, requirePermission('PRODUCT_DELETE'), productController.deleteProduct);

module.exports = router;
