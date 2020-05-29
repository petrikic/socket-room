const KEY = 'user-id';
const SECRET = 'batalhanaval'
const express = require('express');
const cookieParser = require('cookie-parser');
const expressSession = require('express-session');
const bodyParser = require('body-parser');
const path = require('path');
const rooms = require('./controller/roomController');
const root = require('./routes/root');

const app = express();
const server = require('http').createServer(app);
const io = require('socket.io')(server);
const cookie = cookieParser(SECRET);
const store = new expressSession.MemoryStore();

app.use(express.static(path.join(__dirname, 'public')));
app.set('views', path.join(__dirname, 'views'));
app.engine('html', require('ejs').renderFile);
app.set('view engine', 'ejs');
app.use(cookie);
app.use(expressSession({
    secret: SECRET,
    name: KEY,
    resave: true,
    saveUninitialized: true,
    cookie: {maxAge: 20000},
    store: store
}));
app.use(bodyParser.urlencoded({extended: false}));
app.use(bodyParser.json());

app.use('/', root);

io.use((socket, next) => {
    let data = socket.request;
    cookie(data, {}, (err) =>{
        let sessionID = data.signedCookies[KEY];
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

io.on("connection", client => {
    var session = client.handshake.session;
    let room;
    console.log(`socket conectado: ${client.id}`);

    client.emit('listRooms', rooms.list);
    client.on('joinRoom', (roomName) => {
        if(rooms.exists(roomName)){
            client.join(roomName);
            room = roomName;
            console.log(`O cliente ${client.id} se conectou a sala ${roomName}`);
        }
    });

    client.on('createRoom', () =>{
        let newRoom = rooms.create();
        client.emit('room', newRoom);
        client.broadcast.emit('newRoom', newRoom);
    });

    client.on('sendMessage', message => {
        let value = {author: session.user, message: message};
        client.broadcast.to(room).emit('receivedMessage', value);
        value.author = "Você";
        client.emit('receivedMessage', value);

    })
    client.on("disconnect", () =>{
        console.log(`socket desconectado: ${client.id}`);
        setTimeout(() =>{
            if(!io.sockets.adapter.rooms[room]){
                rooms.remove(room);
                client.broadcast.emit('closeRoom', room);
            }
        }, 800);
    });
    
});

server.listen(3000, () =>{
    console.log('Server rodando em http://localhost:3000');
});