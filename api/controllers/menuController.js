const Menu = require('../models/Menu');

// CREATE MENU
exports.createMenu = async (req, res) => {
  try {
    const { name, description, category, price, available, image, tenantId } = req.body;

    const menu = await Menu.create({
      name,
      description,

      category,
      price,
      available,
      image, // just store the image path/URL
      tenantId  
    });

    res.status(201).json({ success: true, menu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// GET ALL MENUS (optionally filter by tenantId)
exports.allMenu = async (req, res) => {
  try {
    // Fetch all menus
    const menus = await Menu.find().sort({ name: 1 });

    res.json({
      success: true,
      menus,
    });
  } catch (error) {
    console.error("Server error fetching menus:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// GET ONE MENU by ID
exports.getOneMenu = async (req, res) => {
  try {
    const { id } = req.params;

    const menu = await Menu.findById(id);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    res.json({ success: true, menu });
  } catch (error) {
    console.error("Server error fetching menu:", error);
    res.status(500).json({
      success: false,
      message: "Server Error",
    });
  }
};

// based on tenantId query param
exports.allMenuByTenant = async (req, res) => {
  try {
    const { tenantId } = req.body;

    // Build filter
    const filter = {};
    if (tenantId) filter.tenantId = tenantId;

    // Fetch menus from DB
    const menus = await Menu.find(filter).sort({ name: 1 });

    // If tenantId provided but no menus found
    if (tenantId && menus.length === 0) {
      return res.json({
        success: true,
        menus: null,
        message: "No menus found for this tenant.",
      });
    }

    // Return menus normally
    res.json({ success: true, menus });

  } catch (error) {
    console.error("Unexpected server error:", error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// UPDATE MENU
exports.updateMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description, category, price, available, image, tenantId } = req.body;

    const updateData = {
      name,

      description,
      category,
      price,
      available: available === 'on' || available === true,
      image, // update image path
      tenantId
    };

    const updatedMenu = await Menu.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedMenu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    res.json({ success: true, menu: updatedMenu });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// DELETE MENU
exports.deleteMenu = async (req, res) => {
  try {
    const { id } = req.params;
    const menu = await Menu.findById(id);

    if (!menu) {
      return res.status(404).json({ success: false, message: 'Menu not found' });
    }

    await menu.deleteOne();

    res.json({ success: true, message: 'Menu deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
