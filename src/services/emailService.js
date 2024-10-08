import nodemailer from 'nodemailer';
import crypto from 'crypto';

import config from '../config.js';
import userModel from '../dao/mongo/models/userModel.js'; 
import __dirname from '../utils/utils.js';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL,
    pass: process.env.EMAIL_PASSWORD 
  }
});

const sendResetEmail = async (email) => {
  try {
    const user = await userModel.findOne({ email });
    if (!user) throw new Error('No user with that email');

    const token = crypto.randomBytes(20).toString('hex');
    const resetPasswordToken = crypto.createHash('sha256').update(token).digest('hex');
    const resetPasswordExpires = Date.now() + 3600000; // 1 hour

    user.resetPasswordToken = resetPasswordToken;
    user.resetPasswordExpires = resetPasswordExpires;
    await user.save();

    const resetUrl = `http://localhost:8080/reset-password/${resetPasswordToken}`;

    const mailOptions = {
        to: email,
        from: config.email,
        subject: 'Password Reset',
        html:`
        <im src="cid:1promo-apollo-full"/>
        <p>Está recibiendo esto porque usted (u otra persona) ha solicitado el restablecimiento de la contraseña de su cuenta.</p>
        <p>Haga clic en el siguiente enlace o péguelo en su navegador para completar el proceso:</p>
        <a href="${resetUrl}">${resetUrl}</a>
        <p>Si no solicitó esto, ignore este correo electrónico y su contraseña permanecerá sin cambios.</p>
        `,
        attachments:[{
            filename:'1 promo-apollo-full.png',
            path:__dirname+'/images/productos/1 promo-apollo-full.png',
            cid: '1promo-apollo-full'
        }]
    };

    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error('Error sending email:', error);
  }
};

const sendDeletionEmail = async (userEmail) => {
  try {
      await transporter.sendMail({
          from: config.email,
          to: userEmail,
          subject: 'Cuenta Eliminada por Inactividad ',
          text: 'Hola, tu cuenta ha sido eliminada debido a inactividad durante los últimos dos días. Si crees que esto es un error, por favor contáctanos.'
      });
  } catch (error) {
      console.error('Error al enviar el correo electrónico:', error);
  }
};

const sendProductDeletionEmail = async (userEmail, productName) => {
  try {
      await transporter.sendMail({
          from: config.email,
          to: userEmail,
          subject: 'Notificación de Eliminación de Producto',
          text: `Hola, el producto '${productName}' que pertenecía a tu cuenta ha sido eliminado. Si tienes alguna pregunta, por favor contáctanos.`
      });
  } catch (error) {
      console.error('Error al enviar el correo electrónico:', error);
  }
};

export { sendResetEmail, sendDeletionEmail, sendProductDeletionEmail };