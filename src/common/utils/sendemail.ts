import nodemailer from "nodemailer"
import Mail from "nodemailer/lib/mailer"
import { env } from "../../config/env.service.js"

const transporter =nodemailer.createTransport({
    service:"gmail",
    auth:{
        user:env.googleEmail,
        pass:env.googleAppPassword
    }
})
export const sendEmail=async({to,subject,html}:Mail.Options)=>{
    const info =await transporter.sendMail({
        from :`Social Media App  ${env.googleEmail}`,
        to,
        subject,
        html
    })

}