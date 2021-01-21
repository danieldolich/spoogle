const express = require('express');
const spotController = require('../controllers/spotController.js');

const router = express.Router();

/**
 * Generates a random string containing numbers and letters
 * @param  {number} length The length of the string
 * @return {string} The generated string
 */

router.get('/login', spotController.reqAuth, (req, res) => res.redirect(res.locals.spotRedirect));

router.get('/callback/', spotController.getAuth, spotController.getToken, (req, res) => res.status(200).cookie('token', res.locals.authorization, { maxAge: 3600000 }).redirect('http://localhost:8080'));
// res.status(200).json(res.locals.authorization));

// router.get('/refresh_token');
router.get('/rec/', spotController.getRecs, (req, res) => {
  res.status(200).json(res.locals.queryResults);
});

// router to add song to favorites
// router.put('/rec/', spotController.getToken, spotController.addFav, (req, res) => {
//   return res.sendStatus(200);
// });

module.exports = router;
