const { default: validator } = require('validator');
const AppError = require('../utils/appError');

// 針對錯誤id的錯誤回報
const handleCaseErrorDB = err => {
    const message = `Invalid ${err.path} : ${err.value}`;
    return new AppError(message, 400);
};

// 針對已存在項目的錯誤回報
const handleDuplicateFieldsDB = err => {
    const value = err.errmsg.match(/(["'])(\\?.)*?\1/)[0];
    console.log(value);
    const message = `Duplicate field value: ${value}. Please use another value`;
    return new AppError(message, 400);
};

// 處理欄位有效的錯誤回報
const handleValidationErrorDb = err => {
    const errors = Object.values(err.errors).map(el => el.message);
    const message = `Invalid input data. ${errors.join('. ')}`;
    return new AppError(message, 400);
};

const handleJWTError = () => {
    return new AppError('Invalid token, Please log in again!', 401);
};

const handleJWTExpiredError = () => {
    return new AppError('Your token has expired! Please log in again.', 401);
};

const sendErrorDev = (err, res) => {
    console.log(err.errmsg);
    res.status(err.statusCode).json({
        status: err.status,
        error: err,
        message: err.message,
        stack: err.stack
    });
};

const sendErrorProd = (err, res) => {
    // 客戶方面的錯誤，傳送錯誤訊息
    if (err.isOperational) {
        res.status(err.statusCode).json({
            status: err.status,
            message: err.message
        });
        // 程式方面的錯誤，不傳送詳細資訊給客戶
    } else {
        // 1) Log Error
        console.error('ERROR ', err);
        // 2) Send generic message
        res.status(500).json({
            status: 'error',
            message: 'Something went very wrong'
        });
    }
};

module.exports = (err, req, res, next) => {
    err.statusCode = err.statusCode || 500;
    err.status = err.status || 'error';

    if (process.env.NODE_ENV === 'development') {
        sendErrorDev(err, res);
    } else if (process.env.NODE_ENV === 'production') {
        let error = { ...err };
        console.log(error.name);

        if (err.name === 'CastError') {
            error = handleCaseErrorDB(error);
        }
        if (error.code === 11000) {
            error = handleDuplicateFieldsDB(err);
        }
        if (err.name === 'ValidationError') {
            error = handleValidationErrorDb(err);
        }
        if (err.name === 'JsonWebTokenError') {
            error = handleJWTError();
        }
        if (err.name === 'TokenExpiredError') {
            error = handleJWTExpiredError();
        }
        sendErrorProd(error, res);
    }
};
