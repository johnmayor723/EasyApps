const Paystack = require('paystack-node');
const Tenant = require('../../models/Tenant');
const nodemailer = require('nodemailer');

const sk = 'sk_test_caf30f565f30779a789cfed46899dad43224e36b';
const environment = 'test';

const paystack = new Paystack(sk.trim(), environment);

// Configure transporter (Use real SMTP credentials in production)
const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: 587,
    secure: false,
    auth: {
        user: 'modigitman@gmail.com',
        pass: 'muwroruzgboqdfcd',
    }
});

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

        if (output.status === 'success') {

            // Extract tenantId and plan from metadata
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
                console.error('Missing tenantId or plan in metadata');
            } else {

                const tenant = await Tenant.findOneAndUpdate(
                    { tenantId: tenantId },
                    {
                        plan: plan,
                        planStatus: 'active',
                        paystackRef: ref,
                        paidAt: new Date(),
                    },
                    { new: true }
                );

                if (!tenant) {
                    console.error('Tenant not found for ID:', tenantId);
                } else {
                    console.log('Tenant plan updated:', tenant.plan);

                    // -----------------------------
                    // SEND EMAILS
                    // -----------------------------

                    const clientEmail = tenant.owner?.email;

                    const clientMailOptions = {
                        from: `EasyHostNet <${process.env.SMTP_USER}>`,
                        to: clientEmail,
                        subject: 'Payment Successful - Plan Activated',
                        html: `
                            <h2>Payment Successful 🎉</h2>
                            <p>Dear ${tenant.owner?.name || 'Customer'},</p>
                            <p>Your payment was successful and your <strong>${plan}</strong> plan has been activated.</p>
                            <p><strong>Reference:</strong> ${ref}</p>
                            <p>Thank you for choosing EasyHostNet.</p>
                        `
                    };

                    const adminMailOptions = {
                        from: `EasyHostNet System <${process.env.SMTP_USER}>`,
                        to: 'info@easyhostnet.com',
                        subject: 'New Payment Received',
                        html: `
                            <h2>New Payment Notification</h2>
                            <p><strong>Tenant ID:</strong> ${tenantId}</p>
                            <p><strong>Plan:</strong> ${plan}</p>
                            <p><strong>Reference:</strong> ${ref}</p>
                            <p><strong>Amount:</strong> ${output.amount / 100}</p>
                            <p><strong>Email:</strong> ${clientEmail}</p>
                        `
                    };

                    // Send emails
                    if (clientEmail) {
                        await transporter.sendMail(clientMailOptions);
                        console.log('Client email sent');
                    }

                    await transporter.sendMail(adminMailOptions);
                    console.log('Admin email sent');
                }
            }

        } else {
            console.error('Transaction not successful:', output);
        }

    } catch (error) {
        status = 400;
        output = { status: 'failed', error };
        console.error('Paystack verification failed:', error);
    }

    req.session.output = output;
    req.session.status = status;

    res.redirect('/multitenant/dashboard');
};