package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.util.Collection;
import java.util.Iterator;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.json.JSONSupport;

public class DocumentStoreProcess {

	static final public String ATT_INFO_EXTENSION = "_nunaliit";
	static final public String ATT_INFO_CONTENT_TYPE = "content_type";
	static final public String ATT_INFO_NAME = "name";

	/**
	 * Takes a document and stores it to disk.
	 * @param doc Document that should be stored to disk
	 * @param dir Location where document should be stored.
	 * @throws Exception
	 */
	public void store(Document doc, File dir) throws Exception {
		if( null == doc ) {
			throw new Exception("When storing a document, a document must be provided");
		}
		if( null == dir ) {
			throw new Exception("A directory must be specified for storing: "+doc.getId());
		}
		
		try {
			// Make dir
			if( dir.exists() && false == dir.isDirectory() ){
				throw new Exception("Can not store object in non-directory");
			}
			if( false == dir.exists() ) {
				boolean created = false;
				try {
					created = dir.mkdir();
				} catch(Exception e) {
					throw new Exception("Unable to create directory: "+dir.getAbsolutePath(),e);
				}
				if( !created ) {
					throw new Exception("Unable to create directory: "+dir.getAbsolutePath());
				}
			}
			
			// Create _id.txt
			{
				String id = doc.getId();
				FileOutputStream fos = null;
				try {
					File idFile = new File(dir, "_id.txt");
					fos = new FileOutputStream(idFile);
					OutputStreamWriter osw = new OutputStreamWriter(fos, "UTF-8");
	
					osw.write(id);
					osw.flush();
					
					fos.close();
					fos = null;
					
				} catch(Exception e) {
					throw new Exception("Unable to write _id.txt for: "+id+" at: "+dir.getAbsolutePath());
					
				} finally {
					if( null != fos ){
						try {
							fos.close();
						} catch(Exception e){
							// Ignore
						}
					}
				}
			}
			
			// Store top elements
			JSONObject jsonObj = doc.getJSONObject();
			Iterator<?> it = jsonObj.keys();
			while( it.hasNext() ){
				Object keyObj = it.next();
				if( keyObj instanceof String ){
					String key = (String)keyObj;
					
					// Skip special keys
					if( key.codePointAt(0) == '_' ) {
						// Skip special keys
						
					} else if( "nunaliit_manifest".equals(key) ) {
						// Skip manifest
						
					} else {
						// Store
						try {
							storeKeyValue(jsonObj, dir, key);
						} catch(Exception e) {
							throw new Exception("Error while saving key: "+key, e);
						}
					}
				}
			}
			
			// Store attachments
			Collection<Attachment> attachments = doc.getAttachments();
			if( attachments.size() > 0 ) {
				// Create attachment directory
				File attachmentDir = new File(dir,"_attachments");
				mkdir(attachmentDir);
				
				for(Attachment attachment : attachments){
					try {
						storeAttachment(attachment, attachmentDir);
					} catch(Exception e) {
						throw new Exception("Unable to store attachment: "+attachment.getName(), e);
					}
				}
			}
			
		} catch(Exception e) {
			throw new Exception("Error while storing document: "+doc.getId(), e);
		}
	}

	private void storeKeyValue(JSONObject jsonObj, File dir, String key) throws Exception {
		Object value = jsonObj.get(key);

		File valueFile = null;
		if( value instanceof String ) {
			valueFile = new File(dir, key+".txt");
		} else {
			valueFile = new File(dir, key+".json");
		}

		FileOutputStream fos = null;
		try {
			fos = new FileOutputStream(valueFile);
			OutputStreamWriter osw = new OutputStreamWriter(fos, "UTF-8");

			if( value instanceof JSONObject ){
				JSONObject valueObj = (JSONObject)value;
				osw.write(valueObj.toString(3));
				
			} else if( value instanceof JSONArray ){
				JSONArray valueArr = (JSONArray)value;
				osw.write(valueArr.toString(3));
				
			} else if( value instanceof String ){
				String valueStr = (String)value;
				osw.write(valueStr);
				
			} else {
				String valueStr = JSONSupport.valueToString(value);
				osw.write(valueStr);
			}
			osw.flush();
			
			fos.close();
			fos = null;
			
		} catch(Exception e) {
			throw new Exception("Unable to write value for: "+key);
			
		} finally {
			if( null != fos ){
				try {
					fos.close();
				} catch(Exception e){
					// Ignore
				}
			}
		}
	}
	
	private void storeAttachment(Attachment attachment, File attachmentDir) throws Exception {
		String attachmentName = attachment.getName();
		String[] names = attachmentName.split("/");
		String lastName = names[names.length-1];
		
		// Create sub-directories
		File currentParent = attachmentDir;
		{
			for(int loop=0; loop<names.length-1; ++loop){
				String name = names[loop];
				File child = new File(currentParent, name);
				if( false == child.exists() ){
					mkdir(child);
				} else if( false == child.isDirectory() ) {
					throw new Exception("Attachment path is not a directory: "+child.getAbsolutePath());
				}
				currentParent = child;
			}
		}
		
		// Create attachment file
		{
			InputStream is = null;
			FileOutputStream fos = null;
			try {
				File attachmentFile = new File(currentParent, lastName);
				is = attachment.getInputStream();
				fos = new FileOutputStream(attachmentFile);
				
				byte[] buffer = new byte[100];
				int size = is.read(buffer);
				while( size >= 0 ){
					fos.write(buffer, 0, size);
					size = is.read(buffer);
				}
				
				is.close();
				is = null;
				
				fos.close();
				fos = null;
				
			} catch(Exception e) {
				throw new Exception("Error while saving attachment content", e);
				
			} finally {
				if( null != is ){
					try {
						is.close();
					} catch(Exception e) {
						// Ignore
					}
				}
				if( null != fos ){
					try {
						fos.close();
					} catch(Exception e) {
						// Ignore
					}
				}
			}
		}
		
		// Create info file
		{
			JSONObject infoObj = new JSONObject();
			infoObj.put(ATT_INFO_NAME, attachment.getName());
			infoObj.put(ATT_INFO_CONTENT_TYPE, attachment.getContentType());
			
			FileOutputStream fos = null;
			try {
				File attachmentFile = new File(currentParent, lastName+"."+ATT_INFO_EXTENSION);
				fos = new FileOutputStream(attachmentFile);
				OutputStreamWriter osw = new OutputStreamWriter(fos,"UTF-8");
				
				osw.write( infoObj.toString(3) );
				
				osw.flush();
				
				fos.close();
				fos = null;
				
			} catch(Exception e) {
				throw new Exception("Error while saving attachment content", e);
				
			} finally {
				if( null != fos ){
					try {
						fos.close();
					} catch(Exception e) {
						// Ignore
					}
				}
			}
		}
	}
	
	private void mkdir(File dir) throws Exception {
		boolean created = false;
		try {
			created = dir.mkdir();
		} catch(Exception e) {
			throw new Exception("Unable to create directory: "+dir.getAbsolutePath(),e);
		}
		if( !created ) {
			throw new Exception("Unable to create directory: "+dir.getAbsolutePath());
		}
	}
}
