exports.throwError = (errorMessage, code) => {
    const error = new Error();
    if (!errorMessage || !code) {
        error.message = 'Illegal operation';
        error.code = 500;
        throw error;
    }

    error.message = errorMessage;
    error.code = code;
    throw error;
}