package ca.carleton.gcrc.couch.simplifiedGeometry;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.PrintStream;
import java.io.StringWriter;
import java.util.List;
import java.util.Map;

import org.json.JSONArray;
import org.json.JSONObject;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.client.CouchDb;

public class SimplifiedGeometryActions {

	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

	private CouchDb couchDb;

	public SimplifiedGeometryActions(CouchDb couchDb){
		this.couchDb = couchDb;
	}

	public JSONObject getAttachments(Map<String, String> attNameByDocId) throws Exception {
		JSONObject result = new JSONObject();
		
		JSONArray geometries = new JSONArray();
		result.put("geometries", geometries);
		
		long currentSize = 0;
		for(String docId : attNameByDocId.keySet()){
			String attName = attNameByDocId.get(docId);
			
			JSONObject attObj = new JSONObject();
			geometries.put(attObj);
			
			attObj.put("id", docId);
			attObj.put("attName", attName);
			
			try {
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				couchDb.downloadAttachment(docId, attName, baos);
				StringWriter sw = new StringWriter();
				ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
				InputStreamReader isr = new InputStreamReader(bais,"UTF-8");
				int c = isr.read();
				while( c >= 0 ){
					sw.write(c);
					c = isr.read();
				}
				sw.flush();
				String att = sw.toString();
				
				attObj.put("att", att);
				
				currentSize += att.length();
				
			} catch (Exception e) {
				logger.error("Error obtaining attachment "+docId+"/"+attName,e);
				attObj.put("error", true);
			}
			
			if( currentSize > 10000 ){
				break;
			}
		}
		
		return result;
	}

	public JSONObject getAttachments(List<GeometryAttachmentRequest> attachmentRequests) throws Exception {
		JSONObject result = new JSONObject();
		
		JSONArray geometries = new JSONArray();
		result.put("geometries", geometries);
		
		long currentSize = 0;
		for(GeometryAttachmentRequest attachmentRequest : attachmentRequests){
			String docId = attachmentRequest.getDocId();
			String attName = attachmentRequest.getAttName();
			
			JSONObject attObj = new JSONObject();
			geometries.put(attObj);
			
			attObj.put("id", docId);
			attObj.put("attName", attName);
			
			try {
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				couchDb.downloadAttachment(docId, attName, baos);
				StringWriter sw = new StringWriter();
				ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
				InputStreamReader isr = new InputStreamReader(bais,"UTF-8");
				int c = isr.read();
				while( c >= 0 ){
					sw.write(c);
					c = isr.read();
				}
				sw.flush();
				String att = sw.toString();
				
				attObj.put("att", att);
				
				currentSize += att.length();
				
			} catch (Exception e) {
				logger.error("Error obtaining attachment "+docId+"/"+attName,e);
				attObj.put("error", true);
			}
			
			if( currentSize > 1000000 ){
				break;
			}
		}
		
		return result;
	}

	public void getAttachments(List<GeometryAttachmentRequest> attachmentRequests, OutputStream os) throws Exception {
		AttachmentOutputStream attachmentOs = new AttachmentOutputStream(os);
		PrintStream ps = new PrintStream(attachmentOs);
		
		ps.print("{\"geometries\":[");
		
		boolean isFirst = true;
		for(GeometryAttachmentRequest attachmentRequest : attachmentRequests){
			
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
			ps.print(",\"att\":\"");

			try {
				attachmentOs.setEscapingString(true);
				couchDb.downloadAttachment(docId, attName, ps);
				attachmentOs.setEscapingString(false);
				
			} catch (Exception e) {
				logger.error("Error obtaining attachment "+docId+"/"+attName,e);
			}
			
			ps.print("\"}");
			
			if( attachmentOs.getCount() > 100 ){
				break;
			}
		}
		
		ps.print("]}");
		
		ps.flush();
	}
}
