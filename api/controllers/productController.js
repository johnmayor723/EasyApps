const Product = require('../models/Product');
const PreviewProduct = require('../models/PreviewProduct');

exports.createPreviewProduct = async (req, res) => {
  try {
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

    const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
    const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;
    const parsedBuyingOptions = typeof buyingOptions === 'string' ? JSON.parse(buyingOptions) : buyingOptions;

    const newPreview = new PreviewProduct({
      name,
      description,
      price,
      size,
      images: parsedImages,
      colors: parsedColors,
      category,
      subcategory,
      buyingOptions: parsedBuyingOptions
    });

    const savedPreview = await newPreview.save();
    res.status(201).json(savedPreview);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
/*

exports.createPreviewProduct = async (req, res) => {
  try {
    const { name, description, price, size, images, colors, category, subcategory} = req.body;

    const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
    const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;

    const newPreview = new PreviewProduct({
  name: name || "",
  description: description || "",
  price: price || "",
  size: size || [],
  images: parsedImages, // Required and already validated
  colors: parsedColors || [],
  category: category || "",
  subcategory: subcategory || ""
});
    const savedPreview = await newPreview.save();
    res.status(201).json(savedPreview);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

*/
// Get all preview (staged) products
exports.getPreviewProducts = async (req, res) => {
  try {
    const previewProducts = await PreviewProduct.find().sort({ createdAt: -1 }); // optional: latest first
    res.status(200).json(previewProducts);
  } catch (error) {
    res.status(500).json({ message: 'Failed to fetch preview products', error: error.message });
  }
};


// Publish all preview products to live product model
exports.publishPreviewProducts = async (req, res) => {
  try {
    const previews = await PreviewProduct.find();

    if (previews.length === 0) {
      return res.status(400).json({ message: 'No products to publish.' });
    }

    const productsToSave = previews.map(preview => ({
      name: preview.name,
      description: preview.description,
      price: preview.price,
      size: preview.size,
      colors: preview.colors,
      images: preview.images,
      category: preview.category,
      subcategory: preview.subcategory,
      buyingOptions: preview.buyingOptions || []
    }));

    await Product.insertMany(productsToSave);
    await PreviewProduct.deleteMany();

    res.status(200).json({ message: 'Products published successfully.' });
  } catch (error) {
    res.status(500).json({ message: 'Publishing failed', error: error.message });
  }
};


// GET one draft product preview
exports.getOneProductPreview = async (req, res) => {
  try {
    const product = await PreviewProduct.findOne({ _id: req.params.id});
    if (!product) return res.status(404).json({ message: 'Product draft not found' });
    res.json(product);
  } catch (err) {
    res.status(500).json({ message: 'Error fetching product preview', error: err.message });
  }
};

// Update a preview product (staged version)
exports.updateOneProductPreview = async (req, res) => {
  try {
    const { name, description, price, size, images, colors, category, subcategory ,buyingOptions} = req.body;

    const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
    const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;

    const updatedProduct = await PreviewProduct.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        size,
        images: parsedImages,
        colors: parsedColors,
        category,
        subcategory,
        buyingOptions
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Preview product not found' });
    }

    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// DELETE a product draft
exports.deleteProductPreview = async (req, res) => {
  try {
    const product = await PreviewProduct.findOneAndDelete({ _id: req.params.id });
    if (!product) return res.status(404).json({ message: 'Product draft not found' });
    res.json({ message: 'Product draft deleted successfully' });
  } catch (err) {
    res.status(500).json({ message: 'Error deleting product preview', error: err.message });
  }
};

// Create a new product
exports.createProduct = async (req, res) => {
  try {
    const { name, description, price, size, images, colors, category, subcategory, buyingOptions } = req.body;

    // Parse images and colors if they are JSON strings
    const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
    const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;

    const newProduct = new Product({
      name,
      description,
      price,
      size,
      category,
      subcategory,
      buyingOptions,
      images: parsedImages, // Array of image URLs
      colors: parsedColors  // Array of color options
    });

    const savedProduct = await newProduct.save();
    res.status(201).json(savedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get all products
exports.getAllProducts = async (req, res) => {
  try {
    const products = await Product.find();
    res.status(200).json(products);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Get product by ID
exports.getProductById = async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(product);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Update product
exports.updateProduct = async (req, res) => {
  try {
    const { name, description, price, size, images, colors, category } = req.body;

    // Parse images and colors if they are JSON strings
    const parsedImages = typeof images === 'string' ? JSON.parse(images) : images;
    const parsedColors = typeof colors === 'string' ? JSON.parse(colors) : colors;

    const updatedProduct = await Product.findByIdAndUpdate(
      req.params.id,
      {
        name,
        description,
        price,
        size,
        category,
        subcategory,
        images: parsedImages,
        colors: parsedColors
      },
      { new: true }
    );

    if (!updatedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json(updatedProduct);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};

// Delete product
exports.deleteProduct = async (req, res) => {
  try {
    const deletedProduct = await Product.findByIdAndDelete(req.params.id);
    if (!deletedProduct) {
      return res.status(404).json({ message: 'Product not found' });
    }
    res.status(200).json({ message: 'Product deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
};
