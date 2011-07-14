setup_stomp = function(port, channel, username, password, on_msg_recv) {

    stomp = new STOMPClient();
    
    stomp.onconnectedframe = function() {
        stomp.ready = true;
        stomp.subscribe(channel);
        console.log('STOMP SUBSCRIBED TO', channel);
    };
   
    stomp.onmessageframe = function(msg) {
        on_msg_recv(msg.body);
    };
    
    stomp.onerror = function(error) {
        console.log("STOMP ERROR", error);
    };
    stomp.onerrorframe = function(msg) {
        console.log("STOMP ERROR", msg);
    };
    
    stomp.connect(document.domain, port, username, password);
    console.log('STOMP CONNECTED');
};

