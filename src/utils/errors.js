const fs = require('fs');

class Error {
    constructor(errorType,{ errMsg, status, title }) {
        this.errorType = errorType,
            this.title = title ? title : "Bir hata oluştu!",
            this.detail = errMsg,
            this.status = status;
    }
}

const HttpServerError = (errMsg, status, title) => {
    if (isNaN(status)) status = 500;
    return new Error("HttpServerError", { errMsg, status, title });
}
const NotFoundError = (errMsg, status, title) => {
    if (isNaN(status)) status = 404;
    return new Error("NotFoundError", { errMsg, status, title });
}
const BadRequestError = (errMsg, status, title) => {
    if (isNaN(status)) status = 422;
    return new Error("BadRequestError", { errMsg, status, title });
}
const NotAuthorizedError = (errMsg, status, title) => {
    if (isNaN(status)) status = 401;
    return new Error("NotAuthorizedError", { errMsg, status, title });
}



module.exports = { HttpServerError, NotAuthorizedError, BadRequestError, NotFoundError };