const https = require('https');
const Parser = require('rss-parser');
const parser = new Parser({
  timeout: 20000,
  headers: {
    'User-Agent':
      'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'application/rss+xml, application/xml;q=0.9, */*;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Connection': 'keep-alive',
    'Cache-Control': 'no-cache',
  },
});

const fs = require('fs');
const path = require('path');
const { Low } = require('lowdb');
const { JSONFile } = require('lowdb/node');

const feedsPath = path.join(__dirname, 'feeds.json');
const feeds = JSON.parse(fs.readFileSync(feedsPath, 'utf8'));

const dbFile = path.join(__dirname, 'db.json');
const adapter = new JSONFile(dbFile);
const db = new Low(adapter, { articles: [] });

async function initDB() {
  await db.read();
  await db.write();
}

function extractImage(item) {
  return (
    (item.enclosure && item.enclosure.url) ||
    (item['media:content']?.['$']?.url) ||
    (item['media:thumbnail']?.url) ||
    (item.thumbnail) ||
    extractImageFromHTML(item.content || item.contentSnippet || item.description) ||
    null
  );
}

function extractImageFromHTML(html) {
  if (!html) return null;
  const match = html.match(/<img[^>]+src="?([^"\s]+)"?[^>]*>/i);
  return match ? match[1] : null;
}


function normalizeItem(item, feedMeta) {
  return {
    id: item.guid || item.link || `${feedMeta.id}-${item.title?.slice(0, 40)}`,
    title: item.title || '(no title)',
    link: item.link,
    pubDate: item.isoDate || item.pubDate || new Date().toISOString(),
    contentSnippet: item.contentSnippet || item.content || item.description || '',
    source: feedMeta.name,
    sourceId: feedMeta.id,
    category: feedMeta.category || 'general',
    fetchedAt: new Date().toISOString(),
    image: extractImage(item)
  };
}

async function fetchAllOnce() {
  await initDB();
  for (const feed of feeds) {
    try {
      console.log('Fetching from:', feed.name);
      const parsed = await parser.parseURL(feed.url, {
        agent: new https.Agent({ rejectUnauthorized: false }),
      });
      for (const item of parsed.items) {
        const article = normalizeItem(item, feed);
        const exists = db.data.articles.find(a => a.link === article.link || a.id === article.id);
        if (!exists) db.data.articles.push(article);
      }
    } catch (err) {
      console.error('Error fetching feed:', feed.name, err.message);
    }
  }

  db.data.articles.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  db.data.articles = db.data.articles.slice(0, 2000);
  await db.write();
}

async function getArticles({ limit = 50, offset = 0, source, category, q }) {
  await initDB();
  let list = db.data.articles;
  if (source) list = list.filter(a => a.sourceId === source || a.source.toLowerCase().includes(source.toLowerCase()));
  if (category) list = list.filter(a => a.category.toLowerCase() === category.toLowerCase());
  if (q) {
    const Q = q.toLowerCase();
    list = list.filter(a =>
      (a.title && a.title.toLowerCase().includes(Q)) ||
      (a.contentSnippet && a.contentSnippet.toLowerCase().includes(Q))
    );
  }
  list = list.sort((a, b) => new Date(b.pubDate) - new Date(a.pubDate));
  return { total: list.length, articles: list.slice(offset, offset + limit) };
}

module.exports = { fetchAllOnce, getArticles };
