**Please note**: Things can change and these instructions may no longer be applicable. If something isn't working, please consult the official documentation for the respective component to find the latest/greatest way of installing. These instructions were written and tested on Ubuntu Linux 20.04.5 LTS Server version but the same or similar steps should also work on the Desktop version.

Before starting, make sure your repositories and system are up to date:

    sudo apt update
    sudo apt full-upgrade

And consider rebooting if core libraries or kernel updates were part of the updates:

    sudo reboot

### Installing Headless Java JRE on Ubuntu 20.04

    sudo apt install -y openjdk-11-jre-headless

**Note**: If you have any other openjdk versions, including newer versions, you may need to uninstall them to avoid problems. If you are planning to develop the nunaliit framework itself, see the [[Nunaliit Documentation for Developers]] for some important info about installing the `openjdk-11-jdk-headless` instead of `openjdk-11-jre-headless`.

### Installing latest Couch DB from Apache Foundation on Ubuntu 20.04

Install couchdb using:

```
sudo apt install -y apt-transport-https
curl https://couchdb.apache.org/repo/keys.asc | gpg --dearmor | sudo tee /usr/share/keyrings/couchdb-archive-keyring.gpg >/dev/null 2>&1
source /etc/os-release
echo "deb [signed-by=/usr/share/keyrings/couchdb-archive-keyring.gpg] https://apache.jfrog.io/artifactory/couchdb-deb/ ${VERSION_CODENAME} main" \
  | sudo tee /etc/apt/sources.list.d/couchdb.list >/dev/null
```

Next:

`sudo apt-get update`

`sudo apt-get install couchdb`

* Choose "standalone" when asked for the type of deployment.

* If asked for an Erlang Cookie to use for clustering, type in something long and randomly generated.

* Enter bind address of "0.0.0.0" when prompted.

* Choose a strong random admin password when prompted and write it down somewhere. Nunaliit will ask for it during atlas creation.

* If you need to install couchdb through automation or script you can follow the examples here to use debconf-set-selections and install in noninteractive mode: https://github.com/apache/couchdb-pkg/blob/main/debian/README.Debian

Edit /opt/couchdb/etc/local.ini
- The ini file is split up into sections with each section have a header inside brackets []. Make sure
the below edits are done in the correct sections.
- In `[couchdb]` section add new lines:

```
users_db_security_editable = true
default_security = everyone
max_document_size = 4294967296
```

- If it doesn't exist, create a `[chttpd_auth]` section.
- In `[chttpd_auth]` add new line:

```
require_valid_user = false
```

- If it doesn't exist, create a `[csp]` section.
- In `[csp]` section add new lines:

```
attachments_enable = false
showlist_enable = false
```

Restart couchdb with:

`systemctl restart couchdb`

Then run:

`curl 'admin:password@localhost:5984/_users/_security' -XPUT -d '{}'`

with admin user & password to clear the CouchDB 3.x default _users db security object.

### Installing ImageMagick on Ubuntu 20.04</a></h3>

    sudo apt install -y imagemagick webp

### Installing ffmpeg and extras on Ubuntu 20.04

    sudo apt install -y ffmpeg ubuntu-restricted-extras

### Fixing Magic File on Ubuntu 20.04

Edit the file `/etc/magic` and append the following lines to it:
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
 
There may be situations where the file _/etc/magic_ does not exist. If this is the case and errors
are encountered after the file _/etc/magic_ is created, create and place the content shown above in _/usr/share/misc/magic/nunaliit_ instead.
