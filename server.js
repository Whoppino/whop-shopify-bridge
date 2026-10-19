const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const WHOP_API_KEY = process.env.WHOP_API_KEY ? process.env.WHOP_API_KEY.trim() : '';
const WHOP_PLAN_ID = process.env.WHOP_PLAN_ID ? process.env.WHOP_PLAN_ID.trim() : '';

app.get('/', (req, res) => {
  res.send('Server is live and running properly.');
});

app.post('/api/create-checkout', async (req, res) => {
  try {
    const { email, variantId } = req.body;

    const response = await axios.post(
      'https://api.whop.com/api/v5/checkout_sessions',
      {
        plan_id: WHOP_PLAN_ID,
        metadata: {
          email: email || '',
          variant_id: variantId || ''
        }
      },
      {
        headers: {
          'Authorization': `Bearer ${WHOP_API_KEY}`,
          'Content-Type': 'application/json'
        }
      }
    );

    const checkoutUrl = response.data?.url || response.data?.checkout_url || response.data?.purchase_url;
    res.json({ checkout_url: checkoutUrl });
  } catch (error) {
    console.error('API Error, switching to direct checkout link:', error.response?.data || error.message);

    const fallbackUrl = `https://whop.com/checkout/${WHOP_PLAN_ID}`;
    res.json({ checkout_url: fallbackUrl });
  }
});

app.post('/api/whop-webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Whop Webhook received:', event.action);
    res.status(200).send('Webhook processed');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).send('Webhook error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
