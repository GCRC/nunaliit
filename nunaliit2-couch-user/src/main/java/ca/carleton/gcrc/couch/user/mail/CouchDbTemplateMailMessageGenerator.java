package ca.carleton.gcrc.couch.user.mail;

import java.io.StringReader;
import java.io.StringWriter;
import java.util.Map;

import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import com.github.mustachejava.DefaultMustacheFactory;
import com.github.mustachejava.Mustache;
import com.github.mustachejava.MustacheFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.mail.MailMessage;

public abstract class CouchDbTemplateMailMessageGenerator implements MailMessageGenerator {
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private CouchDb documentDb = null;
	private String docId = null;

	public CouchDbTemplateMailMessageGenerator(){
		
	}

	public CouchDbTemplateMailMessageGenerator(CouchDb documentDb, String docId){
		this.documentDb = documentDb;
		this.docId = docId;
	}
	
	abstract void generateDefaultMessage(
			MailMessage message, 
			Map<String, String> parameters
			) throws Exception;
	
	public CouchDb getDocumentDb() {
		return documentDb;
	}


	public void setDocumentDb(CouchDb documentDb) {
		this.documentDb = documentDb;
	}


	public String getDocId() {
		return docId;
	}


	public void setDocId(String docId) {
		this.docId = docId;
	}
	
	@Override
	public void generateMessage(
			MailMessage message,
			Map<String, String> parameters
			) throws Exception {

		if( null != documentDb 
		 && null != docId ) {
			try {
				JSONObject doc = documentDb.getDocument(docId);
		
				JSONObject jsonTemplate = doc.getJSONObject("nunaliit_email_template");
				String subject = jsonTemplate.getString("subject");
				String body = jsonTemplate.getString("body");
				
				MustacheFactory mf = new DefaultMustacheFactory();
				
				Mustache titleTemplate = mf.compile(new StringReader(subject), "subject");
				Mustache bodyTemplate = mf.compile(new StringReader(body), "body");
				
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
			} catch(Exception e) {
				logger.error("Unable load CouchDb e-mail template",e);
				generateDefaultMessage(message,parameters);
			}
		} else {
			generateDefaultMessage(message,parameters);
		}
	}
}
