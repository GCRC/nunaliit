package ca.carleton.gcrc.couch.client.impl;

import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import java.net.HttpURLConnection;
import java.net.URL;
import java.net.URLEncoder;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.couch.client.CouchContext;
import ca.carleton.gcrc.json.JSONSupport;

public class ConnectionUtils {
	static public Object getJsonFromInputStream(InputStream contentStream, String encoding) throws Exception {
		if( null == encoding ) {
			encoding = "UTF-8";
		}
		
		InputStreamReader isr = new InputStreamReader(contentStream, encoding);
		StringWriter sw = new StringWriter();
		int b = isr.read();
		while( b >= 0 ) {
			sw.write((char)b);
			b = isr.read();
		}
		sw.flush();
		
		JSONTokener jsonTokener = new JSONTokener(sw.toString());
		Object obj = jsonTokener.nextValue();
		
		return obj;
	}
	
	static public <T> T getJsonFromInputStream(InputStream contentStream, String encoding, Class<T> clazz) throws Exception {
		Object json = getJsonFromInputStream(contentStream, encoding);

		if( clazz.isAssignableFrom(json.getClass()) ) {
			T result = clazz.cast(json);
			return result;
		}
		
		throw new Exception("Unexpected returned object type: "+json.getClass().getSimpleName());
	}
	
	static public URL computeUrlWithParameter(URL url, UrlParameter parameter) throws Exception {
		List<UrlParameter> parameters = new ArrayList<UrlParameter>(1);
		parameters.add(parameter);
		return computeUrlWithParameters(url, parameters);
	}
	
	static public URL computeUrlWithParameters(URL url, List<UrlParameter> parameters) throws Exception {
		StringWriter sw = new StringWriter();
		sw.write(url.toExternalForm());
		
		boolean first = true;
		for(UrlParameter parameter : parameters) {
			if( first ) {
				sw.write("?");
				first = false;
			} else {
				sw.write("&");
			}
			
			sw.write( URLEncoder.encode(parameter.getKey(), "UTF-8") );
			sw.write("=");
			sw.write( URLEncoder.encode(parameter.getValue(), "UTF-8") );
		}
		
		sw.flush();
		
		return new URL( sw.toString() );
	}

	static public <T> T getJsonResource(CouchContext ctxt, URL url, Class<T> clazz) throws Exception {
		CouchContextBase context = CouchContextBase.getBase(ctxt);
		
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("GET");
		context.adjustConnection(conn);
		conn.setDoOutput(false);
		conn.setDoInput(true);
		conn.connect();
		updateContextFromHeaderFields(ctxt,conn.getHeaderFields());
		try {
			checkResponseForError(conn);
		} catch(Exception e) {
			try {
				conn.disconnect();
			} catch(Exception e2) {
				// Ignore
			}
			throw e;
		}
		String contentEncoding = conn.getContentEncoding();
		InputStream contentStream = conn.getInputStream();
		T result = getJsonFromInputStream(contentStream, contentEncoding, clazz);
		contentStream.close();
		conn.disconnect();

		return result;
	}

	static public JSONObject getJsonResource(CouchContext ctxt, URL url) throws Exception {
		return getJsonResource(ctxt, url, JSONObject.class);
	}

	static public JSONObject putJsonResource(CouchContext ctxt, URL url, JSONObject jsonObj) throws Exception {
		CouchContextBase context = CouchContextBase.getBase(ctxt);
		
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("PUT");
		context.adjustConnection(conn);
		conn.setDoInput(true);
		if( null == jsonObj ) {
			conn.setDoOutput(false);
		} else {
			conn.setDoOutput(true);
			conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
			OutputStream os = conn.getOutputStream();
			OutputStreamWriter osw = new OutputStreamWriter(os, "UTF-8");
			jsonObj.write(osw);
			osw.flush();
			os.close();
		}
		conn.connect();
		updateContextFromHeaderFields(ctxt,conn.getHeaderFields());
		try {
			checkResponseForError(conn);
		} catch(Exception e) {
			try {
				conn.disconnect();
			} catch(Exception e2) {
				// Ignore
			}
			throw e;
		}
		String contentEncoding = conn.getContentEncoding();
		InputStream contentStream = conn.getInputStream();
		JSONObject result = getJsonFromInputStream(contentStream, contentEncoding, JSONObject.class);
		contentStream.close();
		conn.disconnect();

		return result;
	}

