const express = require('express');
const Address = require('../models/Address');
const { auth } = require('../middleware/auth');
const router = express.Router();

// Get all addresses for the logged-in user
router.get('/', auth, async (req, res) => {
  try {
    const addresses = await Address.find({ user: req.user.id });
    res.json(addresses);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Create address
router.post('/', auth, async (req, res) => {
  try {
    const address = await Address.create({ ...req.body, user: req.user.id });
    res.status(201).json(address);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Update address
router.put('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOneAndUpdate(
      { _id: req.params.id, user: req.user.id },
      req.body,
      { new: true }
    );
    if (!address) return res.status(404).json({ message: 'Address not found' });
    res.json(address);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete address
router.delete('/:id', auth, async (req, res) => {
  try {
    const address = await Address.findOneAndDelete({ _id: req.params.id, user: req.user.id });
    if (!address) return res.status(404).json({ message: 'Address not found' });
    res.json({ message: 'Address deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
