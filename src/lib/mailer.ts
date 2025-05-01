import nodemailer from 'nodemailer'

import SMTPTransport from 'nodemailer/lib/smtp-transport'

export const transporter = nodemailer.createTransport({
  host: 'localhost',
  port: 1025,
  secure: false,
  auth: undefined,
} as SMTPTransport.Options)
