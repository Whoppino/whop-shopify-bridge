const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const PORT = process.env.PORT || 10000;
const WHOP_API_KEY = process.env.WHOP_API_KEY ? process.env.WHOP_API_KEY.trim() : '';
const WHOP_PLAN_ID = process.env.WHOP_PLAN_ID ? process.env.WHOP_PLAN_ID.trim() : '';

// Route de vérification de l'état du serveur
app.get('/', (req, res) => {
  res.send('Server is live and running properly.');
});

// Création de la session de paiement Whop
app.post('/api/create-checkout', async (req, res) => {
  try {
    const { email, variantId } = req.body;

    const response = await axios.post(
      'https://api.whop.com/api/v5/checkout_configurations',
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

    // الرابط المباشر لصفحة الدفع من استجابة Whop v5
    const checkoutUrl = response.data?.purchase_url || response.data?.url;
    res.json({ checkout_url: checkoutUrl });
  } catch (error) {
    console.error('Checkout error:', error.response?.data || error.message);
    res.status(500).json({ error: 'Failed to create checkout session', details: error.response?.data });
  }
});

// Réception du Webhook Whop après paiement confirmé
app.post('/api/whop-webhook', async (req, res) => {
  try {
    const event = req.body;
    console.log('Whop Webhook received:', event.action);

    if (event.action === 'payment.succeeded') {
      console.log('Payment completed successfully for user:', event.data?.user?.email);
    }

    res.status(200).send('Webhook processed successfully');
  } catch (error) {
    console.error('Webhook error:', error.message);
    res.status(500).send('Webhook error');
  }
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
