const jwt = require('jsonwebtoken');
const { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError } = require('../utils/errors');
const checkUuId = require("./checkUuId");

const checkIsUserLogged = async (token,projectId) => {
    try {
        const jwtKey = process.env.JWT_KEY;
        let bearerToken = token.split("Bearer ");
        bearerToken = bearerToken[bearerToken.length - 1];
        const decoded = jwt.decode(bearerToken);

        if(!jwt.verify(bearerToken, jwtKey)) throw BadRequestError("Token is not verified")
        
        if(!decoded) throw BadRequestError("Token is not decoded")
        const userId = decoded.userId;
        const email = decoded.email;

        if (!userId) throw BadRequestError("User id is not found in token")
        if (!email) throw BadRequestError("Email is not found in token")
            
        if (!checkUuId(userId)) throw BadRequestError("User id is not valid uuid")

        if(projectId===null) throw BadRequestError("Project id is not found in token")
        if(projectId && !checkUuId(projectId)) throw BadRequestError("Project id is not valid uuid")
        return { email,userId };

    } catch (error) {
        if (error.status) {
            throw error;
        }
        throw new NotAuthorizedError("User is not authorized");
    }
}

module.exports = checkIsUserLogged;