document.addEventListener('DOMContentLoaded', function () {

  const payBtn = document.getElementById('pay-btn');

  payBtn.addEventListener('click', function () {
    const email = payBtn.dataset.email;
    const amount = payBtn.dataset.amount;
    const plan = payBtn.dataset.plan;
    const tenantId = payBtn.dataset.tenant;

    payWithPaystack(email, amount, plan, tenantId);
  });

  function verify(ref) {
    axios.post(`/paystack/verify/${ref}`)
      .then(() => {
        window.location.href = '/paystack/confirmation';
      })
      .catch(() => {
        window.location.href = '/paystack/confirmation';
      });
  }

  function payWithPaystack(email, amount, plan, tenantId) {
    const reference = `EA_${Date.now()}`;

    let handler = PaystackPop.setup({
      key: 'pk_test_bec2adfc8f46afff889349e2bf76e50477939d74', // Public key
      email: email,
      currency: 'NGN',
      amount: amount * 100,
      ref: reference,
      metadata: {
        custom_fields: [
          {
            display_name: "Plan",
            variable_name: "plan",
            value: plan
          },
          {
            display_name: "Tenant ID",
            variable_name: "tenant_id",
            value: tenantId
          }
        ]
      },
      callback: function (response) {
        verify(response.reference);
      },
      onClose: function () {
        console.log('Payment window closed');
      }
    });

    handler.openIframe();
  }
});
