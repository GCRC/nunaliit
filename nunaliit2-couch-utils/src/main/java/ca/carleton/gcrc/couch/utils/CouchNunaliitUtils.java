package ca.carleton.gcrc.couch.utils;

import ca.carleton.gcrc.couch.client.CouchAuthenticationContext;
import org.apache.commons.lang3.StringUtils;
import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import javax.servlet.http.HttpServletRequest;
import java.util.Collection;
import java.util.Date;
import java.util.Enumeration;
import java.util.HashSet;
import java.util.Iterator;
import java.util.List;
import java.util.Set;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;


public class CouchNunaliitUtils {
	
	private static final Logger logger = LoggerFactory.getLogger(CouchNunaliitUtils.class);

	private static final Pattern URL_PATTERN = Pattern.compile("^([a-z][a-z0-9+\\-.]*:(//[^/?#]+)?)?([a-z0-9\\-._~%!$&'()*+,;=:@/]*)");
	private static final Matcher MATCHER = URL_PATTERN.matcher("");

	static public void adjustDocumentForStorage(
			JSONObject doc
			,CouchAuthenticationContext userContext
		) throws Exception {
	
		long now = (new Date()).getTime();

		// nunaliit_created
		if( null != userContext ){
			JSONObject created = doc.optJSONObject(CouchNunaliitConstants.DOC_KEY_CREATED);
			if( null == created ) {
				created = new JSONObject();
				created.put("time", now);
				created.put(
					CouchNunaliitConstants.DOC_KEY_TYPE
					,CouchNunaliitConstants.TYPE_ACTION_STAMP
					);
				created.put("name", userContext.getName());
				created.put("action", "created");
				doc.put(CouchNunaliitConstants.DOC_KEY_CREATED, created);
			}
		}

		// nunaliit_last_updated
		if( null != userContext ){
			JSONObject updated = new JSONObject();
			updated.put("time", now);
			updated.put(
				CouchNunaliitConstants.DOC_KEY_TYPE
				,CouchNunaliitConstants.TYPE_ACTION_STAMP
				);
			updated.put("name", userContext.getName());
			updated.put("action", "updated");
			doc.put(CouchNunaliitConstants.DOC_KEY_LAST_UPDATED, updated);
		}
	}
	
	static public boolean hasAdministratorRole(CouchAuthenticationContext userContext, String atlasName){
		if( null == userContext ) {
			return false;
		}
		
		Collection<String> roles = userContext.getRoles();
		if( null == roles ) {
			return false;
		}
		
		// Figure out acceptable administrator roles
		Set<String> adminRoles = new HashSet<String>();
		adminRoles.add("_admin");
		adminRoles.add("administrator");
		if( null != atlasName ) {
			adminRoles.add(atlasName + "_administrator");
		}
		
		for(String role : roles){
			if( adminRoles.contains(role) ) {
				return true;
			}
		}
		
		return false;
	}
	
	static public boolean hasVetterRole(CouchAuthenticationContext userContext, String atlasName){
		if( null == userContext ) {
			return false;
		}
		
		Collection<String> roles = userContext.getRoles();
		if( null == roles ) {
			return false;
		}
		
		// Figure out acceptable vetter roles
		Set<String> vetterRoles = new HashSet<String>();
		vetterRoles.add("vetter");
		if( null != atlasName ) {
			vetterRoles.add(atlasName + "_vetter");
		}
		
		for(String role : roles){
			if( vetterRoles.contains(role) ) {
				return true;
			}
		}
		
		// Administrators are automatically vetters
		return hasAdministratorRole(userContext, atlasName);
	}
	
	static public List<JSONObject> findStructuresOfType(String type, JSONObject doc){
		List<JSONObject> structures = new Vector<JSONObject>();
		
		findStructuresOfType(doc, type, structures);
		
		return structures;
	}
	
