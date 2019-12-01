const jwt = require('jsonwebtoken');

module.exports = {
    isAdmin: (request, response, next) => {
        const authHeader = request.get('Authorization');
        if (!authHeader) {
            return response.status(401)
                .json({ message: 'Not Authorized!' });
        }

        const token = authHeader.split(' ')[1];

        let decodedToken;
        try {
            decodedToken = jwt.verify(token, 'verysecuresecret');
            if (decodedToken.roles.length === 0) {
                return response.status(401)
                    .json({ message: 'Not Authorized!' });
            }
        } catch (error) {
            return response.status(401)
                .json({ message: 'Token Is Invalid!', error });
        }

        request.userId = decodedToken.userId;
        next();
    }
};
