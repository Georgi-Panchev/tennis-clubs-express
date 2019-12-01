const User = require('../models/User');
const Tournament = require('../models/Tournament');
const encryption = require('../util/encryption');
const jwt = require('jsonwebtoken');
const { validationResult } = require('express-validator');

module.exports = {
    register: (request, response, next) => {
        const { username, password } = request.body;

        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(422).json({
                message: 'Validation failed, entered data is incorrect',
                errors: errors.array()
            });
        }

        const salt = encryption.generateSalt();
        const hashedPassword = encryption.generateHashedPassword(salt, password);

        User.create({
            username,
            hashedPassword,
            salt
        })
            .then((user) => {
                response.status(201)
                    .json({ message: 'User Registered!', userId: user._id });
            })
            .catch((error) => {
                next(error);
            });
    },

    login: (request, response, next) => {
        const { username, password } = request.body;

        User.findOne({ username: username })
            .then((user) => {
                if (!user) {
                    return response.status(404)
                        .json({ message: 'Invalid Credentials!' });
                }

                if (!user.authenticate(password)) {
                    return response.status(400)
                        .json({ message: 'Invalid Credentials!' });
                }

                const token = jwt.sign({
                    username: username,
                    userId: user._id,
                    roles: user.roles
                }, 'verysecuresecret', { expiresIn: '1h' });

                response.status(200)
                    .json({ message: 'User Logged In!', token, userId: user._id });
            })
            .catch((error) => {
                next(error);
            });
    },

    profile: (request, response, next) => {
        let userId = request.userId;

        Tournament.find({}).where('playersRegistered').in(userId)
            .then((tournaments) => {
                response.status(200)
                    .json({ message: 'Tournaments Fetched!', tournaments });
            })
            .catch((error) => {
                next(error);
            });
    }
};

