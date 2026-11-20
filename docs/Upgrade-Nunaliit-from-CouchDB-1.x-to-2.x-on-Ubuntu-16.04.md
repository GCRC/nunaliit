If you followed our older instructions to install Nunaliit using the version of CouchDB packaged with Ubuntu 16.04 (CouchDB 1.6) then you should upgrade to the latest CouchDB using the instructions below.
----

Ensure you are running a Nunaliit build newer than [this commit](https://github.com/GCRC/nunaliit/commit/5826d0df0cdb17641aeb524323114c7eb5a28541) on April 12, 2018. [Issue #733](https://github.com/GCRC/nunaliit/issues/733) documents the changes made to Nunaliit to support CouchDB 2.x.

As root:

```
systemctl stop nunaliit
apt autoremove couchdb
apt install apt-transport-https curl
echo "deb https://apache.bintray.com/couchdb-deb xenial main" | sudo tee -a /etc/apt/sources.list
curl -L https://couchdb.apache.org/repo/bintray-pubkey.asc | sudo apt-key add -
apt update
apt install -y couchdb
```

* Choose "standalone"

* Enter bind address of "0.0.0.0"

* Choose a strong admin password. Nunaliit will ask for it during atlas creation.

After install, edit `/opt/couchdb/etc/local.ini` to add `max_http_request_size = 4294967296` to the `[httpd]` section to maintain the previous behaviour allowing very large documents and attachments in CouchDB. See [this note](http://docs.couchdb.org/en/latest/whatsnew/2.1.html) on the CouchDB what's new page if you want details on this new parameter.

```
systemctl restart couchdb
/opt/couchdb/bin/couchup replicate -a -i -l admin -p <password>
/opt/couchdb/bin/couchup rebuild -p <password> <db>
```