const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// GET: Fetch all blogs
router.get('/', async (req, res) => {
    try {
        const blogs = await Blog.find().sort({ createdAt: -1 });
        res.json({ success: true, blogs });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching blogs' });
    }
});

// POST: Create new blog
router.post('/', async (req, res) => {
    const { 
        title, image, intro, author, 
        para1, para2, para3, para4, para5, para6, para7, para8, para9, para10, 
        para11, para12, para13, para14, para15, para16, para17, para18, para19, para20 
    } = req.body;

    // Ensure all required fields are provided
    if (
        !title || !image || !intro || !author ||
        !para1 || !para2 || !para3 || !para4 || !para5 || !para6 || !para7 || !para8 || !para9 || !para10 ||
        !para11 || !para12 || !para13 || !para14 || !para15 || !para16 || !para17 || !para18 || !para19 || !para20
    ) {
        return res.status(400).json({ success: false, message: 'All fields are required' });
    }

    try {
        const blog = await Blog.create({
            title, image, intro, author,
            para1, para2, para3, para4, para5, para6, para7, para8, para9, para10, 
            para11, para12, para13, para14, para15, para16, para17, para18, para19, para20
        });

        res.json({ success: true, message: 'Blog created successfully', blog });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error creating blog' });
    }
});

// GET: Fetch a single blog
router.get('/:id', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.id);
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }
        res.json({ success: true, blog });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error fetching blog' });
    }
});
// // PUT: Update a blog
router.put('/update/:id', async (req, res) => {
    const { 
        title, image, intro, author, 
        para1, para2, para3, para4, para5, para6, para7, para8, para9, para10, 
        para11, para12, para13, para14, para15, para16, para17, para18, para19, para20 
    } = req.body;

    try {
        const blog = await Blog.findByIdAndUpdate(
            req.params.id, 
            { 
                title, image, intro, author,
                para1, para2, para3, para4, para5, para6, para7, para8, para9, para10, 
                para11, para12, para13, para14, para15, para16, para17, para18, para19, para20 
            }, 
            { new: true } // Return updated document
        );

        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.json({ success: true, message: 'Blog updated successfully', blog });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Error updating blog' });
    }
});

// DELETE: Remove a blog
router.delete('/delete/:id', async (req, res) => {
    try {
        const blog = await Blog.findByIdAndDelete(req.params.id);
        
        if (!blog) {
            return res.status(404).json({ success: false, message: 'Blog not found' });
        }

        res.json({ success: true, message: 'Blog deleted successfully' });

    } catch (error) {
        console.error('Error deleting blog:', error);
        res.status(500).json({ success: false, message: 'Error deleting blog' });
    }
});

//module.exports = router;
module.exports = router;
