// emailTemplates.js

export const activationEmailTemplate = (firstName, email, defaultPassword) => {
  return `
      <div style="font-family: Arial, sans-serif; line-height: 1.6;">
        <h2 style="color: #333;">Welcome to APNA Card, ${firstName}!</h2>
        <p style="color: #555;">
          We are excited to have you on board. To get started with your APNA Card account, 
          please activate your account by clicking the button below:
        </p>
        <p style="text-align: center;">
          <a href="https://app.apna-card.com/login" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Activate My Account</a>
        </p>
        <p style="color: #555;">
          Here are your account details:
        </p>
        <ul style="color: #555;">
          <li><strong>Email:</strong> ${email}</li>
          <li><strong>Default Password:</strong> <strong style="background-color: #f0f0f0; padding: 5px; border-radius: 3px;">${defaultPassword}</strong></li>
        </ul>
        <p style="color: #555;">
          After clicking the activation link, you will be routed to a screen where you can update your password. Please set a secure password for your account.
        </p>
        <p style="color: #555;">
          If the button above doesn't work, you can also activate your account by clicking the link below:
        </p>
        <p>
          <a href="https://app.apna-card.com/login" style="color: #4CAF50;">https://app.apna-card.com/login</a>
        </p>
        <p style="color: #555;">
          If you did not sign up for an APNA Card account, please disregard this email.
        </p>
        <p style="color: #555;">
          Best regards,<br />
          The APNA Card Team
        </p>
      </div>
    `;
};

export const forgotPasswordEmailTemplate = (firstName, temporaryPassword) => {
  return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p style="color: #555;">
            Hello ${firstName},<br />
            We received a request to reset your password for your APNA Card account. 
            Your temporary password is: <strong style="background-color: #f0f0f0; padding: 5px; border-radius: 3px;">${temporaryPassword}</strong>.
          </p>
          <p style="color: #555;">
            Please click the button below to update your password:
          </p>
          <p style="text-align: center;">
            <a href="https://app.apna-card.com/login" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Update My Password</a>
          </p>
          <p style="color: #555;">
            If you did not request a password reset, please disregard this email.
          </p>
          <p style="color: #555;">
            Best regards,<br />
            The APNA Card Team
          </p>
        </div>
      `;
};

export const passwordResetConfirmationEmailTemplate = (
  firstName,
  newPassword
) => {
  return `
        <div style="font-family: Arial, sans-serif; line-height: 1.6;">
          <h2 style="color: #333;">Your Password Has Been Reset</h2>
          <p style="color: #555;">
            Hello ${firstName},<br />
            Your password for your APNA Card account has been successfully reset. 
            Please use the following password to log in:
          </p>
          <p style="color: #333; font-weight: bold; background-color: #f0f0f0; padding: 5px; border-radius: 3px;">
            ${newPassword}
          </p>
          <p style="color: #555;">
            We recommend that you change your password after logging in for your security.
          </p>
          <p style="text-align: center;">
            <a href="https://app.apna-card.com/login" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Log In Now</a>
          </p>
          <p style="color: #555;">
            If you did not initiate this request, please contact our support team immediately.
          </p>
          <p style="color: #555;">
            Best regards,<br />
            The APNA Card Team
          </p>
        </div>
      `;
};