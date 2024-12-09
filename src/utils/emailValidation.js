// utils/validateEmail.js

/**
 * Validates the format of an email address and provides error messages.
 * @param {string} email - The email address to validate.
 * @returns {Object} - An object with `isValid` (boolean) and `error` (string) properties.
 */
function validateEmail(email) {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    let error = "";

    if (!email) {
        error = "Email address is required.";
    } else if (typeof email !== 'string') {
        error = "Email address must be a string.";
    } else if (email.trim() === "") {
        error = "Email address cannot be empty.";
    } else if (/\s/.test(email)) {
        error = "Email address should not contain spaces.";
    } else if (!emailRegex.test(email)) {
        error = "Invalid email address format.";
    }

    return {
        isValid: !error,
        error
    };
}

module.exports = validateEmail;
