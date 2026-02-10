const express = require("express");
const router = express.Router();
const axios = require('axios');
const Order =  require("../models/Order")
const nodemailer = require('nodemailer');
const {generateOrderEmailHTML} = require('../helpers')


const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: 'fooddeck3@gmail.com',
        pass: 'xyca sbvx hifi amzs'  // Replace with actual password
    }
});


function formatCart(sessionCart) {
    const formattedItems = [];

    if (!sessionCart || !sessionCart.items) {
        return {
            items: [],
            totalAmount: 0,
            totalQty: 0
        };
    }

    for (let id in sessionCart.items) {
        const cartItem = sessionCart.items[id];

        formattedItems.push({
            productId: id,
            name: cartItem.item.name,
            qty: cartItem.qty,
            price: cartItem.price,
            size: cartItem.size || null,
            color: cartItem.color || null,
            total: cartItem.price * cartItem.qty
        });
    }

    return {
        items: formattedItems,
        totalAmount: sessionCart.totalAmount || 0,
        totalQty: sessionCart.totalQty || 0
    };
}

// Payment page route
router.post('/', (req, res, next) => {
    const amount = req.body.amount
    console.log('amount to be paid:', amount)
  if (!req.session.cart) {
    return res.render('cart', {cart, title: "Shopping Cart" });
  }
  
  res.render('checkout', { 
    amount,
    title: "Payment Page" 
  });
});

//givin this url: https://fooddeck-web.onrender.com/payments/callback?trxref=joo7tyhe5o&reference=joo7tyhe5o


router.post('/charge',  function(req, res, next) {
  
  if (!req.session.cart) {
      return res.redirect('/cart');
  }
  console.log(req.body)
  var cart = req.session.cart;
  const cartContents = formatCart(cart);
  var totalAmount = cart.totalAmount;
  console.log("cart found:", cart)
  console.log("Total amount is:", totalAmount)
  let sk  = "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"
  var stripe = require("stripe")("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")

  stripe.charges.create({
      amount: totalAmount * 100 ,
      currency: "gbp",
      source: req.body.token, // obtained with Stripe.js
      description: "Test Charge"
  }, function(err, charge) {
      if (err) {
          req.flash('error', err.message);
          console.log("error", err)
          return res.redirect('/cart');
      }
      var order = new Order({
         // user: req.user
          cart: cart,
          address: req.body.address,
          name: req.body.name,
          paymentId: charge.id,
          phone: req.body.phone,
          email: req.body.email
      });
      sendMail(cartContents)
      order.save(function(err, result) {
          req.flash('success', 'Successfully bought product!');
          req.session.cart = null;
          res.redirect('/');
      });
  }); 
});



router.get('/callback', async (req, res) => {
    try {
        // Extracting trxref and reference from query parameters
        const trxref = req.query.trxref;
        const ref = req.query.reference;

        if (trxref || ref) {
            console.log("Transaction reference (trxref):", trxref);
            console.log("Payment reference (reference):", ref);
            res.render("success", { title: "Successful Payment Page" });
        } else {
            console.log("No transaction data received");
            res.render("success", { title: "Successful Payment Page" });
        }
        
    } catch (error) {
        console.error('Error handling the callback:', error);
        res.status(500).json({
            message: 'An error occurred while processing your order.',
            error: error.message,
        });
    }
});

/*router.post('/charge',  function(req, res, next) {
  
  if (!req.session.cart) {
      return res.redirect('/products');
  }
  var cart = new Cart(req.session.cart);
  const cartContents = formatCart(req.session.cart);
  var stripe = require("stripe")(process.env.STRIPE_SECRET );

  stripe.charges.create({
      amount: cart.totalPrice * 100 * 1.18,
      currency: "gbp",
      source: req.body.token, // obtained with Stripe.js
      description: "Test Charge"
  }, function(err, charge) {
      if (err) {
          req.flash('error', err.message);
          return res.redirect('/charge');
      }
      var order = new Order({
         // user: req.user
          cart: cart,
          address: req.body.address,
          name: req.body.name,
          paymentId: charge.id
      });
      sendMail(cartContents)
      order.save(function(err, result) {
          req.flash('success', 'Successfully bought product!');
          req.session.cart = null;
          res.redirect('/');
      });
  }); 
});*/

