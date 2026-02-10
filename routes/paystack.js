const express = require("express");
const fetch = require("axios");
const router = express.Router();

router.get("/processing/:reference", async (req, res) => {
  const { reference } = req.params;

  try {
       const response = await axios.get(
        `https://api.paystack.co/transaction/verify/${reference}`,
        {
          headers: {
            Authorization: `Bearer ${process.env.PAYSTACK_SK}`,
          },
        }
      );

      const data = response.data;

    if (data.status && data.data.status === "success") {
      // Payment completed ✅
      // Here you can save to DB, mark user's plan as paid, etc.
      const email = data.data.customer.email
      console.log(reference, email )
      return res.render("multitenant/payment-success", { reference, email: data.data.customer.email });
    } else {
      return res.render("payment-failed", { reference });
    }
  } catch (err) {
    console.error(err);
    res.status(500).send("Payment verification failed");
  }
});

module.exports = router;
