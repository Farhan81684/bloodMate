const jwt = require('jsonwebtoken');
require('dotenv').config();

const JWT_SECRET = process.env.JWT_SECRET;

function authenticateToken(req, res, next) {
    console.log('🔥 Middleware hit');

    const authHeader = req.headers['authorization'];
    console.log('📦 authHeader:', authHeader);

    const token = authHeader && authHeader.split(' ')[1];
    console.log('🔐 Token:', token);

    if (!token) return res.status(401).json({ message: 'Unauthorized: No token' });

    jwt.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            console.log('❌ Invalid token:', err);
            return res.status(403).json({ message: 'Forbidden: Invalid token' });
        }

        console.log('✅ Decoded token:', decoded);
        req.user = decoded;
        req.userId = decoded.id;

        next();
    });
}

module.exports = authenticateToken;
