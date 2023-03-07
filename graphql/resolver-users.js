const bcrypt = require('bcrypt');
const validator = require('validator');
const jwt = require('jsonwebtoken');

const User = require('../models/user');
const error = require('../utils/error');
const factory = require('../utils/factory');

exports.createUser = async function ({ userInput }) {
    const errors = [];
    if (!validator.isEmail(userInput?.email)) {
        errors.push({ message: 'E-Mail is invalid.' });
    }
    if (
        validator.isEmpty(userInput?.password) ||
        !validator.isLength(userInput.password, { min: 4 })
    ) {
        errors.push({ message: 'Password too short!' });
    }
    if (errors.length > 0) {
        error.throwError('Invalid input.', 422)
    }

    const existingUser = await User.findOne({ email: userInput.email });
    if (existingUser) {
        error.throwError('User exists already!', 409);
    }

    const hashedPw = await bcrypt.hash(userInput.password, 12);
    const user = factory.createUser(userInput.email, userInput.name, hashedPw);

    const createdUser = await user.save();
    return { ...createdUser._doc, _id: createdUser._id.toString() };
};

exports.login = async function ({ email, password }) {
    const user = await User.findOne({ email: email });
    if (!user) {
        error.throwError('User not found.', 401);
    }

    const isPasswordEqual = await bcrypt.compare(password, user.password);
    if (!isPasswordEqual) {
        error.throwError('wrong input', 401)
    }

    const token = jwt.sign(
        {
            userId: user._id.toString(),
            email: user.email
        },
        'somesupersecretsecret',
        { expiresIn: '24h' });

    return { token: token, userId: user._id.toString() };
}