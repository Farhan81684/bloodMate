function validatePakistaniMobileNumber(number) {
    // Regular expression for validating Pakistani mobile numbers
    const mobileRegex = /^(?:\+92|03)\d{9}$/;
    const errors = []
    if (!number) {
        errors.push('Mobile number cannot be empty');
    } else if (typeof number !== 'string') {
        errors.push('Mobile number must be a string');
    } else if (number.trim() === "") {
        errors.push('Mobile number cannot be empty');
    } else if (/\s/.test(number)) {
        errors.push('Mobile number should not contain spaces');
    }
    // check numbers start with 03 and +92
    else if (!mobileRegex.test(number)) {
        errors.push('Enter A Valid Number');

    }

    return {
        isValid: errors.length === 0,
        error: errors.length > 0 ? errors.join(' ') : null
    }




}

module.exports = validatePakistaniMobileNumber