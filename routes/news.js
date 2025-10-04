const express = require('express');
const router = express.Router();
const fetcher = require('../fetcher');

// GET /api/top-news
// router.get('/top-news', async (req, res) => {
//   const limit = parseInt(req.query.limit) || 20;
//   const offset = parseInt(req.query.offset) || 0;
//   const result = await fetcher.getArticles({ limit, offset });
//   res.json(result);
// });

router.get('/top-news', async (req, res) => {
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const category = req.query.category; // ✅ add this line
  const result = await fetcher.getArticles({ limit, offset, category });
  res.json(result);
});


// GET /api/category/:category
router.get('/category/:category', async (req, res) => {
  const category = req.params.category;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const result = await fetcher.getArticles({ limit, offset, category });
  res.json(result);
});

// GET /api/source/:source
router.get('/source/:source', async (req, res) => {
  const source = req.params.source;
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const result = await fetcher.getArticles({ limit, offset, source });
  res.json(result);
});

// GET /api/search?q=keyword
router.get('/search', async (req, res) => {
  const q = req.query.q || '';
  const limit = parseInt(req.query.limit) || 20;
  const offset = parseInt(req.query.offset) || 0;
  const result = await fetcher.getArticles({ limit, offset, q });
  res.json(result);
});

module.exports = router;


