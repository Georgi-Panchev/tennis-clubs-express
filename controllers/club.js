const Club = require('../models/Club');
const { validationResult } = require('express-validator');

module.exports = {
    read: (request, response, next) => {
        Club.find()
            .then((clubs) => {
                response.status(200)
                    .json({ message: 'Clubs Fetched!', clubs });
            })
            .catch((error) => {
                next(error);
            });
    },

    readById: (request, response, next) => {
        const clubId = request.params.clubId;

        Club.findById(clubId)
            .then((club) => {
                if (!club) {
                    const error = new Error('Club Not Found!');
                    error.statusCode = 404;
                    throw error;
                }

                response.status(200)
                    .json({ message: 'Club Fetched!', club })
            })
            .catch((error) => {
                next(error);
            });
    },

    create: (request, response, next) => {
        let requestClub = request.body;

        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(422).json({
                message: 'Validation failed, entered data is incorrect',
                errors: errors.array()
            });
        }

        let creationObject = {
            title: requestClub.title,
            imageUrl: requestClub.imageUrl,
            city: requestClub.city,
            rank: requestClub.rank,
            courts: requestClub.courts,
        };
        if (requestClub.hasLighting) creationObject.hasLighting = true;
        if (requestClub.hasIndoorCourts) creationObject.hasIndoorCourts = true;

        Club.create(creationObject)
            .then((club) => {
                response.status(201)
                    .json({ message: 'Club Created!', club });
            })
            .catch((error) => {
                next(error);
            });
    },

    update: (request, response, next) => {
        const requestClub = request.body;
        const clubId = request.params.clubId;

        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(422).json({
                message: 'Validation failed, entered data is incorrect',
                errors: errors.array()
            });
        }

        Club.findById(clubId)
            .then((club) => {
                if (!club) {
                    const error = new Error('Club Not Found!');
                    error.statusCode = 404;
                    throw error;
                }

                let hasLighting = false;
                if (requestClub.hasLighting) hasLighting = true;
                let hasIndoorCourts = false;
                if (requestClub.hasIndoorCourts) hasIndoorCourts = true;

                club.title = requestClub.title;
                club.imageUrl = requestClub.imageUrl;
                club.city = requestClub.city;
                club.rank = requestClub.rank;
                club.courts = requestClub.courts;
                club.hasLighting = hasLighting;
                club.hasIndoorCourts = hasIndoorCourts;
                return club.save();
            })
            .then((club) => {
                response.status(200)
                    .json({ message: 'Club Updated!', club })
            })
            .catch((error) => {
                next(error)
            });
    },

    delete: (request, response, next) => {
        const clubId = request.params.clubId;

        Club.findById(clubId)
            .then((club) => {
                if (!club) {
                    const error = new Error('Club Not Found!');
                    error.statusCode = 404;
                    throw error;
                }

                return Club.findByIdAndDelete(clubId);
            })
            .then(() => {
                response.status(200)
                    .json({ message: 'Club Deleted!', clubId });
            })
            .catch((error) => {
                next(error);
            });
    }
};

