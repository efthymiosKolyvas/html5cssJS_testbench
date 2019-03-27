var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');

var newsProcessor = require('./processPosts.js')
var pug = require('pug');
const marked = require('marked');

var router = express.Router();
var app = express();

// build news posts
const pugCompiler = pug.compileFile('./views/newPost.pug');
var operationJSON = {
    type: 'json',
    parseFunction: JSON.parse,
    compileFunction: pugCompiler
};
var operationMD = {
    type: 'md',
    parseFunction: undefined,
    compileFunction: marked
};
newsProcessor.buildHtmlPages('./views/json/', '.json', ['templ', 'pack'], operationJSON);
newsProcessor.buildHtmlPages('./views/md/', '.md', ['templ', 'pack', 'draft'], operationMD);


app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());


app.use(express.static(path.join(__dirname, 'public') , {index: 'rayStyle.html'}));
app.use(express.static(path.join(__dirname, 'public/fusedHTML')),  // fallback dir, if link not found under 'public', but remember: the link must include the file extension as '.html', otherwise it tries to render it from the views w/ a render function
    router.use( function(req,res,next) {
        res.redirect('errorPage.html');
    })
);



// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
