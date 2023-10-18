const createError = require('http-errors');
const express = require('express');
const path = require('path');
const cors = require('cors');
const logger = require('morgan');
const dotenv = require('dotenv');
const cookieParser = require('cookie-parser');

const authRouter = require('../routes/auth');
const userRouter = require('../routes/user');
const postRouter = require('../routes/post');
const commentRouter = require('../routes/comment');

dotenv.config();
const app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(cors());
app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/v1/auth', authRouter);
app.use('/v1/user', userRouter);
app.use('/v1/post', postRouter);
app.use('/v1/post/comment', commentRouter);

// catch 404 and forward to error handler
app.use(function (req, res, next) {
  next(createError(404));
});

// error handler
app.use(function (err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
