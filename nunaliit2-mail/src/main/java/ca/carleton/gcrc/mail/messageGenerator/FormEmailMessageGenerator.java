package ca.carleton.gcrc.mail.messageGenerator;

import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.mail.MailMessage;

public class FormEmailMessageGenerator implements MailMessageGenerator {

	@Override
	public void generateMessage(
			MailMessage message,
			Map<String, String> parameters) throws Exception {

		String subject = parameters.get("subject");
		if( null == subject ){
			subject = "Nunaliit Form Mail";
		}
		message.setSubject(subject);
		
		// Generate message
		StringWriter sw = new StringWriter();
		PrintWriter pw = new PrintWriter(sw);

		String atlasName = parameters.get("atlasName");
		if( null != atlasName ){
			pw.println("<p><b>Atlas:</b> "+atlasName+"</p>");
			pw.println();
		}

		String destination = parameters.get("destination");
		if( null != destination ){
			pw.println("<p><b>Destination:</b> "+destination+"</p>");
			pw.println();
		}
		
		// Try to parse contact information
		String contactInfo = parameters.get("contactInfo");
		pw.println("<p><b>Contact:</b>");
		JSONArray contactArr = null;
		try {
			// Verify
			contactArr = new JSONArray(contactInfo);
			for(int i=0,e=contactArr.length(); i<e; ++i){
				JSONObject info = contactArr.getJSONObject(i);
				if( null == info.getString("name") ){
					throw new Exception("'name' must be provided");
				}
				if( null == info.getString("value") ){
					throw new Exception("'value' must be provided");
				}
			}
		} catch(Exception e) {
			// Ignore
			contactArr = null;
		}
		if( null != contactArr ){
			pw.println("<ul>");
			for(int i=0,e=contactArr.length(); i<e; ++i){
				JSONObject info = contactArr.getJSONObject(i);
				String name = info.getString("name");
				String value = info.getString("value");
				pw.print("<li><b>"+name);
				pw.print("</b>:"+value);
				pw.println("</li>");
			}
			pw.println("</ul>");
		} else {
			pw.println("<pre>");
			pw.println(contactInfo);
			pw.println("</pre>");
		}
		pw.println("</p>");
		pw.println();

		String body = parameters.get("body");
		if( null == body ){
			body = "";
		}
		pw.println("<p><b>Message:</b> <pre>");
		pw.println(body);
		pw.println("</pre></p>");
		pw.println();
		pw.flush();
		
		message.setHtmlContent(sw.toString());
	}

}
