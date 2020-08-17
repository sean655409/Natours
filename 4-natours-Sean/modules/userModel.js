const crypto = require('crypto');
const mongoose = require('mongoose');
const validator = require('validator');
const bcrypt = require('bcryptjs');

const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'A user must have name.']
    },
    email: {
        type: String,
        required: [true, 'A user must have email.'],
        unique: true,
        lowercase: true,
        validate: [validator.isEmail, 'Please provide a valid email']
    },
    photo: {
        type: String
    },
    role: {
        type: String,
        enum: ['user', 'guide', 'guide-leader', 'admin'],
        default: 'user'
    },
    password: {
        type: String,
        required: [true, 'Please prvoid password'],
        minlength: 8,
        select: false
    },
    passwordConfirm: {
        type: String,
        required: [true, 'Please prvoid password'],
        validate: {
            // this only works on CREATE and SAVE!
            validator: function(el) {
                return el === this.password;
            },
            message: 'Passwords are not the same'
        }
    },
    passwordChangedAt: Date,
    passwordResetToken: String,
    passwordResetExpires: Date,
    active: {
        type: Boolean,
        default: true,
        select: false
    }
});

userSchema.pre('save', async function(next) {
    // only run this function if password was actually modified
    if (!this.isModified('password')) return next();
    // hash the password with cost of 12
    this.password = await bcrypt.hash(this.password, 12);
    // delete passwordConfirm field
    this.passwordConfirm = undefined;
    next();
});

// 在修改密碼後，將密碼修改時間存入db
userSchema.pre('save', function(next) {
    if (!this.isModified('password') || this.isNew) {
        return next();
    }
    // 有時token會比較存入db還要快，會導致token無法登入
    this.passwordChangedAt = Date.now() - 1000;
    next();
});

// 使用正規表達式，對所有find開頭的動作都起作用
userSchema.pre(/^find/, function(next) {
    this.find({ active: { $ne: false } });
    next();
});

userSchema.methods.correctPassword = async function(
    candidatePassword,
    userPassword
) {
    return await bcrypt.compare(candidatePassword, userPassword);
};

userSchema.methods.changedPasswordAfter = function(JWTTimestamp) {
    if (this.passwordChangedAt) {
        const changedTimestamp = parseInt(
            this.passwordChangedAt.getTime() / 1000,
            10
        );

        return JWTTimestamp < changedTimestamp;
    }
    // false means NOT changed
    return false;
};

userSchema.methods.createPasswordResetToken = function() {
    const resetToken = crypto.randomBytes(32).toString('hex');

    this.passwordResetToken = crypto
        .createHash('sha256')
        .update(resetToken)
        .digest('hex');

    console.log({ resetToken }, this.passwordResetToken);

    // 6000 second
    this.passwordResetExpires = Date.now() + 10 * 60 * 1000;

    return resetToken;
};
const User = mongoose.model('User', userSchema);
module.exports = User;
