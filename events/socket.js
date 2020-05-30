module.exports =  (server) => {
    const rooms = require('../controller/roomController');
    const io = require('socket.io')(server);

    
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

    return io;
}