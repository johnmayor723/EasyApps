const express = require('express');
const router = express.Router();
const Blog = require('../models/Blog');

// Add a comment to a blog post
router.post('/:blogId', async (req, res) => {
    try {
        const { name, email, content } = req.body;
        const blog = await Blog.findById(req.params.blogId);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        const newComment = { name, email, content };
        blog.comments.push(newComment);
        await blog.save();

        res.status(201).json({ message: 'Comment added', comment: newComment });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

// Delete a comment from a blog post
router.delete('/:BlogId/:commentId', async (req, res) => {
    try {
        const blog = await Blog.findById(req.params.blogId);

        if (!blog) {
            return res.status(404).json({ message: 'Blog not found' });
        }

        // Filter out the comment to be deleted
        blog.comments = blog.comments.filter(comment => comment._id.toString() !== req.params.commentId);

        await blog.save();
        res.status(200).json({ message: 'Comment deleted' });
    } catch (error) {
        res.status(500).json({ message: 'Server error', error });
    }
});

module.exports = router;