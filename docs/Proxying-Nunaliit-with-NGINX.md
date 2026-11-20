### Optionally configuring NGINX as a reverse proxy virtual host (after installing Nunaliit and creating an atlas)

_Note: Ideally Nunaliit should be behind SSL to enable better security and in-browser audio and video recording. Please update this doc if you know how to set that up with NGINX_

#### Install NGINX

    sudo apt install -y nginx

#### Create the proxy configuration

Create a configuration definition file in _/etc/nginx/sites-available/_ (make sure it looks something like _001-example.io_) and add something like the following to it (adjust for your atlas hostname, nunaliit port, directory path, etc.):

    server {
      listen 80 default_server;
    
      location / {
        proxy_pass http://127.0.0.1:8080;
      }
    }

Note that this file can also be placed in _/etc/nginx/conf.d/_ and named sometime like _001-example.conf_. If this pattern is followed no link need be created (the step after this one).

See the NGINX docs for more info: https://www.nginx.com/resources/admin-guide/reverse-proxy/

#### Link to sites-enabled

    ln -s /etc/nginx/sites-available/001-example.io /etc/nginx/sites-enabled

#### Test the config

    sudo service nginx configtest

#### Restart NGINX

    sudo service nginx reload

#### Optional Note:
In order to put a site behind NGINX basic authentication, you will need to do a couple additional things.

Create an htaccess password file.

Add directives to your nginx config file similar to the following.

    server {
      listen 80 default_server;
    
      location / {
        proxy_pass http://127.0.0.1:8080;
        auth_basic "Restricted";
        auth_basic_user_file /etc/nginx/htpasswd;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header Authorization "";
        add_header X-Auth-CouchDB-UserName $remote_user;
      }
    }

See the NGINX basic auth doc for more info: https://www.nginx.com/resources/admin-guide/restricting-access-auth-basic/
