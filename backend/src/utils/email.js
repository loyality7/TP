import nodemailer from 'nodemailer';
import config from '../config/config.js';

// Create a transporter using SMTP settings from config
const transporter = nodemailer.createTransport({
  host: config.email.host,
  port: config.email.port,
  secure: config.email.secure,
  auth: {
    user: config.email.user,
    pass: config.email.password,
  },
});

export const sendTestInvitation = async (email, test, validUntil) => {
  try {
    const testLink = `${config.frontendUrl}/test/${test.uuid}`;
    const expiryDate = new Date(validUntil).toLocaleDateString();

    const mailOptions = {
      from: config.email.from,
      to: email,
      subject: `Invitation to take test: ${test.title}`,
      html: `
        <h2>You've been invited to take a test</h2>
        <p>Test details:</p>
        <ul>
          <li><strong>Title:</strong> ${test.title}</li>
          <li><strong>Duration:</strong> ${test.timeLimit} minutes</li>
          <li><strong>Valid until:</strong> ${expiryDate}</li>
        </ul>
        <p>Click the link below to start the test:</p>
        <a href="${testLink}" style="display:inline-block;padding:10px 20px;background-color:#007bff;color:#ffffff;text-decoration:none;border-radius:5px;">
          Start Test
        </a>
        <p style="margin-top:20px;">
          <small>If you can't click the button, copy and paste this link in your browser: ${testLink}</small>
        </p>
      `
    };

    await transporter.sendMail(mailOptions);
    return true;
  } catch (error) {
    console.error('Error sending test invitation:', error);
    return false;
  }
};

// You can add more email-related functions here as needed 