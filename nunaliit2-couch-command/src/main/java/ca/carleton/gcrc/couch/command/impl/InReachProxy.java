package ca.carleton.gcrc.couch.command.impl;

import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.Arrays;
import java.util.Base64;

import javax.servlet.http.HttpServletRequest;
import javax.servlet.http.HttpServletResponse;


import org.eclipse.jetty.client.api.Request;
import org.eclipse.jetty.client.api.Response;
import org.eclipse.jetty.util.Callback;

import org.eclipse.jetty.proxy.ProxyServlet;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

@SuppressWarnings("serial")
public class InReachProxy extends ProxyServlet.Transparent {
	private String username;
	private String password;
	public InReachProxy(String username, String password) {
		this.username = username;
		this.password = password;
	}
	
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
    protected String rewriteTarget(HttpServletRequest request){
		String target = super.rewriteTarget(request);

    	if( null != target ){
    		String fixedTarget = unescapeUriString(target);
    		if( null != fixedTarget ){
    			try {
					logger.debug("proxy decode "+target+" -> "+fixedTarget);
					target = fixedTarget;
				} 
				catch (Exception e) {
					logger.error("Unable to decode URI: "+target, e);
				}
    		}
    	}
    	
		return target;
	}

	@Override
	protected void onResponseContent(HttpServletRequest request, HttpServletResponse response, Response proxyResponse, byte[] buffer, int offset, int length, Callback callback)
    {
        if(response.getStatus() == 201) {
			response.setStatus(200);
		}
		super.onResponseContent(request, response, proxyResponse, buffer, offset, length, callback);
    }

	@Override
	protected void sendProxyRequest(HttpServletRequest clientRequest, HttpServletResponse proxyResponse, Request proxyRequest) {
		String basicauth = username + ":" + password;
		String auth64 = "Basic " + Base64.getEncoder().encodeToString(basicauth.getBytes());
		
		proxyRequest.header("Authorization", auth64);
		super.sendProxyRequest(clientRequest, proxyResponse, proxyRequest);
	}
}
