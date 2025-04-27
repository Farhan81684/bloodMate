const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: 'Gmail',
    port: 587,
    auth: {
        user: "ibtasamofficial@gmail.com",
        pass: "vcvk eepn jtsz rrsz",
    }
});

module.exports = transporter