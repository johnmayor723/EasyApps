const express = require('express');
const router = express.Router();
const menuController = require('../controllers/menuController');

router.get('/', menuController.allMenu);
router.post('/menus-by-tenant', menuController.allMenuByTenant);
router.get('/:id', menuController.getOneMenu);
router.post('/create-menu', menuController.createMenu);
//router.get('/', menuController.allMenu);
router.put('/edit-menu/:id', menuController.updateMenu);
router.delete('/delete-menu/:id', menuController.deleteMenu);

module.exports = router;
