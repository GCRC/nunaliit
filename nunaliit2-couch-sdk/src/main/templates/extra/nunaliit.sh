#!/usr/bin/env bash

# ************************************************************
# THIS SCRIPT IS GENERATED AUTOMATICALLY. DO NOT EDIT BY HAND.
# ************************************************************

# NUNALIIT_CMD
#   The Nunaliit command line application
#   
# NUNALIIT_BIN_DIR
#   The location where binaries, such as nunaliit command line application,
#   is kept.
#   
# NUNALIIT_PID
#   The Nunaliit PID file
#   
# NUNALIIT_USER
#   if set, then used as a username to run the server as
#
# NUNALIIT_ATLAS_DIR
#   where the atlas is located
#
#NUNALIIT_CMD=
NUNALIIT_BIN_DIR=@NUNALIIT_BIN_DIR@
NUNALIIT_PID=/var/lock/nunaliit-@ATLAS_NAME@.pid
#NUNALIIT_USER=
NUNALIIT_ATLAS_DIR=@ATLAS_DIR@
NUNALIIT_ATLAS_NAME=@ATLAS_NAME@


# Include external configuration to override default values
if [ -e "@ATLAS_DIR@/extra/config.sh" ]; then
	source "@ATLAS_DIR@/extra/config.sh"
fi


# ========================
# Usage
# ========================

usage()
{
    echo "Usage: ${0##*/} [-d] {start|stop|restart|check} [ CONFIGS ... ] "
    exit 1
}

[ $# -gt 0 ] || usage

##################################################
# Some utility functions
##################################################
running()
{
  local PID=$(cat "$1" 2>/dev/null) || return 1
  kill -0 "$PID" 2>/dev/null
}

##################################################
# Get the action & configs
##################################################
CONFIGS=()
NO_START=0
DEBUG=0

while [[ $1 = -* ]]; do
  case $1 in
    -d) DEBUG=1 ;;
  esac
  shift
done
ACTION=$1
shift

##################################################
# Figure out NUNALIIT_CMD
##################################################

if [ -z "$NUNALIIT_CMD" ]
then
   NUNALIIT_CMD="$NUNALIIT_BIN_DIR/nunaliit"
fi

##################################################
# Do the action
##################################################
case "$ACTION" in
  start)
    echo -n "Starting Nunaliit: "

    if type start-stop-daemon > /dev/null 2>&1 
    then
      unset CH_USER
      if [ -n "$NUNALIIT_USER" ]
      then
        CH_USER="--chuid $NUNALIIT_USER"
      fi
      if start-stop-daemon --start --pidfile "$NUNALIIT_PID" $CH_USER --background --make-pidfile --startas "$NUNALIIT_CMD" -- --atlas-dir "$NUNALIIT_ATLAS_DIR" run
      then
        sleep 1
        if running "$NUNALIIT_PID"
        then
          echo "OK"
        else
          echo "FAILED"
        fi
      fi

    else

      echo "Can not start Nunaliit: start-stop-daemon is required"
      exit 1

    fi

    ;;

  stop)
    echo -n "Stopping Nunaliit: "
    if type start-stop-daemon > /dev/null 2>&1; then
      start-stop-daemon --stop --pidfile "$NUNALIIT_PID" -startas "$NUNALIIT_CMD" --signal HUP
      
      TIMEOUT=30
      while running "$NUNALIIT_PID"; do
        if (( TIMEOUT-- == 0 )); then
          start-stop-daemon --stop --pidfile "$NUNALIIT_PID" -startas "$NUNALIIT_CMD" --signal KILL
        fi

        sleep 1
      done

      rm -f "$NUNALIIT_PID"
      echo OK
    else

      echo "Can not stop Nunaliit: start-stop-daemon is required"
      exit 1

    fi

    ;;

  restart)
    NUNALIIT_SH=$0

    "$NUNALIIT_SH" stop "$@"
    "$NUNALIIT_SH" start "$@"

    ;;

  check)
    echo "Checking arguments to Jetty: "
    echo "NUNALIIT_CMD        =  $NUNALIIT_CMD"
    echo "NUNALIIT_PID        =  $NUNALIIT_PID"
    echo "NUNALIIT_USER       =  $NUNALIIT_USER"
    echo "NUNALIIT_ATLAS_DIR  =  $NUNALIIT_ATLAS_DIR"
    echo "NUNALIIT_ATLAS_NAME =  $NUNALIIT_ATLAS_NAME"
    echo
    
    if [ -f "$NUNALIIT_PID" ]
    then
      echo "Nunaliit running pid=$(< "$NUNALIIT_PID")"
      exit 0
    fi
    exit 1

    ;;

  *)
    usage

    ;;
esac

exit 0

