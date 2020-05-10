var express = require('express');
var router = express.Router();
var country = require('countryjs');

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index');
});

router.get("/population", function(req, res, next){
  
  res.json({
    "population": country.population(req.query.country.toUpperCase())
  });

})

module.exports = router;
