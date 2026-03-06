const router = require('express').Router();
const axios = require('axios');
const xml2js = require('xml2js');

// ── Namecheap API helper ───────────────────────────────────
const SANDBOX = process.env.NAMECHEAP_SANDBOX === 'true';
const NC_BASE = SANDBOX
  ? 'https://api.sandbox.namecheap.com/xml.response'
  : 'https://api.namecheap.com/xml.response';

async function ncRequest(command, extra = {}) {
  const params = {
    ApiUser:   process.env.NAMECHEAP_API_USER,
    ApiKey:    process.env.NAMECHEAP_API_KEY,
    UserName:  process.env.NAMECHEAP_API_USER,
    ClientIp:  process.env.NAMECHEAP_CLIENT_IP,
    Command:   command,
    ...extra,
  };
  const res = await axios.get(NC_BASE, { params });
  const parsed = await xml2js.parseStringPromise(res.data, { explicitArray: false });
  const root = parsed.ApiResponse;
  if (root.$.Status === 'ERROR') {
    const err = root.Errors?.Error;
    throw new Error(Array.isArray(err) ? err[0]._ : err?._ || 'Namecheap API error');
  }
  return root.CommandResponse;
}

// ── Pricing table (USD) ────────────────────────────────────
const PRICES = {
  '.com':  { buy: 12.99, rent: 2.99 },
  '.net':  { buy: 13.99, rent: 2.99 },
  '.org':  { buy: 11.99, rent: 2.49 },
  '.io':   { buy: 39.99, rent: 5.99 },
  '.co':   { buy: 24.99, rent: 4.49 },
  '.app':  { buy: 19.99, rent: 3.99 },
  '.ai':   { buy: 79.99, rent: 9.99 },
  '.ma':   { buy: 18.99, rent: 3.49 },
  '.dz':   { buy: 16.99, rent: 3.19 },
  '.tn':   { buy: 15.99, rent: 2.99 },
};

// GET /api/domains/search?query=mysite&tlds=.com,.net
router.get('/search', async (req, res) => {
  try {
    const { query, tlds = '.com,.net,.org,.io' } = req.query;
    if (!query) return res.status(400).json({ error: 'يرجى إدخال اسم النطاق.' });

    // Clean input
    const name = query.toLowerCase().replace(/[^a-z0-9-]/g, '').replace(/^-|-$/g, '');
    if (!name) return res.status(400).json({ error: 'اسم النطاق غير صالح.' });

    const tldList = tlds.split(',').map(t => t.trim().replace('.', ''));
    const domainList = tldList.map(t => `${name}.${t}`).join(',');

    // Call Namecheap
    const cmd = await ncRequest('namecheap.domains.check', { DomainList: domainList });
    const results = cmd.DomainCheckResult;
    const arr = Array.isArray(results) ? results : [results];

    const domains = arr.map(r => {
      const fullDomain = r.$.Domain.toLowerCase();
      const tld = '.' + fullDomain.split('.').slice(1).join('.');
      const price = PRICES[tld] || { buy: 14.99, rent: 3.49 };
      return {
        domain:    fullDomain,
        tld,
        available: r.$.Available === 'true',
        buyPrice:  price.buy,
        rentPrice: price.rent,
      };
    });

    res.json({ query: name, domains });
  } catch (err) {
    console.error('Domain search error:', err.message);
    // Fallback mock for development (when API keys not set)
    const { query, tlds = '.com,.net,.org,.io' } = req.query;
    const name = (query || '').toLowerCase().replace(/[^a-z0-9-]/g, '');
    const takenNames = ['google','facebook','amazon','twitter','apple','microsoft','youtube'];
    const tldList = tlds.split(',');
    const domains = tldList.map(tld => {
      const t = tld.trim();
      const price = PRICES[t] || { buy: 14.99, rent: 3.49 };
      return {
        domain: `${name}${t}`,
        tld: t,
        available: !takenNames.includes(name),
        buyPrice: price.buy,
        rentPrice: price.rent,
      };
    });
    res.json({ query: name, domains, mock: true });
  }
});

// GET /api/domains/prices
router.get('/prices', (req, res) => res.json(PRICES));

module.exports = router;
