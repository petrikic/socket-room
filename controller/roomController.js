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

exports.exists = existsRoom;
exports.create = createRoom;
exports.remove = removeRoom;
exports.list = listRooms;