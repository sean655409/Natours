const { promisify } = require('util');
const jwt = require('jsonwebtoken');
const User = require('./../modules/userModel');
const catchAsync = require('./../utils/catchAsync');
const AppError = require('./../utils/appError');
const { decode } = require('punycode');
const sendEmail = require('./../utils/mail.js');
const crypto = require('crypto');

const signToken = id => {
    return jwt.sign({ id: id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRS_IN
    });
};

const createSendToken = (user, statusCode, res) => {
    const token = signToken(user._id);
    const cookieOptions = {
        expires: new Date(
            Date.now() + process.env.JWT_COOKIE_EXPIRS_IN * 60 * 60 * 60 * 1000
        ),
        //    secure: true, // 這個cookie只會用於有加密的https中
        httpOnly: true //這個cookie不能被瀏覽器用任何方式處理、修改
    };
    if (process.env.NODE_ENV === 'production') {
        cookieOptions.secure = true;
    }

    res.cookie('jwt', token, cookieOptions);
    user.password = undefined;
    res.status(statusCode).json({
        status: 'success',
        token,
        data: {
            user
        }
    });
};

exports.signup = catchAsync(async (req, res, next) => {
    const newUser = await User.create({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        passwordConfirm: req.body.passwordConfirm,
        passwordChangedAt: req.body.passwordChangedAt,
        role: req.body.role
    });
    /*
    const token = signToken(newUser._id);

    res.status(201).json({
        status: 'success',
        token,
        data: {
            user: newUser
        }
    });
    */
    createSendToken(newUser, 201, res);
});

exports.login = catchAsync(async (req, res, next) => {
    const { email, password } = req.body;

    if (!email || !password) {
        return next(new AppError('Please provide email and password', 400));
    }

    const user = await User.findOne({ email: email }).select('+password');

    if (!user || !(await user.correctPassword(password, user.password))) {
        return next(new AppError('Incorrect email or password', 401));
    }
    /*
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
    */
    createSendToken(user, 200, res);
});

// 保護router中的資源不被未登入者存取
exports.protect = catchAsync(async (req, res, next) => {
    // 判斷有無token
    // 1) Getting token and check of it's there
    let token = '';
    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];
    }
    if (!token) {
        return next(
            new AppError(
                'You are not logged in! Please log in to get access.',
                401
            )
        );
    }
    // 認證token，jwt.verify是promise function，使用promisify來讓程式碼好讀
    // 2) Verification token
    const decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);

    // 確認這個token代表的user仍然存在
    // 3) Check if user still exists
    const freshUser = await User.findById(decoded.id);
    if (!freshUser) {
        return next(
            new AppError(
                'The user belonging to token token does no longer exists.',
                401
            )
        );
    }

    // 判斷這個user有無在token生成後修改密碼
    // 4) Check if user changed password after the token was issued
    if (freshUser.changedPasswordAfter(decoded.iat)) {
        return next(new AppError('User recently changed password', 401));
    }
    // 將確認完身分的使用者資料(原本只有id，現在有role跟其他資料)加入req中，
    req.user = freshUser;
    console.log(req.user.name);
    next();
});

// 讓動作只給有權限的使用者使用
exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        // 輸入的roles是['admin', 'guide-leader']，判斷現在使用者身分有沒有在其中
        if (!roles.includes(req.user.role)) {
            return next(
                new AppError(
                    'You do not have permission to perform this action.',
                    403
                )
            );
        }
        next();
    };
};

exports.forgetPassword = catchAsync(async (req, res, next) => {
    // 1) Get user based on POSTed email
    const user = await User.findOne({ email: req.body.email });
    console.log(user);
    if (!user) {
        return next(new AppError('There is no user with email address.', 404));
    }

    // 2) Generate the random reset token
    // 存入DB中的token是編碼過的
    const resetToken = user.createPasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // 3) Send it to user's email
    const resetURL = `${req.protocol}://${req.get(
        'host'
    )}/api/v1/user/resetPassword/${resetToken}`;
    const message = `Forgot your password? Submit a PATCH request with your new password to ${resetURL}`;

    try {
        await sendEmail({
            email: user.email,
            subject: 'Your password reset token (valid for 10 min)',
            message
        });
        // 這邊的resetToken是我偷吃步用的，要移除
        res.status(200).json({
            status: 'success',
            message: 'Token send to email.',
            resetURL
        });
    } catch (err) {
        user.passwordResetToken = undefined;
        user.passwordResetExpires = undefined;
        user.save({ validateBeforeSave: false });

        return next(new AppError('There was an errir sending the email', 500));
    }
});

exports.resetPassword = catchAsync(async (req, res, next) => {
    console.log(req.body);
    console.log(req.params.token);
    // 1) Get user based on the token
    // 將取到的token再重新編碼一次，用編碼過的token為搜尋依據
    const hashedToken = crypto
        .createHash('sha256')
        .update(req.params.token)
        .digest('hex');
    // 2) If token has not expired, and there is user, set the new password
    // 下DB query的時候，就可以將時間判斷加進去
    const user = await User.findOne({
        passwordResetToken: hashedToken,
        passwordResetExpires: { $gt: Date.now() }
    });

    if (!user) {
        return next(new AppError('Token is invalid or has expired', 400));
    }

    // 這邊確認密碼、確認密碼相同的工作，已經寫在Model中了，如果不符合，會在user.save中跳錯
    user.password = req.body.password;
    user.passwordConfirm = req.body.passwordConfirm;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // 3) Update changedPasswordAt property for the user
    //user.passwordChangedAt = Date.now();
    //await user.save();
    // 4) Log the user in, send JWT
    /*
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });
    */
    createSendToken(user, 200, res);
});

exports.updateMyPassword = catchAsync(async (req, res, next) => {
    const { currentPassword, newPassword, newPasswordConfirm } = req.body;

    // 1) Get user from collection
    const user = await User.findById(req.user._id).select('+password');
    // 2) Check if POSTed current password is correct

    if (
        !user ||
        !(await req.user.correctPassword(currentPassword, user.password))
    ) {
        return next(new AppError('Incorrect password', 401));
    }
    // 3) If so, update password
    user.password = newPassword;
    user.passwordConfirm = newPasswordConfirm;
    await user.save();
    // 4) Log user in, send JWT
    /*
    const token = signToken(user._id);
    res.status(200).json({
        status: 'success',
        token
    });*/
    createSendToken(res, 200, user._id);
});
