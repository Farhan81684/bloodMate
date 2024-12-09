// src/utils/passwordUtils.js

/**
 * Checks if the provided password is strong.
 * @param {string} password - The password to check.
 * @returns {Object} - An object with `isStrong` (boolean) and `errors` (string) properties.
 */
function checkStrongPassword(password) {
    const errors = [];

    if (password.length < 8) {
        errors.push('Password must be at least 8 characters long.');
    }
    if (!/[A-Z]/.test(password)) {
        errors.push('Password must contain at least one uppercase letter.');
    }
    if (!/[a-z]/.test(password)) {
        errors.push('Password must contain at least one lowercase letter.');
    }
    if (!/[0-9]/.test(password)) {
        errors.push('Password must contain at least one digit.');
    }
    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
        errors.push('Password must contain at least one special character.');
    }

    return {
        isStrong: errors.length === 0,
        errors: errors.length > 0 ? errors.join(' ') : null
    };
}

module.exports = checkStrongPassword;
