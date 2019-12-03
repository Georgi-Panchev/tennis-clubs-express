const Club = require('../models/Club');
const Tournament = require('../models/Tournament');
const User = require('../models/User');
const { validationResult } = require('express-validator');

module.exports = {
    read: (request, response, next) => {
        Tournament.find()
            .then((tournaments) => {
                response.status(200)
                    .json({ success: true, message: 'Tournaments Fetched!', tournaments });
            })
            .catch((error) => {
                next(error);
            });
    },

    readByClub: (request, response, next) => {
        const clubId = request.params.clubId;

        Club.findById(clubId).populate('tournaments')
            .then((club) => {
                response.status(200)
                    .json({ success: true, message: 'Tournaments Fetched!', tournaments: club.tournaments });
            })
            .catch((error) => {
                next(error);
            });
    },

    readById: (request, response, next) => {
        const tournamentId = request.params.tournamentId;

        Tournament.findById(tournamentId)
            .then((tournament) => {
                if (!tournament) {
                    const error = new Error('Tournament Not Found!');
                    error.statusCode = 404;
                    throw error;
                }

                response.status(200)
                    .json({ success: true, message: 'Tournament Fetched!', tournament })
            })
            .catch((error) => {
                next(error);
            });
    },

    create: (request, response, next) => {
        const requestTournament = request.body;
        let clubId = request.params.clubId;

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

                return Promise.all([
                    Tournament.create({
                        title: requestTournament.title,
                        imageUrl: requestTournament.imageUrl,
                        balls: requestTournament.balls,
                        numberOfPlayers: requestTournament.numberOfPlayers,
                        fee: requestTournament.fee,
                        club: clubId
                    }),
                    Club.findById(clubId)
                ]);
            })
            .then(([ tournament, club ]) => {
                if (!club.tournaments.includes(tournament._id)) club.tournaments.push(tournament._id);
                return Promise.all([ tournament.save(), club.save() ])
            })
            .then(([ tournament, club ]) => {
                response.status(201)
                    .json({ success: true, message: 'Tournament Created!', tournament });
            })
            .catch((error) => {
                next(error);
            });
    },


    update: (request, response, next) => {
        const requestTournament = request.body;
        const tournamentId = request.params.tournamentId;

        const errors = validationResult(request);
        if (!errors.isEmpty()) {
            return response.status(422).json({
                message: 'Validation failed, entered data is incorrect',
                errors: errors.array()
            });
        }

        Tournament.findById(tournamentId)
            .then((tournament) => {
                if (!tournament) {
                    const error = new Error('Tournament Not Found!');
                    error.statusCode = 404;
                    throw error;
                }

                tournament.title = requestTournament.title;
                tournament.imageUrl = requestTournament.imageUrl;
                tournament.balls = requestTournament.balls;
                tournament.numberOfPlayers = requestTournament.numberOfPlayers;
                tournament.fee = requestTournament.fee;
                return tournament.save();
            })
            .then((tournament) => {
                response.status(200)
                    .json({ success: true, message: 'Club Updated!', tournament })
            })
            .catch((error) => {
                next(error);
            });
    },

    delete: (request, response, next) => {
        const clubId = request.params.clubId;
        const tournamentId = request.params.tournamentId;

        Promise.all([ Club.findById(clubId), Tournament.findById(tournamentId) ])
            .then(([ club, tournament ]) => {
                if (!club) {
                    const error = new Error('Club Not Found!');
                    error.statusCode = 404;
                    throw error;
                }

                if (!tournament) {
                    const error = new Error('Tournament Not Found!');
                    error.statusCode = 404;
                    throw error;
                }

                club.tournaments.pull(tournamentId);
                return Promise.all([ club.save(), Tournament.findByIdAndDelete(tournamentId) ]);
            })
            .then(() => {
                response.status(200)
                    .json({ success: true, message: 'Tournament Deleted!', tournamentId });
            })
            .catch((error) => {
                next(error);
            });
    },

    attend: (request, response, next) => {
        const tournamentId = request.params.tournamentId;
        const userId = request.userId;

        Promise.all([ User.findById(userId), Tournament.findById(tournamentId) ])
            .then(([ user, tournament ]) => {
                if (!user) {
                    return response.status(404)
                        .json({ success: false, message: 'Invalid Credentials!' });
                }

                if (!tournament) {
                    const error = new Error('Tournament Not Found!');
                    error.statusCode = 404;
                    throw error;
                }

                if (user.tournamentsAttended.includes(tournamentId) || tournament.playersRegistered.includes(userId)) {
                    const error = new Error('Tournament Already Attended!');
                    error.statusCode = 404;
                    throw error;
                }

                if (!user.tournamentsAttended.includes(tournamentId)) user.tournamentsAttended.push(tournamentId);
                if (!tournament.playersRegistered.includes(userId)) tournament.playersRegistered.push(userId);

                return Promise.all([ user.save(), tournament.save() ])
            })
            .then(() => {
                response.status(200)
                    .json({ success: true, message: 'Tournament Attended!', tournamentId });
            })
            .catch((error) => {
                next(error);
            });
    },

    leave: (request, response, next) => {
        const tournamentId = request.params.tournamentId;
        const userId = request.userId;

        Promise.all([ Tournament.findById(tournamentId), User.findById(userId) ])
            .then(([ tournament, user ]) => {
                if (!user) {
                    return response.status(404)
                        .json({ success: false, message: 'Invalid Credentials!' });
                }

                if (!tournament) {
                    const error = new Error('Tournament Not Found!');
                    error.statusCode = 404;
                    throw error;
                }

                if (!user.tournamentsAttended.includes(tournamentId) || !tournament.playersRegistered.includes(userId)) {
                    const error = new Error('Tournament Not Attended!');
                    error.statusCode = 404;
                    throw error;
                }

                tournament.playersRegistered.pull(userId);
                user.tournamentsAttended.pull(tournamentId);
                return Promise.all([ tournament.save(), user.save() ])
            })
            .then(() => {
                response.status(200)
                    .json({ success: true, message: 'Tournament Left!', tournamentId });
            })
            .catch((error) => {
                next(error);
            });
    },
};




