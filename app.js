const express = require('express');
const path = require('path');
const exphbs = require('express-handlebars');
require('dotenv').config();
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY)

var app = express();

// view engine setup (Handlebars)
app.engine('hbs', exphbs({
  defaultLayout: 'main',
  extname: '.hbs'
}));
app.set('view engine', 'hbs');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true }))
app.use(express.json({}));

/**
 * Home route
 */
app.get('/', function(req, res) {
  res.render('index');
});

/**
 * Book Prices Reference for Posting Payment Intent
 */

const bookPrices = {
  '1': 2300,
  '2': 2500,
  '3': 2800
};

/**
 * Step 1: Display Checkout route
 */
app.get('/checkout', function(req, res) {
  // Just hardcoding amounts here to avoid using a database
  const item = req.query.item;
  let title, amount, error;

  switch (item) {
    case '1':
      title = "The Art of Doing Science and Engineering"
      amount = 2300      
      break;
    case '2':
      title = "The Making of Prince of Persia: Journals 1985-1993"
      amount = 2500
      break;     
    case '3':
      title = "Working in Public: The Making and Maintenance of Open Source"
      amount = 2800  
      break;     
    default:
      // Included in layout view, feel free to assign error
      error = "No item selected"      
      break;
  }
  res.render('checkout', {
    title: title,
    amount: amount,
    error: error
  });
});

/** 
 * Step 2: Calculate order amount and currency without creating a PaymentIntent
*/
app.post("/calculate-order", async (req, res) => {
  try {
   
   // Read the selected book ID from the URL
    const item = req.query.item;

    // Check for Book Prices
    const amount = bookPrices[item];
    
    res.send({ amount, currency: "sgd" });
  } catch {
    res.status(500).send({ error: "Unable to calculate the order." });
  }
});


/** 
 * Step 3: Create a PaymentIntent and send the client secret to the client
*/

app.post("/create-payment-intent", async (req, res) => {
  try {
    // Read the selected book ID from the URL
    const item = req.query.item;

    // Check for Book Prices
    const amount = bookPrices[item];

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount: amount,
      currency: "sgd",

      // In the latest version of the API, specifying the `automatic_payment_methods` parameter is optional because Stripe enables its functionality by default.
      automatic_payment_methods: {
        enabled: true,
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch {
    res.status(500).send({ error: "Unable to start the payment." });
  }
});

/**
 * Success route
 */
app.get('/success', function(req, res) {
  res.render('success');
});

/**
 * Start server
 */
app.listen(3000, () => {
  console.log('Getting served on port 3000');
});