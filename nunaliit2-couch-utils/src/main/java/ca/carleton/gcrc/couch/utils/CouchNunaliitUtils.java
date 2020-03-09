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

	private CouchNunaliitUtils() {}

	public static void adjustDocumentForStorage(
			JSONObject doc
			,CouchAuthenticationContext userContext
		) {
	
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

	public static boolean hasAdministratorRole(CouchAuthenticationContext userContext, String atlasName){
		if( null == userContext ) {
			return false;
		}
		
		Collection<String> roles = userContext.getRoles();
		if( null == roles ) {
			return false;
		}
		
		// Figure out acceptable administrator roles
		Set<String> adminRoles = new HashSet<>();
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

	public static boolean hasVetterRole(CouchAuthenticationContext userContext, String atlasName){
		if( null == userContext ) {
			return false;
		}
		
		Collection<String> roles = userContext.getRoles();
		if( null == roles ) {
			return false;
		}
		
		// Figure out acceptable vetter roles
		Set<String> vetterRoles = new HashSet<>();
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

	public static List<JSONObject> findStructuresOfType(String type, JSONObject doc){
		List<JSONObject> structures = new Vector<>();
		
		findStructuresOfType(doc, type, structures);
		
		return structures;
	}

	private static void findStructuresOfType(Object obj, String type, List<JSONObject> structures){
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
			}
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
		if (StringUtils.isNotBlank(port)) {
			if (("https".equals(scheme) && !"443".equals(port)) ||
					("http".equals(scheme) && !"80".equals(port))) {
				builder.append(":").append(port);
			}
		}
		else {
			logger.trace("Port is not available");
		}

		builder.append("/");
		if (StringUtils.isNotBlank(path)) {
			builder.append(path);
			builder.append("/");
		}

		return builder.toString();
	}

	/**
	 * Get folder path for base URL. Could be http://www.domain.com or possibly http://www.domain.com/atlas1 or
	 * http://www.domain.com/atlases/atlas1?module=module.map. Finds the 'atlases/atlas1' path.
	 *
	 * @param url The full URL to search.
	 * @return The path between the first / to the query string. Returns null if no path found.
	 */
	public static String getFolderPath(String url) {
		String path = null;

		if (StringUtils.isNotBlank(url)) {
			int lastSlash = url.lastIndexOf('/');
			url = url.substring(0, lastSlash);
			MATCHER.reset(url);
			if (MATCHER.matches()) {
				path = MATCHER.group(3);
			}
			if (StringUtils.isNotBlank(path)) {
				path = StringUtils.stripEnd(path, "/");
				path = StringUtils.stripStart(path, "/");
			}
		}

		return path;
	}

	/**
	 * Helper method that prints out all request headers and parameters, as well as the scheme, server, port and URL
	 * provided in the request object.
	 *
	 * @param request The request object to print out values.
	 */
	public static void logRequestData(HttpServletRequest request) {
		if (logger.isTraceEnabled()) {
			logger.trace("----- HttpServletRequest Start -----");
			logger.trace(String.format("- Scheme: %s", request.getScheme()));
			logger.trace(String.format("- Server: %s", request.getServerName()));
			logger.trace(String.format("- Port: %d", request.getServerPort()));
			logger.trace(String.format("- URL: %s", request.getRequestURL().toString()));
			Enumeration<String> headerNames = request.getHeaderNames();
			logger.trace("- Headers:");
			while (headerNames.hasMoreElements()) {
				String headerName = headerNames.nextElement();
				logger.trace(String.format("   %s: %s", headerName, request.getHeader(headerName)));
			}

			Enumeration<String> params = request.getParameterNames();
			logger.trace("- Parameters:");
			while (params.hasMoreElements()) {
				String paramName = params.nextElement();
				logger.trace(String.format("   %s: %s", paramName, request.getParameter(paramName)));
			}

			logger.trace("----- HttpServletRequest End -----");
		}
	}
}
