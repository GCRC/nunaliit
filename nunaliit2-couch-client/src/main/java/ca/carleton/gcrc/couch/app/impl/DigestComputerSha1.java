package ca.carleton.gcrc.couch.app.impl;

import java.io.BufferedReader;
import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.security.MessageDigest;
import java.util.Arrays;
import java.util.Collection;
import java.util.Collections;
import java.util.List;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONWriter;
import org.apache.commons.codec.binary.Base64;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Attachment;
import ca.carleton.gcrc.couch.app.DigestComputer;
import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentDigest;

public class DigestComputerSha1 implements DigestComputer {

	final static public String DIGEST_COMPUTER_TYPE = "SHA-1";
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	@Override
	public String getType() {
		return DIGEST_COMPUTER_TYPE;
	}

	@Override
	public DocumentDigest computeDocumentDigest(Document doc) throws Exception {
		try {
			JSONObject json = doc.getJSONObject();
	
			// Initialize digest
			DocumentDigest dd = new DocumentDigest();
			dd.setType(DIGEST_COMPUTER_TYPE);
		
			// Compute digest of main document
			String mainDigest = this.computeDigestFromJsonObject(json);
			dd.setDocDigest(mainDigest);
			
			// Process each attachment
			Collection<Attachment> attachments = doc.getAttachments();
			if( null != attachments ) {
				for(Attachment attachment : attachments){
					String digest = computeAttachmentDigest(attachment);
					dd.addAttachmentDigest(attachment.getName(), digest);
				}
			}
			
			return dd;
			
		} catch(Exception e) {
			throw new Exception("Error while computing document digest for "+doc.getId(), e);
		}
	}

	@Override
	public String computeDigestFromJsonObject(JSONObject jsonObj) throws Exception {
		String mainDigest = null;
		
		try {
			// While computing the digest, do not include all the keys
			JSONObjectConverter converter = JSONObjectConverter.getConverterNunaliit();
			JSONObject convertedJsonObj = converter.convertObject(jsonObj);
			
			ByteArrayOutputStream baos = new ByteArrayOutputStream();
			try (OutputStreamWriter osw = new OutputStreamWriter(baos,"UTF-8")) {
				JSONWriter builder = new JSONWriter(osw);
				this.writeObject(convertedJsonObj, builder);
				osw.flush();	
			}
			
			// Perform SHA-1 digest
			MessageDigest md = MessageDigest.getInstance("SHA-1");
			md.update(baos.toByteArray());
			byte[] sigBytes = md.digest();

			// B64
			byte[] encoded = Base64.encodeBase64(sigBytes);
			try (
				ByteArrayInputStream bais = new ByteArrayInputStream(encoded);
				InputStreamReader isr = new InputStreamReader(bais, "UTF-8");
				BufferedReader br = new BufferedReader(isr);
			) {
				mainDigest = br.readLine();
			}
		} catch(Exception e) {
			throw new Exception("Unable to compute main digest on document", e);
		}

		return mainDigest;
	}

	private void write(Object value, JSONWriter builder) throws Exception {
		if( value instanceof String ) {
			builder.value((String)value);
		} else if( value instanceof JSONObject ) {
			writeObject((JSONObject)value, builder);
		} else if( value instanceof JSONArray ) {
			writeArray((JSONArray)value, builder);
		} else {
			builder.value(value);
		}
	}

	private void writeObject(JSONObject json, JSONWriter builder) throws Exception {
		String[] keys = JSONObject.getNames(json);
		List<String> sortedKeys = null;
		if( null != keys ){
			sortedKeys = Arrays.asList(keys);
			Collections.sort(sortedKeys);
		} else {
			sortedKeys = Collections.emptyList();
		}
		
		builder.object();
		
		for(String key : sortedKeys) {
			builder.key(key);
			
			Object value = json.get(key);
			write(value, builder);
		}
		
		builder.endObject();
	}

	private void writeArray(JSONArray json, JSONWriter builder) throws Exception {
		
		builder.array();
		
		for(int i=0,e=json.length(); i<e; ++i) {
			Object value = json.get(i);
			write(value, builder);
		}
		
		builder.endArray();
	}
	
	private String computeAttachmentDigest(Attachment attachment) throws Exception {
		String digest = null;
		
		InputStream is = null;
		try {
			is = attachment.getInputStream();

			// Perform SHA-1 digest
			MessageDigest md = MessageDigest.getInstance("SHA-1");

			byte[] buffer = new byte[512];
			int size = is.read(buffer);
			while( size >= 0 ){
				md.update(buffer, 0, size);
				size = is.read(buffer);
			}
			
			// B64 encode digest
			byte[] digestBytes = md.digest();

			byte[] encoded = Base64.encodeBase64(digestBytes);
			try (
				ByteArrayInputStream bais = new ByteArrayInputStream(encoded);
				InputStreamReader isr = new InputStreamReader(bais, "UTF-8");
				BufferedReader br = new BufferedReader(isr);
			) {
				digest = br.readLine();
			}
		} catch(Exception e) {
			throw new Exception("Error computing digest on attachment: "+attachment.getName(), e);
		} finally {
			if( null != is ) {
				try {
					is.close();
				} catch(Exception e) {
					// Ignore
				}
			}
		}
		
		return digest;
	}
}
