import nodemailer from "nodemailer";

// For development, use Ethereal (fake SMTP)
let transporter: nodemailer.Transporter;

async function createTransporter() {
  console.log('FORCED: Using Ethereal for testing');
  // Force Ethereal for testing
  transporter = nodemailer.createTransport({
    host: 'smtp.ethereal.email',
    port: 587,
    secure: false,
    auth: {
      user: 'sbxdk7ghgetgrs2h@ethereal.email',
      pass: 'nZCFm5dTsbmqETXNDY',
    },
  });
  console.log('Using hardcoded Ethereal credentials');
}

createTransporter();

export const sendEmail = async (to: string, subject: string, text: string) => {
  try {
    console.log('Sending email with transporter:', transporter.options);
    await transporter.sendMail({
      from: `"Agri System" <brzg2wru5wcefcyl@ethereal.email>`,
      to,
      subject,
      text,
    });
    console.log(`Email sent to ${to}`);
  } catch (error) {
    console.error("Failed to send email:", error);
    throw new Error("Failed to send email");
  }
};