	static public JSONObject postJsonResource(CouchContext ctxt, URL url, JSONObject jsonObj) throws Exception {
		CouchContextBase context = CouchContextBase.getBase(ctxt);
		
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("POST");
		context.adjustConnection(conn);
		conn.setDoInput(true);
		if( null == jsonObj ) {
			conn.setDoOutput(false);
		} else {
			conn.setDoOutput(true);
			conn.setRequestProperty("Content-Type", "application/json; charset=utf-8");
			OutputStream os = conn.getOutputStream();
			OutputStreamWriter osw = new OutputStreamWriter(os, "UTF-8");
			jsonObj.write(osw);
			osw.flush();
			os.close();
		}
		conn.connect();
		updateContextFromHeaderFields(ctxt,conn.getHeaderFields());
		try {
			checkResponseForError(conn);
		} catch(Exception e) {
			try {
				conn.disconnect();
			} catch(Exception e2) {
				// Ignore
			}
			throw e;
		}
		String contentEncoding = conn.getContentEncoding();
		InputStream contentStream = conn.getInputStream();
		JSONObject result = getJsonFromInputStream(contentStream, contentEncoding, JSONObject.class);
		contentStream.close();
		conn.disconnect();

		return result;
	}

	static public JSONObject postForm(CouchContext ctxt, URL url, Map<String,String> form) throws Exception {
		CouchContextBase context = CouchContextBase.getBase(ctxt);
		
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("POST");
		context.adjustConnection(conn);
		conn.setDoInput(true);
		if( null == form ) {
			conn.setDoOutput(false);
		} else {
			conn.setDoOutput(true);
			conn.setRequestProperty("Content-Type", "application/x-www-form-urlencoded; charset=utf-8");
			OutputStream os = conn.getOutputStream();
			OutputStreamWriter osw = new OutputStreamWriter(os, "UTF-8");
			boolean first = true;
			for(String key : form.keySet()){
				String value = form.get(key);
				if( first ) {
					first = false;
				} else {
					osw.write("&");
				}
				osw.write( URLEncoder.encode(key, "UTF-8") );
				osw.write("=");
				osw.write( URLEncoder.encode(value, "UTF-8") );
			}
			osw.flush();
			os.close();
		}
		conn.connect();
		updateContextFromHeaderFields(ctxt,conn.getHeaderFields());
		try {
			checkResponseForError(conn);
		} catch(Exception e) {
			try {
				conn.disconnect();
			} catch(Exception e2) {
				// Ignore
			}
			throw e;
		}
		String contentEncoding = conn.getContentEncoding();
		InputStream contentStream = conn.getInputStream();
		JSONObject result = getJsonFromInputStream(contentStream, contentEncoding, JSONObject.class);
		contentStream.close();
		conn.disconnect();

		return result;
	}

	static public JSONObject deleteJsonResource(CouchContext ctxt, URL url) throws Exception {
		CouchContextBase context = CouchContextBase.getBase(ctxt);
		
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("DELETE");
		context.adjustConnection(conn);
		conn.setDoOutput(false);
		conn.setDoInput(true);
		conn.connect();
		updateContextFromHeaderFields(ctxt,conn.getHeaderFields());
		try {
			checkResponseForError(conn);
		} catch(Exception e) {
			try {
				conn.disconnect();
			} catch(Exception e2) {
				// Ignore
			}
			throw e;
		}
		String contentEncoding = conn.getContentEncoding();
		InputStream contentStream = conn.getInputStream();
		JSONObject result = getJsonFromInputStream(contentStream, contentEncoding, JSONObject.class);
		contentStream.close();
		conn.disconnect();

		return result;
	}

	static public JSONObject putStreamResource(CouchContext ctxt, URL url, InputStream is, String contentType, long size) throws Exception {
		CouchContextBase context = CouchContextBase.getBase(ctxt);
		
		if( null == contentType ) {
			contentType = "application/binary";
		}
		
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("PUT");
		context.adjustConnection(conn);
		conn.setDoInput(true);
		conn.setDoOutput(true);
		conn.setRequestProperty("Content-Type", contentType);
		OutputStream os = conn.getOutputStream();
		int b = is.read();
		while( b >= 0 ) {
			os.write(b);
			b = is.read();
		}
		os.flush();
		os.close();
		conn.connect();
		updateContextFromHeaderFields(ctxt,conn.getHeaderFields());
		try {
			checkResponseForError(conn);
		} catch(Exception e) {
			try {
				conn.disconnect();
			} catch(Exception e2) {
				// Ignore
			}
			throw e;
		}
		String contentEncoding = conn.getContentEncoding();
		InputStream contentStream = conn.getInputStream();
		JSONObject result = getJsonFromInputStream(contentStream, contentEncoding, JSONObject.class);
		contentStream.close();
		conn.disconnect();

		return result;
	}

	static public JSONObject putStreamResource(
			CouchContext ctxt
			,URL url
			,StreamProducer producer
			,String contentType
			) throws Exception {
		CouchContextBase context = CouchContextBase.getBase(ctxt);
		
		if( null == contentType ) {
			contentType = "application/binary";
		}
		
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("PUT");
		context.adjustConnection(conn);
		conn.setDoInput(true);
		conn.setDoOutput(true);
		conn.setRequestProperty("Content-Type", contentType);
		OutputStream os = conn.getOutputStream();
		conn.connect();
		producer.produce(os);
		os.flush();
		os.close();
		updateContextFromHeaderFields(ctxt,conn.getHeaderFields());
		try {
			checkResponseForError(conn);
		} catch(Exception e) {
			try {
				conn.disconnect();
			} catch(Exception e2) {
				// Ignore
			}
			throw e;
		}
		String contentEncoding = conn.getContentEncoding();
		InputStream contentStream = conn.getInputStream();
		JSONObject result = getJsonFromInputStream(contentStream, contentEncoding, JSONObject.class);
		contentStream.close();
		conn.disconnect();

		return result;
	}

