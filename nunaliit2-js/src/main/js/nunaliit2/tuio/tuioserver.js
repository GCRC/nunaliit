var osc = require('osc');
var express = require('express');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var app = express();

app.use(express.static(__dirname));

// Create an osc.js UDP port listening on 3333
var udpPort = new osc.UDPPort({
    localAddress: '0.0.0.0',
    localPort: 3333
});

app.get('/', function(req, res) {
    res.sendFile(__dirname + '/tuio.html');
});

// Constructors for update objects
function CursorUpdate() {
	this.alive = new Array();
	this.set = new Object();
}
function TangibleUpdate() {
	this.alive = new Array();
	this.set = new Object();
}

// Listen for incoming OSC bundles
udpPort.on("bundle", function (oscBundle) {
    var curUpdate = new CursorUpdate();
    var tanUpdate = new TangibleUpdate();
    var redundant = false;

    // Process each message in the bundle to build updates
    oscBundle.packets.map(function(p) {
        if (p.address == '/tuio/2Dcur') {
            // Cursor update
            if (p.args[0] == 'alive') {
                // Initial alive message
            	for (var i = p.args.length - 1; i >= 1; i--) {
            		// Add cursor to the list of currently alive cursors
            		curUpdate.alive.push(p.args[i]);
            	}
            } else if (p.args[0] == 'set') {
                // Set position message
            	var instance = p.args[1];
            	var coords = [p.args[2], p.args[3]];
                curUpdate.set[instance] = coords;
            } else if (p.args[0] == 'fseq') {
                var seq = p.args[1];
                if (seq == -1) {
                    redundant = true;
                }
            }
        } else if (p.address == '/tuio/2Dobj') {
            // Tangible update
        	if (p.args[0] == 'alive') {
                // Initial alive message
                for (var i = p.args.length - 1; i >= 1; i--) {
            		// Add tangible to the list of currently alive tangibles
            		tanUpdate.alive.push(p.args[i]);
            	}
            } else if (p.args[0] == 'set') {
                // Set position message [instance, id, x, y, angle]
            	var instance = p.args[1];
            	var coords = [p.args[2], p.args[3], p.args[4], p.args[5]];
                tanUpdate.set[instance] = coords;
            } else if (p.args[0] == 'fseq') {
                var seq = p.args[1];
                if (seq == -1) {
                    redundant = true;
                }
            }
        }

    });

    // Send accumulated cursor and tangible updates
    if (!redundant) {
        io.emit('cursor update', curUpdate);
        io.emit('tangibles update', tanUpdate);
    }
});

// Open the UDP socket to listen for OSC
udpPort.open();

// Open the web socket to talk to the browser
http.listen(3000, function() {
    console.log('listening on *:3000');
});
