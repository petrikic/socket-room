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
const store = new expressSession.MemoryStore();

var listRooms = [];

const generateSerial = () => {
    var result, i, j;
    result = '';
    for(j=0; j<32; j++) {
      if(j!=0 && j%8==0) 
        result = result + '-';
      i = Math.floor(Math.random()*16).toString(16).toUpperCase();
      result = result + i;
    }
    return result;
}

const existsRoom = (room) => {
    return listRooms.includes(room);
}



const createRoom = () =>{
    let room = generateSerial();
    listRooms.push(room);
    return room;
}


const removeRoom = (room) => {
    if(existsRoom(room)){
        listRooms.pop(room);
    }
}

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

const auth = (req, res, next) => {
    if(req.session.user){
        next();
    } else{
        return res.render('login.html');
    }
}

app.get('/', auth, (req, res) => {
    console.log(`Session id: ${req.sessionID}`);
    res.render('home.html');
});

app.post('/', (req, res) => {
    req.session.user = req.body.user;
    res.redirect('/');
});

app.get('/r/public/:id', auth, (req, res) => {
    id = req.params.id;
    if(!existsRoom(id)){
        res.render('room-404.html');
    } else {
        res.render('room.html');
    }
});

app.use((req, res, next) => {
    res.status(404).render('404.html');
});

io.on("connection", client => {
    var session = client.handshake.session;
    let room;
    console.log(`socket conectado: ${client.id}`);

    client.emit('listRooms', listRooms);
    client.on('joinRoom', (roomName) => {
        if(existsRoom(roomName)){
            client.join(roomName);
            room = roomName;
            console.log(`O cliente ${client.id} se conectou a sala ${roomName}`);
        }
    });

    client.on('createRoom', () =>{
        let newRoom = createRoom();
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
                removeRoom(room);
                client.broadcast.emit('closeRoom', room);
            }
        }, 800);
    });
    
});

server.listen(3000, () =>{
    console.log('Server rodando em http://localhost:3000');
});