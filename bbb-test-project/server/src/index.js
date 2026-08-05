require('dotenv').config();
const express = require('express');
const cors = require('cors');
const meetings = require('./routes/meetings');

const app = express();
app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => res.json({ ok: true }));
app.use('/api/meetings', meetings);

// Self-contained BBB mock so the project runs without a real BBB server.
if (process.env.BBB_MOCK === 'true') {
  app.use('/bbb-mock/api', require('./mockBbb'));
}

// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err.message);
  res.status(500).json({ error: err.message });
});

const port = process.env.PORT || 3000;
if (require.main === module) {
  app.listen(port, () => {
    console.log(`API listening on :${port} (BBB_MOCK=${process.env.BBB_MOCK})`);
  });
}

module.exports = app;
