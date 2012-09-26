Nunaliit Atlas
--------------

1. Obtain WAR file and expand
   > mkdir atlas
   > cd atlas
   > cp <war-file> .
   > jar -xvf <war-file>
   
2. Run installation script
   > cd WEB-INF/atlas_install
   > sudo ant
   
3. Carefully answer questions.

4. Create working directories
   > sudo ant create-working-dir
   
5. Download and install Jetty at the specified location.
   - delete test.war from webapps directory
   - delete javadoc.xml, test.xml and test.d from contexts directory
   
6. Install atlas context
   > cd <jetty-home>/contexts
   > cp /etc/nunaliit2/couchdb/default/jetty/atlas.xml .
   
7. Forward Apache to CouchDB
   > cd /etc/apache2/sites-available
   > sudo cp /etc/nunaliit2/couchdb/default/apache/virtual.conf .
   > cd ../sites-enabled
   > sudo ln -s ../sites-available/virtual.conf .
   > cd ../mods-enabled
   > sudo ln -s ../mods-available/proxy.conf .
   > sudo ln -s ../mods-available/proxy.load .
   > sudo ln -s ../mods-available/proxy_http.conf .
   > sudo /etc/init.d/apache2 restart
   
8. Run script to deploy atlas
   > /etc/nunaliit2/couchdb/default/cron.sh   
   
9. Install CRON job
   > sudo crontab -e
   Look at line to add from file: /etc/nunaliit2/couchdb/default/cron.sh

10. Install startup script
    > sudo cp /etc/nunaliit2/couchdb/default/atlas /etc/init.d/atlas
    > sudo update-rc.d atlas default

11. Create first administrator user
    - browse to @APACHE_URL@@APACHE_PATH_SEPARATORS@users.html
    - log in as admin
    - create a user and assign it the role: administrator

12. Create first replication rule
