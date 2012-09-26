To deploy the atlas on a production system:

1. Install Servlet container

2. Deploy nunaliit2-couch-server.war on Servlet Container
   - Set options in /etc/nunaliit2/couchdb/default

   example: http://127.0.0.1:8080/couch/
   
3. Install CouchDb

4. Upload couchAtlas Couch Application
   - copy build.properties.example to build.properties
   - adjust variables
   - run ANT script
   
   example: http://127.0.0.1:5984/kitikmeot/_design/atlas/index.html
   
5. Optional: If you need to migrate Kitikmeot data
   - cd kitikmeot_migration
   - copy build.properties.example to build.properties
   - adjust variables
   - run ANT script
   - Load http://127.0.0.1:5984/kitikmeot/_design/kitikmeot/kitikmeot.html
   - Run conversion process
   - Let robot convert all media files
   - Approve all contributions using page http://127.0.0.1:5984/kitikmeot/_design/kitikmeot/kitikmeot.html
   - Load http://127.0.0.1:5984/_utils
   - Delete http://127.0.0.1:5984/kitikmeot/_design/kitikmeot
   
6. Create Apache configuration to use URL rewriting

ProxyPass /kitikmeot/upload/ http://127.0.0.1:8080/couch/upload/
ProxyPass /kitikmeot/progress/ http://127.0.0.1:8080/couch/progress/
ProxyPass /kitikmeot/server/ http://127.0.0.1:5984/

<Directory "/home/jpfiset/apache-tomcat-6.n2/media">
    Options Indexes
    AllowOverride None
    Order allow,deny
    Allow from all
</Directory>
ProxyPass /kitikmeot/media/ !
Alias /kitikmeot/media/ /<real path to media files>/media/

ProxyPass /kitikmeot/ http://127.0.0.1:5984/kitikmeot/_design/atlas/_rewrite/

   