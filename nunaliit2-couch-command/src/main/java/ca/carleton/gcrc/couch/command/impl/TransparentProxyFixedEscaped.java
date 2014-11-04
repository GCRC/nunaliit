package ca.carleton.gcrc.couch.command.impl;

import java.net.URI;

import javax.servlet.http.HttpServletRequest;

import org.eclipse.jetty.proxy.ProxyServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")
public class TransparentProxyFixedEscaped extends ProxyServlet.Transparent {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
    static public int hexToInt(char c){
    	if( c >= 'A' && c <= 'F' ){
    		return (c - 'A' + 10);
    	}
    	if( c >= 'a' && c <= 'f' ){
    		return (c - 'a' + 10);
    	}
    	if( c >= '0' && c <= '9' ){
    		return (c - '0');
    	}
    	return 0;
    }
    
    static public String unescapeUriString(String uriString){
    	StringBuilder sb = new StringBuilder();
    	int i=0,
    		e=uriString.length();
    	for(; i<e; ++i){
    		char c = uriString.charAt(i);
    		if( '?' == c || '#' == c ) {
    			// Done unescaping
    			break;
    		}
    		
    		if( '%' == c && (i+2) < e ){
    			char h = uriString.charAt(++i);
    			char l = uriString.charAt(++i);
    			int code = (hexToInt(h)*16) + hexToInt(l);
    			char unescaped = (char)code;
    			sb.append(unescaped);
    		} else {
    			sb.append(c);
    		}
    	}

    	// Copy until end
    	for(; i<e; ++i){
    		char c = uriString.charAt(i);
   			sb.append(c);
    	}
    	
    	return sb.toString();
    }

    @Override
    protected URI rewriteURI(HttpServletRequest request)
    {
    	URI uri = super.rewriteURI(request);

    	if( null != uri ){
    		String uriStr = uri.toString();
    		if( uriStr.contains("%") ){
    			try {
    				String fixedUriString = unescapeUriString(uriStr);
					URI fixedUri = new URI(fixedUriString);
					
					logger.error("proxy decode "+uri+" -> "+fixedUri);
					
					uri = fixedUri;
					
				} catch (Exception e) {
					logger.error("Unable to decode URI: "+uri, e);
				}
    		}
    	}
    	
    	return uri;
    }
    
}
