module.exports = fn => {
    //fn(req, res, next).catch(next);
    return (req, res, next) => {
        fn(req, res, next).catch(next);
    };
};
