import sgMail from "@sendgrid/mail";
import dotenv from "dotenv";
import {
  activationEmailTemplate,
  forgotPasswordEmailTemplate,
  passwordResetConfirmationEmailTemplate,
} from "../utils/emailTemplate.js";

dotenv.config();

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

export const sendActivationEmail = async (
  email,
  firstName,
  defaultPassword
) => {
  const message = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Activate Your APNA Card Account",
    html: activationEmailTemplate(firstName, email, defaultPassword),
  };

  try {
    await sgMail.send(message);
  } catch (error) {
    console.error(error);
  }
};

export const sendForgotPasswordEmail = async (
  email,
  firstName,
  temporaryPassword
) => {
  const message = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Reset Your Password",
    html: forgotPasswordEmailTemplate(firstName, temporaryPassword), // Use the updated template
  };

  try {
    await sgMail.send(message);
    console.log(`Forgot password email sent to ${email}`);
  } catch (error) {
    console.error("Error sending forgot password email:", error);
  }
};

export const sendResetPasswordEmail = async (
  email,
  firstName,
  defaultPassword
) => {
  const message = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: "Reset Password APpna Card",
    html: passwordResetConfirmationEmailTemplate(firstName, defaultPassword),
  };

  try {
    await sgMail.send(message);
  } catch (error) {
    console.error(error);
  }
};
