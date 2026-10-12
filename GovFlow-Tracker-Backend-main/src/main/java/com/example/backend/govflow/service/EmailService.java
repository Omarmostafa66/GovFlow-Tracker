package com.example.backend.govflow.service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class EmailService {

    private final JavaMailSender mailSender;

    @Value("${app.base-url}")
    private String baseUrl;

    /**
     * Sends the account verification email using a professional HTML template.
     * @param to The recipient's email address.
     * @param token The verification token.
     */
    public void sendAccountVerificationEmail(String to, String token) {
        String verificationUrl = baseUrl + "/api/auth/verify?token=" + token;

        String subject = "Verify Your GovFlow Account";
        String preheader = "Just one more step to get started.";
        String title = "Confirm Your Account";
        String messageText = "Welcome to GovFlow! Please click the button below to verify your email address and activate your account. This link will expire in one hour.";
        String buttonText = "Verify Account";

        String htmlContent = buildProfessionalEmailTemplate(subject, preheader, title, messageText, buttonText, verificationUrl);
        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * Sends the password reset email using a professional HTML template.
     * @param to The recipient's email address.
     * @param token The password reset token.
     */
    public void sendPasswordResetEmail(String to, String token) {
        String resetUrl = "http://localhost:4200/reset-password?token=" + token;

        String subject = "Reset Your GovFlow Password";
        String preheader = "A request to reset your password was received.";
        String title = "Password Reset Request";
        String messageText = "We received a request to reset your password. Click the button below to choose a new one. This link is valid for 15 minutes. If you didn't request this, you can safely ignore this email.";
        String buttonText = "Reset Password";

        String htmlContent = buildProfessionalEmailTemplate(subject, preheader, title, messageText, buttonText, resetUrl);
        sendHtmlEmail(to, subject, htmlContent);
    }

    /**
     * A helper method to send an HTML email.
     * @param to The recipient's email address.
     * @param subject The email subject.
     * @param htmlContent The HTML content of the email body.
     */
    private void sendHtmlEmail(String to, String subject, String htmlContent) {
        MimeMessage mimeMessage = mailSender.createMimeMessage();
        try {
            MimeMessageHelper helper = new MimeMessageHelper(mimeMessage, true, "UTF-8");
            helper.setFrom("your-email@gmail.com"); // تأكد من وضع ايميلك هنا
            helper.setTo(to);
            helper.setSubject(subject);
            helper.setText(htmlContent, true); // The 'true' indicates the content is HTML
            mailSender.send(mimeMessage);
        } catch (MessagingException e) {
            throw new IllegalStateException("Failed to send email", e);
        }
    }

    /**
     * Builds a modern and professional HTML email template.
     * @param subject The email's subject line.
     * @param preheader A short summary text that follows the subject line.
     * @param title The main heading of the email.
     * @param messageText The paragraph text.
     * @param buttonText The text for the call-to-action button.
     * @param buttonUrl The URL the button will link to.
     * @return A string containing the full HTML for the email.
     */
    private String buildProfessionalEmailTemplate(String subject, String preheader, String title, String messageText, String buttonText, String buttonUrl) {
        String siteName = "GovFlow"; // اسم موقعك
        String primaryColor = "#FF5722"; // اللون الرئيسي لموقعك
        int currentYear = java.time.Year.now().getValue();

        return "<!DOCTYPE html>"
                + "<html lang='en' xmlns='http://www.w3.org/1999/xhtml' xmlns:v='urn:schemas-microsoft-com:vml' xmlns:o='urn:schemas-microsoft-com:office:office'>"
                + "<head>"
                + "    <meta charset='utf-8'>"
                + "    <meta name='viewport' content='width=device-width'>"
                + "    <meta http-equiv='X-UA-Compatible' content='IE=edge'>"
                + "    <meta name='x-apple-disable-message-reformatting'>"
                + "    <title>" + subject + "</title>"
                + "    <link href='https://fonts.googleapis.com/css2?family=Poppins:wght@400;600&display=swap' rel='stylesheet'>"
                + "    <style>"
                + "        html, body { margin: 0 auto !important; padding: 0 !important; height: 100% !important; width: 100% !important; background: #f1f1f1; }"
                + "        * { -ms-text-size-adjust: 100%; -webkit-text-size-adjust: 100%; }"
                + "        div[style*='margin: 16px 0'] { margin: 0 !important; }"
                + "        table, td { mso-table-lspace: 0pt !important; mso-table-rspace: 0pt !important; }"
                + "        table { border-spacing: 0 !important; border-collapse: collapse !important; table-layout: fixed !important; margin: 0 auto !important; }"
                + "        img { -ms-interpolation-mode:bicubic; }"
                + "        a { text-decoration: none; }"
                + "        .preheader { display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif; }"
                + "        .email-container { max-width: 600px; margin: 0 auto; }"
                + "        .email-content { background: #ffffff; padding: 20px 40px; border-radius: 12px; box-shadow: 0 10px 30px -10px rgba(0,0,0,0.1); }"
                + "        .logo-container { text-align: center; padding: 20px 0; }"
                + "        .logo { font-family: 'Poppins', sans-serif; color: #151515; font-size: 28px; font-weight: 600; }"
                + "        .text-content { font-family: 'Poppins', sans-serif; font-size: 16px; line-height: 24px; color: #555555; }"
                + "        .text-content h1 { font-size: 24px; font-weight: 600; color: #151515; margin-top: 0; }"
                + "        .button-td, .button-a { text-align: center; border-radius: 8px; }"
                + "        .button-a { background: " + primaryColor + "; display: block; padding: 15px; font-family: 'Poppins', sans-serif; font-size: 16px; font-weight: 600; color: #ffffff; text-decoration: none; }"
                + "        .footer { font-family: 'Poppins', sans-serif; text-align: center; font-size: 12px; color: #999999; margin-top: 20px; }"
                + "    </style>"
                + "</head>"
                + "<body width='100%' style='margin: 0; padding: 0 !important; mso-line-height-rule: exactly; background-color: #f1f1f1;'>"
                + "    <div style='display: none; font-size: 1px; line-height: 1px; max-height: 0; max-width: 0; opacity: 0; overflow: hidden; mso-hide: all; font-family: sans-serif;'>" + preheader + "</div>"
                + "    <center style='width: 100%; background-color: #f1f1f1;'>"
                + "        <div class='email-container'>"
                + "            <table align='center' role='presentation' cellspacing='0' cellpadding='0' border='0' width='100%' style='margin: auto;'>"
                + "                <tr><td class='logo-container'><div class='logo'>" + siteName + "</div></td></tr>"
                + "                <tr>"
                + "                    <td class='email-content'>"
                + "                        <table role='presentation' cellspacing='0' cellpadding='0' border='0' width='100%'>"
                + "                            <tr>"
                + "                                <td class='text-content'>"
                + "                                    <h1>" + title + "</h1>"
                + "                                    <p>" + messageText + "</p>"
                + "                                </td>"
                + "                            </tr>"
                + "                            <tr>"
                + "                                <td style='padding: 20px 0;'>"
                + "                                    <table align='center' role='presentation' cellspacing='0' cellpadding='0' border='0' style='margin: auto;'>"
                + "                                        <tr>"
                + "                                            <td class='button-td'>"
                + "                                                <a href='" + buttonUrl + "' class='button-a' style='color:#ffffff !important;'>" + buttonText + "</a>"
                + "                                            </td>"
                + "                                        </tr>"
                + "                                    </table>"
                + "                                </td>"
                + "                            </tr>"
                + "                        </table>"
                + "                    </td>"
                + "                </tr>"
                + "                <tr><td class='footer'><p>Copyright &copy; " + currentYear + " " + siteName + ". All Rights Reserved.</p></td></tr>"
                + "            </table>"
                + "        </div>"
                + "    </center>"
                + "</body>"
                + "</html>";

    }
}