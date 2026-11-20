**Please note**: Things can change and these instructions may no longer be applicable. If something isn't working, please consult the official documentation for the respective component to find the latest/greatest way of installing.

Before starting, make sure your repositories and system are up to date:

    sudo apt update
    sudo apt full-upgrade

And consider rebooting if core libraries or kernel updates were part of the updates:

    sudo reboot

#### Installing Headless Java JRE on Ubuntu 16.04

    sudo apt install -y openjdk-8-jre-headless

Note: If you will be building Nunaliit from source, replace jre with jdk in that command.

#### Installing latest Couch DB from Apache Foundation on Ubuntu 16.04

Ensure you are running a Nunaliit build newer than [this commit](https://github.com/GCRC/nunaliit/commit/5826d0df0cdb17641aeb524323114c7eb5a28541) on April 12, 2018. [Issue #733](https://github.com/GCRC/nunaliit/issues/733) documents the changes made to Nunaliit to support CouchDB 2.x.

**Please Note**: The command below has been updated to specify version 2.3.1 of couchdb and have apt hold it there. Nunaliit has not yet been tested with version 3.0 or above. Pay attention to couchdb updates. You may need to update to a newer version of couchdb 2.x if they issue a security update.

As root:

```
apt update
apt install apt-transport-https curl gnupg
curl https://couchdb.apache.org/repo/keys.asc | /usr/bin/gpg --dearmor | /usr/bin/tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1
echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ xenial main" | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null
apt update
apt install -y couchdb=2.3.1~xenial
```

* Choose "standalone"

* Enter bind address of "0.0.0.0"

* Choose a strong admin password. Nunaliit will ask for it during atlas creation.

```
apt-mark hold couchdb
```

After install, we suggest editing `/opt/couchdb/etc/local.ini` to set `max_http_request_size = 4294967296` (or a smaller number of bytes as desired) to the `[httpd]` section to allow for the possibility of larger documents and attachments in CouchDB with Nunaliit. The default is only 64MB and this new value represents 4GB and maintains the behaviour of previous versions of CouchDB. Details can be found in the [CouchDB documentation](http://docs.couchdb.org/en/latest/config/http.html#httpd/max_http_request_size).

Afterwards, restart CouchDB:

`systemctl restart couchdb`

#### Installing ImageMagick on Ubuntu 16.04</a></h3>

    sudo apt install -y imagemagick

#### Installing ffmpeg and extras on Ubuntu 16.04

    sudo apt install -y ffmpeg libav-tools ubuntu-restricted-extras libavcodec-extra

#### Fixing Magic File on Ubuntu 16.04

Edit the file _/etc/magic_ and append the following lines to it:

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
    
There are situations where the file _/etc/magic_ does not exist. If this is the case and that errors
are encountered after the file _/etc/magic_ is created, store the content shown above to
_/usr/share/misc/magic/nunaliit_


