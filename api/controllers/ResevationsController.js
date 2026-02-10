const Reservations = require('../models/Resevations');
const nodemailer = require('nodemailer');

// 🔧 Mail transport (Zoho or replace with another SMTP)

/*
var transporter = nodemailer.createTransport({
    host: "smtp.zeptomail.com",
    port: 587,
    auth: {
    user: "emailapikey",
    pass: "wSsVR610qxD5WKkpn2f/Lro7mFhTDlqiHE5/3FD3un6uTPHCpcdqwhbOVlKuHvAaGTVrEzUToLl/kUgIhzJdhtguzAxTXSiF9mqRe1U4J3x17qnvhDzKW2tdlRKAJYgBwgxsmWBkE8wm+g=="
    }
});

// Verify SMTP connection
transporter.verify((error, success) => {
  if (error) {
    console.error("❌ SMTP VERIFY FAILED:", error);
  } else {
    console.log("✅ SMTP READY");
  }
});*/




const transport = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 465,
  secure: true,
  auth: {
    user: 'modigitman@gmail.com',
    pass: 'muwroruzgboqdfcd',
  }
});

transport.verify((err, success) => {
  if (err) console.log("❌ SMTP VERIFY FAILED:", err);
  else console.log("✅ SMTP Verified: Ready to send emails");
});

// ✉️ Utility: Send email
const sendEmail = async (to, subject, text) => {
  await transport.sendMail({
    from: `"EasyApps" <modigitman@gmail.com>`,
    to,
    subject,
    text,
  });
};


// ------------------- CREATE RESERVATION -------------------



exports.createReservation = async (req, res) => {
  try {
    const {
      tenantId,
      full_name,
      email,
      phone,
      party_size,
      date,
      time,
      special_requests
    } = req.body;

    if (!tenantId) {
      return res.status(400).json({
        success: false,
        message: 'Tenant ID is required'
      });
    }

    /* -------------------------
       1️⃣ CREATE RESERVATION
    -------------------------- */
    const reservation = await Reservations.create({
      tenantId,
      full_name,
      email,
      phone,
      party_size,
      date: new Date(date), // ensure Date object
      time,
      special_requests: special_requests || '',
      status: 'confirmed'
    });

    /* -------------------------
       2️⃣ SEND CONFIRMATION EMAIL
    -------------------------- */
    await sendEmail(
      email,
      'Reservation Confirmed 🍽️',
      `
        <h2>Reservation Confirmed</h2>
        <p>Hi ${full_name},</p>

        <p>Your reservation has been <strong>received and confirmed</strong>.</p>

        <ul>
          <li><strong>Date:</strong> ${new Date(date).toDateString()}</li>
          <li><strong>Time:</strong> ${time}</li>
          <li><strong>Party Size:</strong> ${party_size}</li>
        </ul>

        ${
          special_requests
            ? `<p><strong>Special Requests:</strong> ${special_requests}</p>`
            : ''
        }

        <p>We look forward to hosting you.</p>
        <p>— The Restaurant Team</p>
      `
    );

    /* -------------------------
       3️⃣ API RESPONSE
    -------------------------- */
    return res.status(201).json({
      success: true,
      message: 'Reservation created successfully',
      reservation
    });

  } catch (error) {
    console.error('Create reservation error:', error);

    return res.status(500).json({
      success: false,
      message: error.message || 'Server error while creating reservation'
    });
  }
};

// ------------------- GET ALL RESERVATIONS -------------------
exports.getAllReservations = async (req, res) => {
  try {
    const reservations = await Reservations.find().sort({ date: -1, time: 1 });

    res.status(200).json({
      success: true,
      reservations,
    });
  } catch (err) {
    console.error("Get all reservations error:", err);
    res.status(500).json({
      success: false,
      message: "Server error fetching reservations",
    });
  }
};
// ------------------- GET ALL RESERVATIONS FOR A TENANT -------------------
exports.getReservationsByTenant = async (req, res) => {
  try {
    const { tenantId } = req.params;

    if (!tenantId) {
      return res.status(400).json({ success: false, message: 'Tenant ID is required' });
    }

    const reservations = await Reservations.find({ tenantId }).sort({ date: 1, time: 1 });

    res.json({ success: true, reservations });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ------------------- GET ONE RESERVATION -------------------
exports.getReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservations.findById(id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    res.json({ success: true, reservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ------------------- UPDATE RESERVATION -------------------
exports.updateReservation = async (req, res) => {
  try {
    const { id } = req.params;
    const { customerName, phone, date, time, guests, table, notes, confirmed } = req.body;

    const updateData = {
      customerName,
      phone,
      date,
      time,
      guests,
      table: table || null,
      notes: notes || '',
      confirmed: confirmed === true || confirmed === 'on' || false,
    };

    const updatedReservation = await Reservations.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedReservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    res.json({ success: true, reservation: updatedReservation });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};

// ------------------- DELETE RESERVATION -------------------
exports.deleteReservation = async (req, res) => {
  try {
    const { id } = req.params;

    const reservation = await Reservations.findById(id);

    if (!reservation) {
      return res.status(404).json({ success: false, message: 'Reservation not found' });
    }

    await reservation.deleteOne();

    res.json({ success: true, message: 'Reservation deleted successfully' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Server Error' });
  }
};
