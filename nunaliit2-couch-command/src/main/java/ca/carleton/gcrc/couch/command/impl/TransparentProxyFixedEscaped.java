package ca.carleton.gcrc.couch.command.impl;

import java.net.URI;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import javax.servlet.http.HttpServletRequest;

import org.eclipse.jetty.proxy.ProxyServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")
public class TransparentProxyFixedEscaped extends ProxyServlet.Transparent {
	
	static final private Pattern rDesign2f = Pattern.compile("/_design%2[fF]");

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
    
    static public String unescapeUriString(String uriString){
		Matcher mDesign2f = rDesign2f.matcher(uriString);
		if( mDesign2f.find() ){
			String fixedUriString = 
					uriString.substring(0, mDesign2f.start())
    				+ "/_design/"
    				+ uriString.substring(mDesign2f.end());
			
			return fixedUriString;
		}
		
		return null;
    }

    @Override
    protected URI rewriteURI(HttpServletRequest request)
    {
    	URI uri = super.rewriteURI(request);

    	if( null != uri ){
    		String uriStr = uri.toString();
    		String fixedUriString = unescapeUriString(uriStr);
    		if( null != fixedUriString ){
    			try {
					URI fixedUri = new URI(fixedUriString);
					
					logger.debug("proxy decode "+uri+" -> "+fixedUri);
					
					uri = fixedUri;
					
				} catch (Exception e) {
					logger.error("Unable to decode URI: "+uri, e);
				}
    		}
    	}
    	
    	return uri;
    }

    // This is the code for a later version of Jetty
//    protected String rewriteTarget(HttpServletRequest request)
//    {
//    	String target = super.rewriteTarget(request);
//
//    	if( null != target ){
//    		String fixedTarget = unescapeUriString(target);
//    		if( null != fixedTarget ){
//    			try {
//					logger.debug("proxy decode "+target+" -> "+fixedTarget);
//					
//					target = fixedTarget;
//					
//				} catch (Exception e) {
//					logger.error("Unable to decode URI: "+target, e);
//				}
//    		}
//    	}
//    	
//    	return target;
//    }
    
}
