const express = require('express');
const {
  createProduct,
  getAllProducts,
  getProductById,
  updateProduct,
  deleteProduct,
  createPreviewProduct,
  getPreviewProducts,
  publishPreviewProducts,
  getOneProductPreview,
  updateOneProductPreview,
  deleteProductPreview,
  getProductsByTenantId
} = require('../controllers/productController');
const dashboardAuth = require('../middleware/dashboardAuth');

const router = express.Router();

// Preview (Staging) Product Routes
router.post('/preview', createPreviewProduct);
router.get('/preview', getPreviewProducts);
router.get('/preview/:id', getOneProductPreview);
router.put('/preview/:id', updateOneProductPreview);
router.delete('/preview/:id', deleteProductPreview);
router.post('/publish', publishPreviewProducts);

// Final Product Routes
router.post('/', dashboardAuth, createProduct);
router.get('/', getAllProducts);
router.post('/by-tenant', getProductsByTenantId);
router.get('/:id', getProductById);
router.put('/:id', dashboardAuth, updateProduct);
router.delete('/:id', dashboardAuth, deleteProduct);

module.exports = router;