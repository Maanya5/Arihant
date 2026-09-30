const express = require('express');
const School = require('../models/School');
const SchoolStandard = require('../models/Standard');
const { auth, admin } = require('../middleware/auth');
const { getSchoolCatalogue } = require('../controllers/schoolController');
const { validateObjectId } = require('../middleware/security');
const { invalidateSchoolCache } = require('../services/cacheService');
const router = express.Router();

// GET /api/schools — List all active schools
router.get('/', async (req, res) => {
  try {
    const filter = req.query.admin === 'true' ? {} : { is_active: true };
    const schools = await School.find(filter).select('_id name area city state logo banner is_active');
    res.json(schools);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// GET /api/schools/:id — Get school by ID (Optimized with Redis Caching)
router.get('/:id', validateObjectId, getSchoolCatalogue);

// POST /api/schools — Create school (Admin only)
router.post('/', auth, admin, async (req, res) => {
  try {
    const school = await School.create(req.body);
    res.status(201).json(school);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// PUT /api/schools/:id — Edit school (Admin only)
router.put('/:id', auth, admin, async (req, res) => {
  try {
    const school = await School.findByIdAndUpdate(req.params.id, req.body, { new: true });
    if (!school) return res.status(404).json({ message: 'School not found' });
    
    await invalidateSchoolCache(school._id);
    res.json(school);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// DELETE /api/schools/:id — Delete school and its standards/products (Admin only)
router.delete('/:id', auth, admin, validateObjectId, async (req, res) => {
  try {
    const school = await School.findByIdAndDelete(req.params.id);
    if (!school) return res.status(404).json({ message: 'School not found' });
    
    // Also delete associated standards and products
    await SchoolStandard.deleteMany({ school_id: req.params.id });
    await Product.deleteMany({ school_id: req.params.id });
    
    await invalidateSchoolCache(req.params.id);
    res.json({ success: true, message: 'School and associated catalog elements deleted successfully.' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
