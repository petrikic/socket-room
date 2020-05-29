express = require('express');
router = express.Router();
const user = require('../controller/userController');
const rooms = require('../controller/roomController');

const auth = (req, res, next) => {
    if(req.session.user){
        next();
    } else {
        return res.render('login.html');
    }
}

router.get('/', auth, (req, res) => {
    console.log(`Session id: ${req.sessionID}`);
    res.render('home.html');
});

router.post('/', (req, res) => {
    usr = req.body;
    if(req.session.user){
        return res.redirect('/');
    }
    if(user.find(usr)){
        req.session.user = usr.username
        res.redirect('/');
    }

});

router.get('/r/public/:id', auth, (req, res) => {
    id = req.params.id;
    if(!rooms.exists(id)){
        res.render('room-404.html');
    } else {
        res.render('room.html');
    }
});

router.use((req, res, next) => {
    res.status(404).render('404.html');
});


module.exports = router;