const express = require('express');
const app = express();

// Middleware，作用於解析req、res於JSON格式，沒有這個，JSON格式的資料會變成undefined
app.use(express.json());

// 自製的middleware，每個請求都會經過這個middleware
app.use((req, res, next) => {
    console.log('hello miidleware!');
    next(); // Middleware最後一定要next()交棒給下一個程序，不交棒會導致整個node.js卡死在這裡
});

// 這個自製的middleware只會作用於'/api/foo'上
app.use('/api/foo', (req, res, next) => {
    console.log('middleware for /api/foo');
    next();
});

// 直接使用get取得api的呼叫
app.get('/api/hello', (req, res) => {
    console.log('hello get api');
    res.status(200).json({
        message: 'hello api',
    });
});

// 使用route取得url，再根據method採取不同作為
// 127.0.0.1:3000/api/test
app.route('/api/test')
    .get((req, res) => {
        console.log('get request');
        res.status(200).json({
            message: 'gg',
        });
    })
    .post((req, res) => {
        console.log('post request');
        res.status(200).json({
            message: 'gg',
        });
    });

// 使用:id可以在req.params中找到id這個網址輸入的變數，後面的:x?代表x變數可以不填入
// 127.0.0.1:3000/api/test/1
app.route('/api/test/:id/:x?').get((req, res) => {
    console.log(req.params); // { id: '1', x: undefined }
    console.log(req.params.id); // 1
    res.status(200).json({
        status: 'success',
    });
});

// Mounting Router
// 這個Router只會用於foo這個資源上
const fooRouter = express.Router();
// 於作用在/api/foo的middleware上設定Router
app.use('/api/foo', fooRouter);

// 作用於127.0.0.1:3000/api/foo，因為前面已經經過middleware濾掉/api/foo了，所以直接'/'
fooRouter.route('/').get((req, res) => {
    console.log('get /api/foo');
    res.status(200).json({
        message: 'call /api/foo/ success',
    });
});

const port = 3000;
app.listen(port, () => {
    console.log('run at 127.0.0.1:3000');
});
