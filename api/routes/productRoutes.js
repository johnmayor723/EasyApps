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
  deleteProductPreview
} = require('../controllers/productController');

const router = express.Router();

// Preview (Staging) Product Routes
router.post('/preview', createPreviewProduct);
router.get('/preview', getPreviewProducts);
router.get('/preview/:id', getOneProductPreview);
router.put('/preview/:id', updateOneProductPreview);
router.delete('/preview/:id', deleteProductPreview);
router.post('/publish', publishPreviewProducts);

// Final Product Routes
router.post('/', createProduct);
router.get('/', getAllProducts);
router.get('/:id', getProductById);
router.put('/:id', updateProduct);
router.delete('/:id', deleteProduct);

module.exports = router;