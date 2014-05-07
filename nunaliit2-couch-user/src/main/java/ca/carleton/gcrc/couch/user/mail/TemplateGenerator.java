package ca.carleton.gcrc.couch.user.mail;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.Map;

import org.json.JSONObject;

import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;

import ca.carleton.gcrc.mail.MailMessage;

public class TemplateGenerator implements MailMessageGenerator {
	
	static public TemplateGenerator parseTemplateDocument(JSONObject doc) throws Exception {
		try {
			JSONObject jsonTemplate = doc.getJSONObject("nunaliit_email_template");
			String subject = jsonTemplate.getString("subject");
			String body = jsonTemplate.getString("body");
			TemplateGenerator tg = new TemplateGenerator(subject, body);
			return tg;
		} catch(Exception e) {
			throw new Exception("Error parsing e-mail template document",e);
		}
	}

	private Mustache titleTemplate = null;
	private Mustache bodyTemplate = null;
	
	public TemplateGenerator(String title, String body) throws Exception {
		MustacheFactory mf = new DefaultMustacheFactory();
		
		titleTemplate = mf.compile(new StringReader(title), "title");
		bodyTemplate = mf.compile(new StringReader(body), "body");
	}
	
	@Override
	public void generateMessage(
			MailMessage message,
			Map<String, String> parameters
			) throws Exception {

		// Subject
		{
			StringWriter sw = new StringWriter();
			titleTemplate.execute(sw, parameters);
			String formatted = sw.toString();
			message.setSubject(formatted);
		}

		// Body
		{
			StringWriter sw = new StringWriter();
			bodyTemplate.execute(sw, parameters);
			String formatted = sw.toString();
			message.setHtmlContent(formatted);
		}
	}
}
