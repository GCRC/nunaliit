package ca.carleton.gcrc.couch.utils;

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
import ca.carleton.gcrc.mail.messageGenerator.MailMessageGenerator;

public class CouchDbTemplateMailMessageGenerator implements MailMessageGenerator {
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	
	private MailMessageGenerator defaultGenerator = null;
	private CouchDb documentDb = null;
	private String docId = null;

	public CouchDbTemplateMailMessageGenerator(){
		
	}

	public CouchDbTemplateMailMessageGenerator(
			CouchDb documentDb, 
			String docId, 
			MailMessageGenerator defaultGenerator
			){
		this.defaultGenerator = defaultGenerator;
		this.documentDb = documentDb;
		this.docId = docId;
	}
	
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
	
	public MailMessageGenerator getDefaultGenerator() {
		return defaultGenerator;
	}

	public void setDefaultGenerator(MailMessageGenerator defaultGenerator) {
		this.defaultGenerator = defaultGenerator;
	}

	@Override
	public void generateMessage(
			MailMessage message,
			Map<String, String> parameters
			) throws Exception {

		JSONObject doc = null;
		if( null != documentDb 
		 && null != docId ) {
			try {
				doc = documentDb.getDocument(docId);
			} catch(Exception e) {
				logger.error("Unable load CouchDb e-mail template: "+docId);
			}
		}

		boolean needToGenerateDefaultMessage = true;
		if( null != doc ) {
			try {
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
				
				needToGenerateDefaultMessage = false;

			} catch(Exception e) {
				logger.error("Unable create message from template: "+docId,e);
			}
		}

		if( needToGenerateDefaultMessage ) {
			generateDefaultMessage(message,parameters);
		}
	}

	private void generateDefaultMessage(
			MailMessage message, 
			Map<String, String> parameters
			) throws Exception {
		
		if( null != defaultGenerator ){
			defaultGenerator.generateMessage(message, parameters);
		} else {
			throw new Exception("Default message generator is not set");
		}
	}
}
