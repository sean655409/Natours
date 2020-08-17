const User = require('./../modules/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');

const filterObj = (obj, ...allowFields) => {
    const newObj = {};
    Object.keys(obj).forEach(el => {
        if (allowFields.includes(el)) {
            newObj[el] = obj[el];
        }
    });
    return newObj;
};

exports.getAllUser = async (req, res, next) => {
    const users = await User.find();

    // SEND QUERY
    res.status(200).json({
        status: 'success',
        results: users.length,
        data: {
            users
        }
    });
};

exports.updateMe = catchAsync(async (req, res, next) => {
    // 1) Create error if user POSTs password data
    if (req.body.password || req.body.passwordConfirm) {
        return next(
            new AppError(
                'This route is not for password update, please use updateMyPassword',
                400
            )
        );
    }
    // 2) Update user document
    // 只允許修改name、email欄位
    const filteredBody = filterObj(req.body, 'name', 'email');
    const updatedUser = await User.findByIdAndUpdate(
        req.user._id,
        filteredBody,
        {
            new: true,
            runValidators: true
        }
    );

    res.status(200).json({
        status: 'success',
        user: updatedUser
    });
});

exports.deleteMe = catchAsync(async (req, res, next) => {
    await User.findByIdAndUpdate(req.user._id, { active: false });

    res.status(204).json({
        status: 'success'
    });
});

exports.postUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined yey!'
    });
};

exports.getUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined yey!'
    });
};
exports.updateUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined yey!'
    });
};
exports.deleteUser = (req, res) => {
    res.status(500).json({
        status: 'error',
        message: 'This route is not defined yey!'
    });
};
