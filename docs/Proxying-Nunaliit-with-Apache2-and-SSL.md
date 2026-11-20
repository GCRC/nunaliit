### Optionally configuring Apache2 as an SSL enabled reverse proxy virtual host (after installing Nunaliit and creating an atlas)

#### Install Apache2

    sudo apt-get install -y apache2

#### Enable modules

    sudo a2enmod proxy proxy_http proxy_html reqtimeout rewrite ssl vhost_alias headers

#### Stop apache in preparation for installing an SSL key and reconfiguring

    sudo systemctl stop apache2


#### Create SSL key & certificate

SSL is a big topic. If you know what you are doing, go for it. If you don't, and are on Ubuntu 20.04 or later, an easy way to get going is to set up certbot using these commands:

    sudo apt-get update
    sudo apt-get install -y certbot

Additionally set up certbot to stop and start apache when renewing certs so it is able to use apache's ports briefly while confirming domain possession.

    sudo mkdir -p /etc/letsencrypt/renewal-hooks/pre
    echo -e '#!/bin/bash\n\nsystemctl stop apache2\nsleep 5s' | sudo tee /etc/letsencrypt/renewal-hooks/pre/certbot-pre.sh > /dev/null
    sudo chmod a+x /etc/letsencrypt/renewal-hooks/pre/certbot-pre.sh
    sudo mkdir -p /etc/letsencrypt/renewal-hooks/post
    echo -e '#!/bin/bash\n\nsystemctl start apache2' | sudo tee /etc/letsencrypt/renewal-hooks/post/certbot-post.sh > /dev/null
    sudo chmod a+x /etc/letsencrypt/renewal-hooks/post/certbot-post.sh

Then, make sure apache2 was stopped (see above) and run the following, making sure to specify your fully qualified hostname in place of `example.com`:

    sudo certbot certonly --standalone -d example.com

At this point certbot will ask a couple questions, start listening on port 80 to be able to receive the connection from the certbot servers and confirm possession of the domain specified, then save the keys and certs in the `/etc/letsencrypt` directory where we will reference them later in the apache config.

#### Create an apache config file

Create a virtual host definition file in `/etc/apache2/sites-available` (make sure it looks something like `001-example.com.conf`) and add something like the following to it (adjust for your atlas hostname, nunaliit port, directory path, etc.):

    <VirtualHost *:443>
        ServerAdmin admin@example.com
        ServerName example.com

        ErrorLog /home/nunaliit/apache_logs/error.log
        LogLevel warn
        CustomLog /home/nunaliit/apache_logs/access.log combined

        ProxyRequests Off

        <Proxy *>
                Order deny,allow
                Allow from all
        </Proxy>

        ProxyPass / http://127.0.0.1:8080/
        ProxyPassReverse / http://127.0.0.1:8080/

        SSLCertificateFile /etc/letsencrypt/live/example.com/fullchain.pem
        SSLCertificateKeyFile /etc/letsencrypt/live/example.com/privkey.pem
    </VirtualHost>

#### Link to sites-enabled and remove the default site

    ln -s /etc/apache2/sites-available/001-example.com.conf /etc/apache2/sites-enabled
    rm /etc/apache2/sites-available/000-default.conf

#### Create logs directory specified above

    sudo mkdir /home/nunaliit/apache_logs

#### Start Apache2 again with the SSL key and configurations in place

    sudo systemctl start apache2

#### Optional Note:
In order to put a site behind Apache basic authentication, you will need to do a couple additional things.
Add mod_headers:

    sudo ln -s /etc/apache2/mods-available/headers.load /etc/apache2/mods-enabled/

Add directives to your apache config file similar to the following. See the apache httpd docs for more info.

    <Location />
       AuthName "Example Atlas"
       AuthType Basic
       AuthUserFile /home/nunaliit/atlas.example/htaccess
       Require valid-user
    </Location>
    RequestHeader unset Authorization

