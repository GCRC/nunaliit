package ca.carleton.gcrc.couch.client.impl;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.net.HttpURLConnection;
import java.util.HashMap;
import java.util.Map;

public class CouchContextCookie extends CouchContextBase implements AcceptsCookies {

	private Map<String,String> cookies = new HashMap<String,String>();
	
	public CouchContextCookie(){
	}
	
	public CouchContextCookie(String cookieAuthSession){
		cookies.put("AuthSession", cookieAuthSession);
	}
	
	@Override
	public void adjustConnection(HttpURLConnection conn) throws Exception {

		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);
		
		boolean first = false;
		for(String key : cookies.keySet()){
			if( first ) {
				first = false;
			} else {
				pw.print("; ");
			};
			
			String value = cookies.get(key);
			pw.print(""+key+"="+value);
		}
		pw.flush();
		
		conn.setRequestProperty("Cookie", sw.toString());
	}

	@Override
	public void setCookie(String key, String value) {
		cookies.put(key, value);
	}

}
