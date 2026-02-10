const Product = require('../models/Product');

/**
 * @desc Create a new product
 */
exports.createProduct = async (req, res) => {
  try {
    const currentUser = req.user; // should be populated by auth middleware
    if (!currentUser || !currentUser.tenantId) {
      return res.status(403).json({ message: 'Unauthorized or tenant not found' });
    }

    const {
      name,
      description,
      price,
      size,
      images,
      colors,
      category,
      subcategory,
      buyingOptions
    } = req.body;

    // Parse JSON if passed as strings
    const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
    const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
    const parsedBuyingOptions =
      typeof buyingOptions === 'string' ? JSON.parse(buyingOptions) : buyingOptions;

    // Basic validation
    if (!name || !description || !price || !category) {
      return res.status(400).json({ message: 'Name, description, price, and category are required.' });
    }

    // Build product object dynamically — include only provided optional fields
    const productData = {
      tenantId: currentUser.tenantId,
      name,
      description,
      price,
      category,
      images: parsedImages,
    };

    if (size) productData.size = size;
    if (parsedColors) productData.colors = parsedColors;
    if (subcategory) productData.subcategory = subcategory;
    if (parsedBuyingOptions) productData.buyingOptions = parsedBuyingOptions;

    const newProduct = new Product(productData);
    const savedProduct = await newProduct.save();

    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc Get all products for current tenant
 */
exports.getAllProducts = async (req, res) => {
  try {
    const currentUser = req.user;
    if (!currentUser || !currentUser.tenantId) {
      return res.status(403).json({ message: 'Unauthorized or tenant not found' });
    }

    const products = await Product.find({ tenantId: currentUser.tenantId });
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc Get single product by ID
 */
exports.getProductById = async (req, res) => {
  try {
    const currentUser = req.user;
    const product = await Product.findOne({
      _id: req.params.id,
      tenantId: currentUser.tenantId,
    });

    if (!product) return res.status(404).json({ message: 'Product not found' });
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc Update product
 */
exports.updateProduct = async (req, res) => {
  try {
    const currentUser = req.user;

    const {
      name,
      description,
      price,
      size,
      images,
      colors,
      category,
      subcategory,
      buyingOptions,
    } = req.body;

    const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
    const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
    const parsedBuyingOptions =
      typeof buyingOptions === 'string' ? JSON.parse(buyingOptions) : buyingOptions;

    const updateData = {};
    if (name) updateData.name = name;
    if (description) updateData.description = description;
    if (price) updateData.price = price;
    if (size) updateData.size = size;
    if (parsedImages) updateData.images = parsedImages;
    if (parsedColors) updateData.colors = parsedColors;
    if (category) updateData.category = category;
    if (subcategory) updateData.subcategory = subcategory;
    if (parsedBuyingOptions) updateData.buyingOptions = parsedBuyingOptions;

    const updatedProduct = await Product.findOneAndUpdate(
      { _id: req.params.id, tenantId: currentUser.tenantId },
      updateData,
      { new: true }
    );

    if (!updatedProduct)
      return res.status(404).json({ message: 'Product not found or not authorized' });

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

/**
 * @desc Delete product
 */
exports.deleteProduct = async (req, res) => {
  try {
    const currentUser = req.user;

    const deletedProduct = await Product.findOneAndDelete({
      _id: req.params.id,
      tenantId: currentUser.tenantId,
    });

    if (!deletedProduct)
      return res.status(404).json({ message: 'Product not found or not authorized' });

    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
