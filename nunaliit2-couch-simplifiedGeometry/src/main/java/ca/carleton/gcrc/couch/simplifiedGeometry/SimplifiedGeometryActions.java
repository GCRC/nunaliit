package ca.carleton.gcrc.couch.simplifiedGeometry;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.StringWriter;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.utils.StreamUtils;

public class SimplifiedGeometryActions {
	
	static final long RESPONSE_LENGHT_LIMIT = 1000000L;
	static final int RESPONSE_TIME_LIMIT_MS = 2000; // 2 seconds

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDb couchDb;

	public SimplifiedGeometryActions(CouchDb couchDb){
		this.couchDb = couchDb;
	}

	public JSONObject getAttachments(Map<String, String> attNameByDocId) throws Exception {
		JSONObject result = new JSONObject();
		
		long startMs = System.currentTimeMillis();
		
		JSONArray geometries = new JSONArray();
		result.put("geometries", geometries);
		
		long currentSize = 0;
		for(String docId : attNameByDocId.keySet()){
			String attName = attNameByDocId.get(docId);
			
			JSONObject attObj = new JSONObject();
			geometries.put(attObj);
			
			attObj.put("id", docId);
			attObj.put("attName", attName);
			
			// Get revision
			try {
				JSONObject dbDoc = couchDb.getDocument(docId);
				String revision = dbDoc.getString("_rev");
				attObj.put("rev", revision);
				
			} catch (Exception e) {
				logger.error("Error obtaining document "+docId,e);
				attObj.put("error", true);
			}
			
			try {
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				couchDb.downloadAttachment(docId, attName, baos);

				StringWriter sw = new StringWriter();
				ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
				InputStreamReader isr = new InputStreamReader(bais,"UTF-8");
				
				StreamUtils.copyStream(isr, sw);

				sw.flush();
				String att = sw.toString();
				
				attObj.put("att", att);
				
				currentSize += att.length();
				
			} catch (Exception e) {
				logger.error("Error obtaining attachment "+docId+"/"+attName,e);
				attObj.put("error", true);
			}
			
			if( currentSize > RESPONSE_LENGHT_LIMIT ){
				break;
			}
			
			long currentMs = System.currentTimeMillis();
			if( (currentMs - startMs) > RESPONSE_TIME_LIMIT_MS ){
				break;
			}
		}
		
		return result;
	}

	public JSONObject getAttachments(
			SimplifiedGeometryRequest simplifiedGeometryRequest
		) throws Exception {
		JSONObject result = new JSONObject();

		Long sizeLimit = simplifiedGeometryRequest.getSizeLimit();
		if( null == sizeLimit ){
			sizeLimit = new Long(RESPONSE_LENGHT_LIMIT);
		}

		Integer timeLimit = simplifiedGeometryRequest.getTimeLimit();
		if( null == timeLimit ){
			timeLimit = new Integer(RESPONSE_TIME_LIMIT_MS);
		}	
		
		long startMs = System.currentTimeMillis();
		long endMs = startMs + timeLimit;
		
		JSONArray geometries = new JSONArray();
		result.put("geometries", geometries);
		
		long currentSize = 0;
		for(GeometryAttachmentRequest attachmentRequest : simplifiedGeometryRequest.getRequests()){
			String docId = attachmentRequest.getDocId();
			String attName = attachmentRequest.getAttName();
			
			JSONObject attObj = new JSONObject();
			geometries.put(attObj);
			
			attObj.put("id", docId);
			attObj.put("attName", attName);
			
			// Get revision
			try {
				JSONObject dbDoc = couchDb.getDocument(docId);
				String revision = dbDoc.getString("_rev");
				attObj.put("rev", revision);
				
			} catch (Exception e) {
				logger.error("Error obtaining document "+docId,e);
				attObj.put("error", true);
			}
			
			try {
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				couchDb.downloadAttachment(docId, attName, baos);

				StringWriter sw = new StringWriter();
				ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
				InputStreamReader isr = new InputStreamReader(bais,"UTF-8");

				StreamUtils.copyStream(isr, sw);

				sw.flush();
				String att = sw.toString();
				
				attObj.put("att", att);
				
				currentSize += att.length();
				
			} catch (Exception e) {
				logger.error("Error obtaining attachment "+docId+"/"+attName,e);
				attObj.put("error", true);
			}
			
			if( currentSize > sizeLimit ){
				break;
			}
			
			long currentMs = System.currentTimeMillis();
			if( currentMs > endMs ){
				break;
			}
		}
		
		return result;
	}

	public void getAttachments(
			SimplifiedGeometryRequest simplifiedGeometryRequest, 
			OutputStream os
		) throws Exception {
		AttachmentOutputStream attachmentOs = new AttachmentOutputStream(os);
		PrintStream ps = new PrintStream(attachmentOs);
		
		Long sizeLimit = simplifiedGeometryRequest.getSizeLimit();
		if( null == sizeLimit ){
			sizeLimit = new Long(RESPONSE_LENGHT_LIMIT);
		}

		Integer timeLimit = simplifiedGeometryRequest.getTimeLimit();
		if( null == timeLimit ){
			timeLimit = new Integer(RESPONSE_TIME_LIMIT_MS);
		}	
		
		long startMs = System.currentTimeMillis();
		long endMs = startMs + timeLimit;
		
		ps.print("{\"geometries\":[");
		
		boolean isFirst = true;
		for(GeometryAttachmentRequest attachmentRequest : simplifiedGeometryRequest.getRequests()){
			
			if( isFirst ){
				isFirst = false;
			} else {
				ps.print(",");
			}
			
			String docId = attachmentRequest.getDocId();
			String attName = attachmentRequest.getAttName();

			ps.print("{\"id\":");
			ps.print(JSONObject.quote(docId));
			ps.print(",\"attName\":");
			ps.print(JSONObject.quote(attName));
			
			// Get revision
			try {
				JSONObject dbDoc = couchDb.getDocument(docId);
				String revision = dbDoc.getString("_rev");
				ps.print(",\"rev\":");
				ps.print(JSONObject.quote(revision));
				
			} catch (Exception e) {
				logger.error("Error obtaining document "+docId,e);
			}

			ps.print(",\"att\":\"");
			attachmentOs.setEscapingString(true);
			
			try {
				couchDb.downloadAttachment(docId, attName, ps);
				
			} catch (Exception e) {
				logger.error("Error obtaining attachment "+docId+"/"+attName,e);
			}
			
			attachmentOs.setEscapingString(false);
			ps.print("\"}");
			
			if( attachmentOs.getCount() > sizeLimit ){
				break;
			}
			
			long currentMs = System.currentTimeMillis();
			if( currentMs > endMs ){
				break;
			}
		}
		
		ps.print("]}");
		
		ps.flush();
	}
}