router.post('/process', async (req, res) => {
    console.log(req.body); // Logging the incoming request body for debugging
     const cart = req.session.cart;
    // Paystack keys
    const PAYSTACK_SECRET_KEY = 'sk_test_d754fb2a648e8d822b09aa425d13fc62059ca08e';

    const { name, address, mobile, email, ordernotes, amount, paymentmethod } = req.body;
    

    
const orderPayload = {
        name,
        address,
        mobile,
        email,
        ordernotes,
        amount,
        paymentmethod,
        status: 'processing'//Default order status
    
    
};
    
const userEmailOptions = {
    from: '"FoodDeck" <fooddeck3@gmail.com>', // Display name with email in brackets
    to: email,
    subject: 'Order Confirmation - FoodDeck',
    html: generateOrderEmailHTML(cart, orderPayload)
};

const adminEmailOptions = {
    from: '"FoodDeck" <fooddeck3@gmail.com>',
    to: 'fooddeck3@gmail.com',
    subject: 'New Order Notification - FoodDeck',
    html: generateOrderEmailHTML(cart, orderPayload, true)
};

    // Prepare the order payload
    

    // Check if the payment method is 'cashondelivery'
    if (paymentmethod === 'cashondelivery') {
        console.log('Order Successful: Payment method is "Cash on Delivery".');
        
        try {
            // Post order to external server
            const orderResponse = await axios.post(
                'http://62.113.200.64:3060/api/orders',
                orderPayload
            );
            console.log(orderResponse.data);  // Logging the response data
          // Send emails
                await transporter.sendMail(userEmailOptions);
                await transporter.sendMail(adminEmailOptions);

            // Clear the cart and redirect to success page
            req.session.cart = null;  
            req.flash('success_msg', 'Order placed successfully with cash on delivery!');
            return res.redirect('/');
        } catch (error) {
            console.error('Error posting order to external server:', error);
            req.flash('error_msg', 'Order processing failed. Please try again.');
            return res.redirect('/cart');
        }
    }

    // Proceed with Paystack payment if the method is not 'cashondelivery'
    const paystackData = {
        email,  
        amount: amount * 100,  // Amount in kobo
        callback_url: 'https://62.113.200.64:3060/payments/callback'
    };

    try {
        // Initialize payment with Paystack
        const response = await axios.post(
            'https://api.paystack.co/transaction/initialize',
            paystackData,
            {
                headers: {
                    Authorization: `Bearer ${PAYSTACK_SECRET_KEY}`,  
                },
            }
        );

        console.log(response.data);

        // Check if Paystack response was successful
        if (response.data.status) {  // Truthy check for status
            const authorizationUrl = response.data.data.authorization_url;

            try {
                // Post order to external server
                const orderResponse = await axios.post(
                    'http://62.113.200.64:3060/api/orders',
                    orderPayload
                );
                console.log(orderResponse.data);  // Logging the response data
                 req.session.cart = null;  
     // Send emails
                await transporter.sendMail(userEmailOptions);
                await transporter.sendMail(adminEmailOptions);

                // Redirect user to Paystack payment page
                return res.redirect(authorizationUrl);
            } catch (error) {
                console.error('Error posting order to external server:', error);
                req.flash('error_msg', 'Order processing failed. Please try again.');
                return res.redirect('/cart');
            }
        } else {
            req.flash('error_msg', 'Payment initialization failed. Please try again.');
            return res.redirect('/cart'); 
        }
    } catch (error) {
        console.error('Error initializing payment with Paystack:', error);  
        req.flash('error_msg', 'Payment processing failed. Please try again.');
        return res.redirect('/cart');
    }
});



module.exports = router;
