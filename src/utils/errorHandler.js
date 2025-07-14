const errorHandler = (err, req, res, next) => {
    console.log(err);
    const statusCode = err.status || 500;
    const errorMessage = err.detail || "Server Hatası";
    
    return res.status(statusCode).send({
        title: err.title,
        status: statusCode,
        detail: errorMessage
    });
};

module.exports = errorHandler;