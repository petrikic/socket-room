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

app.use(express.static(path.join(__dirname, 'public')));
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

app.get('/', (req, res) => {
    //req.session.nome = "Usuario";
    res.render('index');
});

app.post('/login', (req, res) => {
    res.send(req.body.user);
});

io.on("connection", client => {
    console.log(`socket conectado: ${client.id}`);
    var session = client.handshake.session;
    client.on('toServer', msg => {
        msg = "<b>" + session.nome + ": </b " + msg + "<br>";
        client.emit('toClient', msg);
        client.broadcast.emit('toClient', msg);
    });
});

server.listen(3000, () =>{
    console.log('Server rodando em http://localhost:3000');
});