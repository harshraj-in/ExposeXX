import crypto from 'crypto';

const algorithm = 'aes-256-cbc';
const getSecretKey = () => {
    // If JWT_SECRET is present it must be exactly 32 chars for aes-256
    // So we hash it to strictly 32 bytes.
    return crypto.createHash('sha256').update(process.env.JWT_SECRET || 'fallback_secret_key_12345').digest();
};

export const encryptPII = (text) => {
    if (!text) return text;
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, getSecretKey(), iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return `${iv.toString('hex')}:${encrypted}`;
};

export const decryptPII = (hash) => {
    if (!hash) return hash;
    const parts = hash.split(':');
    const iv = Buffer.from(parts.shift(), 'hex');
    const encryptedText = Buffer.from(parts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, getSecretKey(), iv);
    let decrypted = decipher.update(encryptedText, 'hex', 'utf8');
    decrypted += decipher.final('utf8');
    return decrypted;
};
