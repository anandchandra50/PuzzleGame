var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.post('/', function(req, res, next) {
  res.render('index');
});

router.get('/easy', function(req, res, next){
  res.render('puzzle', { difficulty: 'easy' });
}); 

router.get('/medium', function(req, res, next){
  res.render('puzzle', { difficulty: 'medium' });
}); 

router.get('/hard', function(req, res, next){
  res.render('puzzle', { difficulty: 'hard' });
}); 
/*
router.get('/easy', function(req, res, next){
  res.render('puzzle', { difficulty: 'easy' });
}); */

module.exports = router;
