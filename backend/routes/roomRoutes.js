const express = require('express');
const router = express.Router();

// Available rooms list
const rooms = ['general', 'gaming', 'music', 'tech', 'random'];

// GET - Saare rooms lao
router.get('/', (req, res) => {
  res.json(rooms);
});

module.exports = router;
