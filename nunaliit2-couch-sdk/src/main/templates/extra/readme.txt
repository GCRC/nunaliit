Installing Nunaliit as a Service
================================

This section explains how to run an instance of Nunaliit atlas as a service. In this section,
when a file name is in the form "nunaliit-XXX", it should be assumed that the XXX is the
name of the atlas.

Using Linux with systemd (recommended)
--------------------------------------

Platforms running Ubuntu with version 16.04 or newer should use the following procedures
to install a Nunaliit instance as a service. If you are upgrading from old SysVinit to systemd,
be sure all the old init.d and rc.d nunaliit scripts are cleaned out (using a command like 
update-rc.d -f nunaliit remove) before enabling the systemd scripts.

Tip: In order to save grief later when upgrading Nunaliit, it is recommended to use a symlink
like 'nunaliit' to point to the active nunaliit build being run. Then modify the .service file
to reference the symlink rather than the specific build folder.

sudo cp nunaliit-XXX.service /etc/systemd/system/.
sudo systemctl enable nunaliit-XXX
sudo systemctl start nunaliit-XXX


Using Linux with SysVinit (depricated)
--------------------------------------

Platforms running Ubuntu with a version older than 16.04 should use the following procedures
to install a Nunaliit instance as a service. 

A script located in the "extra" sub-directory and called nunaliit-XXX.sh can be used
to run the atlas as a daemon. The syntax for this script is:

nunaliit-XXX.sh {start|stop|restart|check}

The start command is used to initiate the Nunaliit atlas daemon. 
The stop command is used to terminate the currently running daemon. 
The restart command combines both stopping and starting the daemon.
The check command is used verify the configuration and whether the daemon is running, or not.

To run as a service, this file should first be edited and the line where the user is set
should be changed to the name of the user under which the service should run (NUNALIIT_USER).
Then, the following commands should be issued
> cd .../extra
> sudo cp nunaliit-XXX.sh /etc/init.d/.
> cd /etc/init.d
> sudo update-rc.d nunaliit-XXX defaults 95

