package ca.carleton.gcrc.couch.command.impl;

import java.net.URI;

import javax.servlet.http.HttpServletRequest;

import org.eclipse.jetty.proxy.ProxyServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")
public class TransparentProxyFixedEscaped extends ProxyServlet.Transparent {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

    @Override
    protected URI rewriteURI(HttpServletRequest request)
    {
    	URI uri = super.rewriteURI(request);

    	if( null != uri ){
    		String uriStr = uri.toString();
    		if( uriStr.contains("%") ){
    			try {
					// Need to decode. Done automatically
					URI fixedUri = new URI(
						uri.getScheme()
						,uri.getUserInfo()
						,uri.getHost()
						,uri.getPort()
						,uri.getPath()
						,uri.getQuery()
						,uri.getFragment()
						);
					
					logger.debug("proxy decode "+uri+" -> "+fixedUri);
					
					uri = fixedUri;
					
				} catch (Exception e) {
					logger.error("Unable to decode URI: "+uri, e);
				}
    		}
    	}
    	
    	return uri;
    }
}
