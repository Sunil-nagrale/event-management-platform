const nodemailer = require('nodemailer');

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('Email credentials not configured. Emails will be logged to console.');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: process.env.EMAIL_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.EMAIL_PORT, 10) || 587,
    secure: false,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS
    }
  });

  return transporter;
};

const sendEmail = async ({ to, subject, html, text }) => {
  const mailOptions = {
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
    text: text || html.replace(/<[^>]*>/g, '')
  };

  const transport = getTransporter();

  if (!transport) {
    console.log('--- EMAIL (dev mode) ---');
    console.log(`To: ${to}`);
    console.log(`Subject: ${subject}`);
    console.log(`Body: ${text || 'HTML email'}`);
    console.log('------------------------');
    return { success: true, dev: true };
  }

  try {
    await transport.sendMail(mailOptions);
    return { success: true };
  } catch (error) {
    console.error('Email send error:', error.message);
    return { success: false, error: error.message };
  }
};

const sendWelcomeEmail = async (user) => {
  return sendEmail({
    to: user.email,
    subject: 'Welcome to EventHub!',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Welcome to EventHub, ${user.firstName}!</h2>
        <p>Thank you for joining our event management platform.</p>
        <p>Discover amazing events, book tickets, and manage your registrations all in one place.</p>
        <a href="${process.env.APP_URL}/events" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Browse Events</a>
        <p style="color: #666; margin-top: 24px;">Happy event hunting!</p>
      </div>
    `
  });
};

const sendRegistrationConfirmation = async (user, event, booking) => {
  return sendEmail({
    to: user.email,
    subject: `Registration Confirmed: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Registration Confirmed!</h2>
        <p>Hi ${user.firstName},</p>
        <p>You have successfully registered for <strong>${event.title}</strong>.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0;">
          <p><strong>Ticket Number:</strong> ${booking.ticketNumber}</p>
          <p><strong>Date:</strong> ${new Date(event.dateTime.start).toLocaleString()}</p>
          <p><strong>Venue:</strong> ${event.location.venue}, ${event.location.city}</p>
        </div>
        <a href="${process.env.APP_URL}/user/bookings" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">View My Bookings</a>
      </div>
    `
  });
};

const sendTicketConfirmation = async (user, event, booking, payment) => {
  return sendEmail({
    to: user.email,
    subject: `Your Ticket: ${event.title}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Payment Successful - Your Ticket</h2>
        <p>Hi ${user.firstName},</p>
        <p>Your payment of ₹${payment.amount} for <strong>${event.title}</strong> was successful.</p>
        <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; margin: 16px 0; border-left: 4px solid #6366f1;">
          <p><strong>Ticket Number:</strong> ${booking.ticketNumber}</p>
          <p><strong>Payment ID:</strong> ${payment.razorpayPaymentId}</p>
          <p><strong>Date:</strong> ${new Date(event.dateTime.start).toLocaleString()}</p>
          <p><strong>Venue:</strong> ${event.location.venue}, ${event.location.city}</p>
          <p><strong>Amount Paid:</strong> ₹${payment.amount}</p>
        </div>
        <p>Please present this ticket number at the event entrance.</p>
      </div>
    `
  });
};

const sendPasswordResetEmail = async (user, resetUrl) => {
  return sendEmail({
    to: user.email,
    subject: 'Password Reset Request',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #6366f1;">Password Reset</h2>
        <p>Hi ${user.firstName},</p>
        <p>You requested a password reset. Click the button below to set a new password:</p>
        <a href="${resetUrl}" style="display: inline-block; padding: 12px 24px; background: #6366f1; color: white; text-decoration: none; border-radius: 6px;">Reset Password</a>
        <p style="color: #666; margin-top: 24px;">This link expires in 1 hour. If you didn't request this, ignore this email.</p>
      </div>
    `
  });
};

module.exports = {
  sendEmail,
  sendWelcomeEmail,
  sendRegistrationConfirmation,
  sendTicketConfirmation,
  sendPasswordResetEmail
};
