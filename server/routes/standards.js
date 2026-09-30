const express = require('express');
const SchoolStandard = require('../models/Standard');
const { auth, admin } = require('../middleware/auth');
const router = express.Router();

// GET /api/standards — Get standards for a school (with gender filter)
// Usage: /api/standards?school=<schoolId>&gender=boy
router.get('/', async (req, res) => {
  try {
    const { school, gender } = req.query;
    let query = { is_active: true };
    if (school) query.school_id = school;
    if (gender) query.gender = gender;

    const standards = await SchoolStandard.find(query)
      .populate('school_id', 'name logo area city');
    res.json(standards);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/standards/:id — Get standard by ID
router.get('/:id', async (req, res) => {
  try {
    const standard = await SchoolStandard.findById(req.params.id)
      .populate('school_id', 'name logo banner area city');
    if (!standard) return res.status(404).json({ message: 'Standard not found' });
    res.json(standard);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// POST /api/standards — Create standard (Admin only)
router.post('/', auth, admin, async (req, res) => {
  try {
    const standard = await SchoolStandard.create(req.body);
    res.status(201).json(standard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/standards/:id — Edit standard (Admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const standard = await SchoolStandard.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!standard) return res.status(404).json({ message: 'Standard not found' });
    res.json(standard);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
