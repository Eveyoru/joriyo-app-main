import { Resend } from 'resend';
import dotenv from 'dotenv';
dotenv.config();

if (!process.env.RESEND_API) {
    console.error("ERROR: RESEND_API is missing in the .env file");
    throw new Error("RESEND_API is required");
}

const resend = new Resend(process.env.RESEND_API);

const sendEmail = async ({ sendTo, subject, html }) => {
    try {
        console.log(`Attempting to send email to ${sendTo}`);
        
        const data = await resend.emails.send({
            from: 'Binkeyit <onboarding@resend.dev>',
            to: [sendTo],
            subject: subject,
            html: html,
        });

        if (!data || data.error) {
            console.error("Email sending failed:", data?.error || "Unknown error");
            throw new Error(data?.error?.message || "Failed to send email");
        }

        console.log("Email sent successfully:", data);
        return data;
    } catch (error) {
        console.error("Email sending error:", error);
        throw error;
    }
};

export default sendEmail;
