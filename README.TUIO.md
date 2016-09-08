# Using Nunaliit with TUIO (Reactable)

TUIO support in Nunaliit consists of two parts: a server written in NodeJS
receives OSC bundles from the TUIO device (via UDP port 3333) and emits events
translated to JSON, and browser client code in the Nunaliit web app which
receives these events (via web socket port 3000) to control the atlas.

## Requirements

* NodeJS, with packages express, osc, and socket.io
* A modern web browser, Firefox and Chrome are known to work

## Running

The TUIO sources are in the Nunaliit tree at
nunaliit2-js/src/main/js/nunaliit2/tuio/

Build/install Nunaliit as usual and the TUIO client will be included in the
demo atlas application.

For TUIO to work, the server must be running:

    cd nunaliit2-js/src/main/js/nunaliit2/tuio/
    node ./tuioserver.js

Configure the TUIO device to send to port 3333.  If you do not have a physical
TUIO device (e.g. a Reactable), you can use one of the TUIO simulators listed at http://www.tuio.org/?software

For example:

    cd TUIO_Simulator
    java -jar ./TuioSimulator.jar
