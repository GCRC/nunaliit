**Please note**: Things can change and these instructions may no longer be applicable. If something isn't working, please consult the official documentation for the respective component to find the latest/greatest way of installing.

Before starting, make sure your repositories and system are up to date:

    sudo apt update
    sudo apt full-upgrade

And consider rebooting if core libraries or kernel updates were part of the updates:

    sudo reboot

### Installing Headless Java JRE on Ubuntu 18.04

    sudo apt install -y openjdk-8-jre-headless

**Note**: If you have any other openjdk versions, including newer versions, uninstall them to avoid problems. If you are planning to develop the nunaliit framework itself, see the [[Nunaliit Documentation for Developers]] for some important info about installing the `openjdk-8-jdk-headless` instead of `openjdk-8-jre-headless`.

### Installing latest Couch DB from Apache Foundation on Ubuntu 18.04

Ensure you are running a Nunaliit build newer than [this commit](https://github.com/GCRC/nunaliit/commit/5826d0df0cdb17641aeb524323114c7eb5a28541) on April 12, 2018. [Issue #733](https://github.com/GCRC/nunaliit/issues/733) documents the changes made to Nunaliit to support CouchDB 2.x.

**Please Note**: Nunaliit currently supports couchdb 2.x. The newer 3.0 version is expected to cause some problems so the commands below specify installing 2.3.1 and applying an apt hold to keep it there. Please watch the couchdb updates for any security updates to 2.x and update accordingly. This document will be updated when we are happy that Nunaliit runs well on 3.x.

Install couchdb using:

```
sudo apt update
sudo apt install apt-transport-https curl gnupg
curl https://couchdb.apache.org/repo/keys.asc | /usr/bin/gpg --dearmor | sudo /usr/bin/tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1
echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ bionic main" | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null
sudo apt update
sudo apt install -y couchdb=2.3.1~bionic
```

* Choose "standalone"

* Enter bind address of "0.0.0.0"

* Choose a strong admin password. Nunaliit will ask for it during atlas creation.

After install run:
```
sudo apt-mark hold couchdb
```

**Note**: If you are trying to run on Ubuntu 18.04 under Windows Subsystem for Linux (WSL or WSL2) you may find that the "standalone" single node setting and 0.0.0.0 bind address entered during install are not configured properly and [some extra steps are required for couchdb to initialize them correctly](https://docs.couchdb.org/en/3.2.2-docs/setup/single-node.html).



After install, we suggest editing `/opt/couchdb/etc/local.ini` to set `max_http_request_size = 4294967296` (or a smaller number of bytes as desired) to the `[httpd]` section to allow for the possibility of larger documents and attachments in CouchDB with Nunaliit. The default is only 64MB and this new value represents 4GB and maintains the behaviour of previous versions of CouchDB. Details can be found in the [CouchDB documentation](http://docs.couchdb.org/en/latest/config/http.html#httpd/max_http_request_size).

Afterwards, restart CouchDB:

`service couchdb restart`

### Installing ImageMagick on Ubuntu 18.04</a></h3>

    sudo apt install -y imagemagick webp

### Installing ffmpeg and extras on Ubuntu 18.04

    sudo apt install -y ffmpeg ubuntu-restricted-extras

### Fixing Magic File on Ubuntu 18.04

Edit the file _/etc/magic_ and append the following lines to it:
```
#Nunaliit Magic BEGIN
4       string          ftyp            ISO Media
>8      string          MSNV            \b, MPEG v4 system, version 2
!:mime  video/mp4
>8      string          isom            \b, MP4 Base Media v1
!:mime  video/mp4
>8      string/b        qt              video/quicktime
!:mime  video/quicktime
>8      string          3gp4             \b, Apple iTunes ALAC/AAC-LC (.M4A) Audio
!:mime  audio/x-m4a
#MP3 with ID3 tag
0       string      ID3     audio/mpeg
!:mime  audio/mpeg
#Nunaliit Magic END
```
 
There are situations where the file _/etc/magic_ does not exist. If this is the case and that errors
are encountered after the file _/etc/magic_ is created, place the content shown above in
_/usr/share/misc/magic/nunaliit_

### Enable PDF thumbnail generation

Edit `/etc/ImageMagick-6/policy.xml` and change `rights="none"` to `rights="read"` in the line `<policy domain="coder" rights="none" pattern="PDF" />`.
