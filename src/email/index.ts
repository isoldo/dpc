import nodemailer from "nodemailer";
import { mailServiceConfig } from "./config.js";
import 'dotenv/config';

interface EmailData {
  from: string;
  to: string;
  subject: string;
  html: string;
}

async function send(data: EmailData) {
  const transporter = nodemailer.createTransport(mailServiceConfig);
  const result = await transporter.sendMail(data);
  console.debug({ sendMailResult: result });
}

interface UserDetails {
  name: string;
  lastName: string;
}

interface DeliveryDetails {
  price: number;
  packageCount: number;
  date: Date;
  distance: number
}

export interface DeliveryMailParameters {
  email: string;
  user: UserDetails;
  delivery: DeliveryDetails;
}

export async function sendDeliveryMail(params: DeliveryMailParameters) {
  const fromAddress = process.env.SENDER_MAIL;
  const html = generateHtml(params.user, params.delivery);
  const emailData: EmailData = {
    from: `M&M DPC <${fromAddress}>`,
    to: params.email,
    subject: "Delivery confirmation",
    html
  };

  await send(emailData);
}

function generateHtml(user: UserDetails, delivery: DeliveryDetails): string {
  const d = delivery.date;
  const date = `${d.getDate()}.${d.getMonth()+1}.${d.getFullYear()}`;
  const parts = [
    `<div>`,
    `Dear ${user.name} ${user.lastName},<br/>`,
    `here are your delivery details:<br/>`,
    `number of packages: ${delivery.packageCount}<br/>`,
    `distance: ${delivery.distance} km<br/>`,
    `cost: ${delivery.price.toFixed(2)} EUR<br/>`,
    `delivery date: ${date}<br/>`,
    `<br/>`,
    `Pleasure doing business with you!`,
    `</div>`
  ];

  return parts.join("");
}