	static private void findStructuresOfType(Object obj, String type, List<JSONObject> structures){
		if( obj instanceof JSONObject ){
			JSONObject jsonObj = (JSONObject)obj;
			
			String nunaliitType = jsonObj.optString("nunaliit_type");
			if( null != nunaliitType && nunaliitType.equals(type) ){
				structures.add(jsonObj);
			}
			
			// Iterate over children structures
			Iterator<?> it = jsonObj.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					Object value = jsonObj.opt(key);
					if( null != value ){
						findStructuresOfType(value, type, structures);
					}
				}
			}
		} else if( obj instanceof JSONArray ) {
			JSONArray jsonArr = (JSONArray)obj;
			
			// Iterate over children values
			for(int i=0,e=jsonArr.length(); i<e; ++i){
				Object value = jsonArr.opt(i);
				if( null != value ){
					findStructuresOfType(value, type, structures);
				}
			};
		}
	}

	/**
	 * Build the atlas' base URL using the HTTP request information (scheme, server, port). Servers behind a proxy will
	 * have to setup custom headers because if we are behind a proxy we won't get the original scheme or server.
	 *
	 * @param request The request to get the server info from.
	 * @return The base URL for the atlas, ending with a '/'.
	 */
	public static String buildBaseUrl(HttpServletRequest request) {
		logRequestData(request);
		String scheme = request.getScheme();
		String serverName = request.getServerName();
		String port = Integer.toString(request.getServerPort());
		logger.trace("SARAH: port is " + port);

		boolean useProxyValues = false;
		String xForwardedHost = request.getHeader(RequestHeaderConstants.X_FORWARDED_HOST);
		// The request was forwarded via a proxy, use the original host/port/scheme info.
		if (StringUtils.isNotBlank(xForwardedHost)) {
			serverName = xForwardedHost;
			useProxyValues = true;
		}

		if (useProxyValues) {
			logger.trace("Using proxy headers to build sitemap base URL");
			if (StringUtils.isNotBlank(request.getHeader(RequestHeaderConstants.REQUEST_SCHEME))) {
				scheme = request.getHeader(RequestHeaderConstants.REQUEST_SCHEME);
			}
			port = request.getHeader(RequestHeaderConstants.SERVER_PORT);
		}

		String customRequestUri = request.getHeader(RequestHeaderConstants.REQUEST_URI);
		String path = getFolderPath(customRequestUri);

		StringBuilder builder = new StringBuilder();
		builder.append(String.format("%s://%s", scheme, serverName));
		// Only include port in URL string if it's non-standard.
		logger.trace("SARAH: port is " + port);
		if (StringUtils.isNotBlank(port)) {
			if (("https".equals(scheme) && !"443".equals(port)) ||
					("http".equals(scheme) && !"80".equals(port))) {
				builder.append(":").append(port);
			}
		}
		else {
			logger.trace("SARAH: port is not available");
		}

		builder.append("/");
		if (StringUtils.isNotBlank(path)) {
			builder.append(path);
			builder.append("/");
		}

		return builder.toString();
	}

	public static String getFolderPath(String url) {
		// Get folder path for base URL. Could be http://www.domain.com or possibly http://www.domain.com/atlas1 or
		// http://www.domain.com/atlases/atlas1. Find the 'atlases/atlas1' path.
		String path = null;
		int lastSlash = url.lastIndexOf("/");
		url = url.substring(0, lastSlash);
		MATCHER.reset(url);
		if (MATCHER.matches()) {
			path = MATCHER.group(3);
		}
		if (StringUtils.isNotBlank(path)) {
			logger.trace("SARAH: path found: " + path);
			path = StringUtils.stripEnd(path, "/");
			path = StringUtils.stripStart(path, "/");
		}

		return path;
	}

	//TODO: change back to trace and add "if loglevel==trace"
	public static void logRequestData(HttpServletRequest request) {
		logger.info("----- HttpServletRequest Start -----");
		logger.info("- Scheme: " + request.getScheme());
		logger.info("- Server: " + request.getServerName());
		logger.info("- Port: " + request.getServerPort());
		logger.info("- URL: " + request.getRequestURL().toString());
		Enumeration<String> headerNames = request.getHeaderNames();
		logger.info("- Headers:");
		while (headerNames.hasMoreElements()) {
			String headerName = headerNames.nextElement();
			logger.info("   " + headerName + ": " + request.getHeader(headerName));
		}

		Enumeration<String> params = request.getParameterNames();
		logger.info("- Parameters:");
		while (params.hasMoreElements()) {
			String paramName = params.nextElement();
			System.out.println("   " + paramName + ": " + request.getParameter(paramName));
		}

		logger.info("----- HttpServletRequest End -----");
	}
}
