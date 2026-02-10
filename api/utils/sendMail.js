const nodemailer = require("nodemailer");

let testAccountPromise = nodemailer.createTestAccount(); // create one test account globally

// Utility function to send OTP email
const sendEmail = async (to, subject, text, html) => {
  const testAccount = await testAccountPromise;

  const transporter = nodemailer.createTransport({
    host: testAccount.smtp.host,
    port: testAccount.smtp.port,
    secure: testAccount.smtp.secure,
    auth: {
      user: testAccount.user,
      pass: testAccount.pass,
    },
  });

  const info = await transporter.sendMail({
    from: '"EasyApps Dev" <no-reply@easyapps.com>',
    to,
    subject,
    text,
    html: html || `<p>${text}</p>`, // fallback if no html
  });

  console.log("✅ Email sent!");
  console.log("Message ID:", info.messageId);
  console.log("Preview URL:", nodemailer.getTestMessageUrl(info));
};

module.exports = sendEmail;
