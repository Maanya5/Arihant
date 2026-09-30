const express = require('express');
const mongoose = require('mongoose');
const Product = require('../models/Product');
const School = require('../models/School');
const router = express.Router();

// Simple in-memory cache for search (lightweight alternative to Redis for this endpoint)
let searchCache = {};
const CACHE_TTL = 120 * 1000; // 120 seconds

/**
 * GET /api/search?q=:query&limit=5
 * Full-text search across products + school names for autocomplete
 */
router.get('/', async (req, res) => {
  try {
    const { q = '', limit = 5 } = req.query;
    const query = q.trim();

    if (!query || query.length < 2) {
      return res.json({ items: [], schools: [] });
    }

    // Check in-memory cache
    const cacheKey = `search:${query.toLowerCase()}`;
    const cached = searchCache[cacheKey];
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      res.setHeader('X-Cache', 'HIT');
      return res.json(cached.data);
    }

    const limitNum = Math.min(parseInt(limit) || 5, 20);

    // Run product text search + school name search in parallel
    const [items, schools] = await Promise.all([
      Product.find(
        { $text: { $search: query }, is_active: true },
        { score: { $meta: 'textScore' } }
      )
        .sort({ score: { $meta: 'textScore' } })
        .limit(limitNum)
        .populate('school_id', 'name city')
        .populate('standard_id', 'class_name gender')
        .lean(),

      School.find({
        name: { $regex: query, $options: 'i' },
        is_active: true
      })
        .limit(4)
        .select('name city logo')
        .lean()
    ]);

    const data = { items, schools };

    // Cache result
    searchCache[cacheKey] = { data, ts: Date.now() };
    // Prune old cache keys periodically
    if (Object.keys(searchCache).length > 200) {
      const now = Date.now();
      searchCache = Object.fromEntries(
        Object.entries(searchCache).filter(([, v]) => now - v.ts < CACHE_TTL)
      );
    }

    res.setHeader('X-Cache', 'MISS');
    res.json(data);
  } catch (error) {
    console.error('[Search] Error:', error.message);
    res.status(500).json({ message: 'Search failed. Please try again.' });
  }
});

module.exports = router;
