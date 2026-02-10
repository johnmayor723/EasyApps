<script>
  document.getElementById("pay-btn").onclick = function () {
    const handler = PaystackPop.setup({
      key: "pk_test_bec2adfc8f46afff889349e2bf76e50477939d74",
      email: "<%= email %>",
      amount: <%= price %> * 100,
      currency: "NGN",
      ref: "EA_" + Date.now(),

      metadata: {
        tenantId: "<%= tenantId %>",
        plan: "<%= plan %>"
      },

      callback: function (response) {
        // UX only – NOT logic
        window.location.href =
          `/payment/processing?reference=${response.reference}`;
      },

      onClose: function () {
        alert("Payment cancelled");
      }
    });

    handler.openIframe();
  };
</script>