	static public String getStreamResource(CouchContext ctxt, URL url, OutputStream outputStream) throws Exception {
		CouchContextBase context = CouchContextBase.getBase(ctxt);
		
		String contentType = null;
		
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("GET");
		context.adjustConnection(conn);
		conn.setDoInput(true);
		conn.setDoOutput(false);
		conn.connect();
		updateContextFromHeaderFields(ctxt,conn.getHeaderFields());
		try {
			checkResponseForError(conn);
		} catch(Exception e) {
			try {
				conn.disconnect();
			} catch(Exception e2) {
				// Ignore
			}
			throw e;
		}
		contentType = conn.getContentType();
		//String contentEncoding = conn.getContentEncoding();
		InputStream contentStream = conn.getInputStream();

		byte[] buf = new byte[0x1000];
		while (true) {
			int r = contentStream.read(buf);
			if( r < 0 ) {
				break;
			}
			outputStream.write(buf, 0, r);
		}		

		contentStream.close();
		conn.disconnect();

		return contentType;
	}

	static public ConnectionStreamResult getStreamResource(CouchContext ctxt, URL url) throws Exception {
		CouchContextBase context = CouchContextBase.getBase(ctxt);
		
		HttpURLConnection conn = (HttpURLConnection)url.openConnection();
		conn.setRequestMethod("GET");
		context.adjustConnection(conn);
		conn.setDoInput(true);
		conn.setDoOutput(false);
		conn.connect();
		updateContextFromHeaderFields(ctxt,conn.getHeaderFields());
		try {
			checkResponseForError(conn);
		} catch(Exception e) {
			try {
				conn.disconnect();
			} catch(Exception e2) {
				// Ignore
			}
			throw e;
		}
		String contentType = conn.getContentType();
		String contentEncoding = conn.getContentEncoding();
		InputStream contentStream = conn.getInputStream();
		
		ConnectionStreamResult result = new ConnectionStreamResult();
		result.setContentType(contentType);
		result.setContentEncoding(contentEncoding);
		result.setInputStream(contentStream);

		return result;
	}
	
	/**
	 * Analyze a CouchDb response and raises an exception if an error was returned
	 * in the response.
	 * @param response JSON response sent by server
	 * @param errorMessage Message of top exception
	 * @throws Exception If error is returned in response
	 */
	static public void captureReponseErrors(Object response, String errorMessage) throws Exception {
		if( null == response ) {
			throw new Exception("Capturing errors from null response");
		}
		if( false == (response instanceof JSONObject) ) {
			// Not an error
			return;
		}
		JSONObject obj = (JSONObject)response;
		if( JSONSupport.containsKey(obj,"error") ) {
			String serverMessage;
			try {
				serverMessage = obj.getString("error");
			} catch (Exception e) {
				serverMessage = "Unable to parse error response";
			}
			
			if( null == errorMessage ) {
				errorMessage = "Error returned by database: ";
			}
			throw new Exception(errorMessage+serverMessage);
		}
	}
	
	static public void updateContextFromHeaderFields(CouchContext context, Map<String,List<String>> headerFields){
		// Cookies
		if( headerFields.containsKey("Set-Cookie") 
		 && context instanceof AcceptsCookies ) {
			AcceptsCookies acceptsCookies = (AcceptsCookies)context;
			List<String> cookies = headerFields.get("Set-Cookie");
			for(String cookie : cookies){
				String[] cookieComponents = cookie.split(";");
				if( cookieComponents.length > 0 ) {
					String[] cookieKeyValue = cookieComponents[0].split("=");
					if( cookieKeyValue.length >= 2 ) {
						acceptsCookies.setCookie(cookieKeyValue[0].trim(), cookieKeyValue[1].trim());
					};
				};
			}
		}
	}

	static public void checkResponseForError(HttpURLConnection conn) throws Exception {

		int responseCode = conn.getResponseCode();
		if( responseCode < 200 || responseCode > 299 ) {
			// An error has been returned. Try to interpret the
			// server response
			String errorMsg = null;
			String reason = null;
			try {
				String contentEncoding = conn.getContentEncoding();
				InputStream contentStream = conn.getErrorStream();
				if( null != contentStream ) {
					JSONObject result = getJsonFromInputStream(contentStream, contentEncoding, JSONObject.class);
					errorMsg = result.optString("error", "unknown");
					reason = result.optString("reason", "no reason given");
					contentStream.close();
				}
				
			} catch(Exception e){
				throw new CouchDbException(responseCode, errorMsg, reason, e);
			}
			
			throw new CouchDbException(responseCode, errorMsg, reason);
		}
	}
}
