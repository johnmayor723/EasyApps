const Paystack = require('paystack-node');
const Tenant = require('../../models/Tenant'); // adjust path if needed
const sk = 'sk_test_caf30f565f30779a789cfed46899dad43224e36b'; // your secret key
const environment = 'test'; // must be 'test' or 'production'

const paystack = new Paystack(sk.trim(), environment);

exports.verify = async (req, res) => {
    console.log('Payment successful: now verifying');

    const ref = req.params.ref;
    let output;
    let status;

    try {
        const response = await paystack.verifyTransaction({ reference: ref });
        output = response.body.data;
        status = 200;

        console.log('Paystack response:', output);

        // ✅ Only proceed if transaction was successful
        if (output.status === 'success') {
            // Get tenantId and plan from metadata sent during payment
           // extract plan and tenantId from custom_fields
let tenantId, plan;

if (output.metadata && Array.isArray(output.metadata.custom_fields)) {
  output.metadata.custom_fields.forEach(field => {
    if (field.variable_name === 'tenant_id') tenantId = field.value;
    if (field.variable_name === 'plan') plan = field.value;
  });
}

console.log('plan is:', plan);
console.log('tenantId is:', tenantId);
            if (!tenantId || !plan) {
                console.error('Missing tenantId or plan in Paystack metadata');
            } else {
                // Update tenant in database
                const tenant = await Tenant.findOneAndUpdate(
                    { tenantId: tenantId },
                    {
                        plan: plan,
                        planStatus: 'active',
                        paystackRef: ref,
                        paidAt: new Date(),
                    },
                    { new: true } // return updated doc
                );

                if (!tenant) console.error('Tenant not found for ID:', tenantId);
                else console.log('Tenant plan updated:', tenant.plan);
            }
        } else {
            console.error('Transaction not successful:', output);
        }

    } catch (error) {
        status = 400;
        output = { status: 'failed', error };
        console.error('Paystack verification failed:', error);
    }

    // Store session info if needed
    req.session.output = output;
    req.session.status = status;

    // Redirect to dashboard
    res.redirect('/multitenant/dashboard');
};
