// check input feilds must be string and not empty and contain no spaces

const validateInputFields = (body) => {
    const errors = [];
    for (const key in body) {
        if (typeof body[key] !== 'string' || body[key].trim() === "") {
            errors.push(`${key} cannot be empty`);
        }
        // check if feild contain spaces
        if (typeof body[key] === 'string' && /\s/.test(body[key])) {
            errors.push(`${key} should not contain spaces`);
        }
    }
    return {
        isInputValid: errors.length === 0,
        error: errors.length > 0 ? errors.join(' ') : null
    }
}

module.exports = validateInputFields