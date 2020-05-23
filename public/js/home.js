var socket = io('localhost:3000');

        function renderMessage(value){
            $('.messages').append('<div class = "message"><strong>' + value.author + '</strong>: ' + value.message + '</div>');
        }

        socket.on('previousMessages', function(messages){
            for(message of messages){
                renderMessage(message);
            }
        });

        socket.on('receivedMessage', value => {
            renderMessage(value);
        })

        $('#chat').submit(function(event){
            event.preventDefault();

            var message = $('input[name = message]').val();
            
            if(message.length){
 
                socket.emit('sendMessage', message);
            }
        });