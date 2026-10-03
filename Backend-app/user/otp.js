const express = require('express');
const crypto = require('crypto');
const jwt = require('jsonwebtoken');
const nodemailer = require('nodemailer');
const rateLimit = require('express-rate-limit');
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'SECRET_KEY';
const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = process.env.SMTP_PORT || 587;
const SMTP_USER = process.env.SMTP_USER;
const SMTP_PASS = process.env.SMTP_PASS;
const EMAIL_FROM = process.env.EMAIL_FROM || '"Ontology App" <no-reply@example.com>';

const transporter = nodemailer.createTransport({
    host: SMTP_HOST,
    port: SMTP_PORT,
    secure: SMTP_PORT == 465,
    auth: {
        user: SMTP_USER,
        pass: SMTP_PASS
    }
});

const hashOTP = (otp) => {
    return crypto.createHash('sha256').update(String(otp)).digest('hex');
};

router.post('/send-otp', async (req, res) => {
    try {
        const { email } = req.body;
        if (!email) {
            return res.status(400).json({ success: false, error: 'Email is required' });
        }

        const otp = crypto.randomInt(100000, 999999);
        const otpHash = hashOTP(otp);

        const verificationToken = jwt.sign(
            { email, otpHash },
            JWT_SECRET,
            { expiresIn: '5m' }
        );

        const mailOptions = {
            from: EMAIL_FROM,
            to: email,
            subject: 'รหัส OTP ของคุณ (มีอายุ 5 นาที)',
            text: `รหัส OTP สำหรับยืนยันตัวตนของคุณคือ: ${otp}\nรหัสนี้จะหมดอายุใน 5 นาที`
        };

        if (SMTP_USER && SMTP_PASS) {
            await transporter.sendMail(mailOptions);
        } else {
            // For testing if SMTP not configured
            console.log(`[Mock Email] To: ${email}, OTP: ${otp}`);
        }

        return res.status(200).json({
            success: true,
            message: 'OTP sent successfully',
            verificationToken
        });
    } catch (error) {
        console.error('Send OTP Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error while sending OTP.' });
    }
});

const verifyOtpLimiter = rateLimit({
    windowMs: 5 * 60 * 1000,
    max: 5,
    message: { success: false, error: 'Too many verification attempts from this IP, please try again after 5 minutes' },
    standardHeaders: true,
    legacyHeaders: false,
});

router.post('/verify-otp', verifyOtpLimiter, (req, res) => {
    try {
        const { verificationToken, otp } = req.body;

        if (!verificationToken || !otp) {
            return res.status(400).json({ success: false, error: 'Verification token and OTP are required' });
        }

        let decoded;
        try {
            decoded = jwt.verify(verificationToken, JWT_SECRET);
        } catch (err) {
            if (err instanceof jwt.TokenExpiredError) {
                return res.status(401).json({ success: false, error: 'OTP has expired. Please request a new one.' });
            } else if (err instanceof jwt.JsonWebTokenError) {
                return res.status(401).json({ success: false, error: 'Invalid verification token.' });
            }
            throw err;
        }

        const { email, otpHash: tokenOtpHash } = decoded;
        const incomingOtpHash = hashOTP(otp);

        const tokenHashBuffer = Buffer.from(tokenOtpHash, 'hex');
        const incomingHashBuffer = Buffer.from(incomingOtpHash, 'hex');

        if (tokenHashBuffer.length !== incomingHashBuffer.length || !crypto.timingSafeEqual(tokenHashBuffer, incomingHashBuffer)) {
            return res.status(401).json({ success: false, error: 'Incorrect OTP.' });
        }

        return res.status(200).json({
            success: true,
            message: 'OTP verified successfully.',
            email
        });

    } catch (error) {
        console.error('Verify OTP Error:', error);
        return res.status(500).json({ success: false, error: 'Internal server error during verification.' });
    }
});

module.exports = router;
