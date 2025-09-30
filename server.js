const express = require('express');
const cors = require('cors');
const cron = require('node-cron');
const newsRoutes = require('./routes/news');
const fetcher = require('./fetcher');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api', newsRoutes);

const PORT = process.env.PORT || 4000;
app.listen(PORT, async () => {
  console.log('✅ Server listening on port', PORT);

  // initial fetch
  try {
    await fetcher.fetchAllOnce();
    console.log('📰 Initial RSS fetch complete');
  } catch (e) {
    console.error('❌ Initial fetch error:', e);
  }

  // schedule RSS fetch every 5 minutes
  cron.schedule('*/5 * * * *', async () => {
    console.log('⏰ Running scheduled RSS fetch...');
    try {
      await fetcher.fetchAllOnce();
      console.log('✅ Fetch done');
    } catch (e) {
      console.error('❌ Scheduled fetch error:', e);
    }
  });
});
