const express = require('express');
const router = express.Router();
const Message = require('../models/Message');

// GET - Sare messages lao (room ke hisaab se)
router.get('/:room', async (req, res) => {
  try {
    const messages = await Message.find({ room: req.params.room })
      .sort({ createdAt: 1 })
      .limit(50);
    res.json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST - Naya message save karo
router.post('/', async (req, res) => {
  try {
    const { username, text, room } = req.body;
    const message = new Message({ username, text, room });
    const saved = await message.save();
    res.status(201).json(saved);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE - Message delete karo
router.delete('/:id', async (req, res) => {
  try {
    await Message.findByIdAndDelete(req.params.id);
    res.json({ message: 'Message delete ho gaya' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
