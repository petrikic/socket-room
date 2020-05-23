const KEY = 'user-id';
const SECRET = 'batalhanaval'
const express = require('express');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cookie = cookieParser(SECRET);
var store = new expressSession.MemoryStore();

app.use(express.static('public'));
app.set('views', path.join(__dirname, 'public'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(cookie);
app.use(expressSession({
    secret: SECRET,
    name: KEY,
    resave: true,
    saveUninitialized: true,
    store: store
}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

io.use((socket, next) => {
    var data = socket.request;
    cookie(data, {}, (err) =>{
        var sessionID = data.signedCookies[KEY];
        store.get(sessionID, (err, session) => {
            if(err || !session){
                return next(new Error('Acesso negado!'));
            } else {
                socket.handshake.session = session;
                return next();
            }
        });
    });
});


app.get('/*', (req, res) => {
    console.log(`Session id: ${req.sessionID}`);
    if(req.session.user){
        return res.render('home.html');
    }
    res.render('login.html');
});

app.post('/home', (req, res) => {
    req.session.user = req.body.user;
    res.render('home.html');
});

io.on("connection", client => {
    var session = client.handshake.session;
    console.log(`socket conectado: ${client.id}`);

    client.on('sendMessage', message => {
        let value = {author: session.user, message: message};
        client.broadcast.emit('receivedMessage', value);
        client.emit('receivedMessage', value);

    })
    
});

server.listen(3000, () =>{
    console.log('Server rodando em http://localhost:3000');
});