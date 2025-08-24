export const otpHtml = (otp: string) => {
  return `
      <div style="font-family: Arial, sans-serif; background-color: #f4f4f4; padding: 20px;">
        <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 30px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
          <h2 style="color: #333;">Verify Your Account</h2>
          <p style="font-size: 16px; color: #555;">Use the OTP below to complete your verification. This OTP is valid for 5 minutes.</p>
          <div style="font-size: 24px; font-weight: bold; color: #ff6f61; margin: 20px 0; letter-spacing: 4px;">
            ${otp}
          </div>
          <p style="font-size: 12px; color: #999; margin-top: 20px;">If you didn't request this, please ignore this email.</p>
        </div>
      </div>
    `;
}

export const activeMessage = (activeCode: string) => {
  return `
  <div style="font-family: Arial, sans-serif;  padding: 20px;">
    <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 30px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
      <h1 style="color: #333;">Welcome to Ecommerce</h1>
      <p style="font-size: 16px; color: #555;">Thank you for signing up! Click the button below to activate your account.</p>
      <a href="http://localhost:3000/auth/active-account?token=${activeCode}" 
         style="display: inline-block; padding: 15px 25px; font-size: 16px; color: #ffffff; background-color: #ff6f61; text-decoration: none; border-radius: 5px; margin-top: 20px;">
         Activate Account
      </a>
      <p style="font-size: 12px; color: #999; margin-top: 20px;">If you didn't sign up, please ignore this email.</p>
    </div>
  </div>
`;
}

export const forgetPasswordMessage = (code: string) => {
  return `<div style="font-family: Arial, sans-serif; padding: 20px; background-color: #f4f6f8;">
  <div style="max-width: 600px; margin: auto; background-color: #ffffff; border-radius: 10px; padding: 30px; text-align: center; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
    
    <h1 style="color: #333;">Reset Your Password</h1>
    
    <p style="font-size: 16px; color: #555;">
      We received a request to reset your password. Enter the OTP below to proceed. This code will expire in 10 minutes.
    </p>
    
    <div style="font-size: 24px; font-weight: bold; color: #ff6f61; background-color: #ffe5e0; padding: 15px 25px; border-radius: 5px; display: inline-block; letter-spacing: 4px; margin: 20px 0;">
      ${code}
    </div>
    <p style="font-size: 12px; color: #999; margin-top: 20px;">
      If you didn't request a password reset, please ignore this email.
    </p>
    
  </div>
</div>`
}