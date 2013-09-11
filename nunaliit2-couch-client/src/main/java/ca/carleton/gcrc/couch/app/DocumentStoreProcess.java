package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStreamWriter;
import java.util.Collection;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;

import org.json.JSONArray;
import org.json.JSONObject;

import ca.carleton.gcrc.json.JSONSupport;
import ca.carleton.gcrc.utils.Files;

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
			Set<String> previousPaths = new HashSet<String>();
			
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
			} else {
				previousPaths = Files.getDescendantPathNames(dir, true);
				Files.emptyDirectory(dir);
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
						Object value = jsonObj.get(key);
						// Store
						try {
							storeKeyValue(dir, key, value, previousPaths, null);
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

	private void storeKeyValue(
			File dir
			,String key
			,Object value
			,Set<String> previousPaths
			,String pathPrefix
			) throws Exception {

		String objectPath = key;
		if( null != pathPrefix ) {
			objectPath = pathPrefix + File.pathSeparator + key;
		}
		String jsonPath = objectPath + ".json";

		if( value instanceof JSONObject ){
			if( previousPaths.contains(objectPath) ){
				File objectDir = new File(dir,key);
				Files.createDirectory(objectDir);
				storeObjectValue((JSONObject)value, objectDir, previousPaths, objectPath);
			} else {
				storeJsonValue(value, dir, key);
			}
			
		} else if( value instanceof JSONArray ){
			String arrayPath = objectPath + ".array";
			if( previousPaths.contains(arrayPath) ){
				File objectDir = new File(dir,key+".array");
				Files.createDirectory(objectDir);
				storeArrayValue((JSONArray)value, objectDir, previousPaths, arrayPath);
			} else {
				storeJsonValue(value, dir, key);
			}
			
		} else if( value instanceof String ) {
			if( previousPaths.contains(jsonPath) ){
				storeJsonValue(value, dir, key);
			} else {
				storeStringValue((String)value, dir, key);
			}
		} else {
			// integers, double, etc.
			storeJsonValue(value, dir, key);
		}
	}

	private void storeObjectValue(
			JSONObject jsonObj
			,File dir
			,Set<String> previousPaths
			,String pathPrefix
			) throws Exception {
		Iterator<?> it = jsonObj.keys();
		while( it.hasNext() ){
			Object keyObj = it.next();
			if( keyObj instanceof String ){
				String key = (String)keyObj;
				Object value = jsonObj.get(key);
				
				try {
					storeKeyValue(dir, key, value, previousPaths, pathPrefix);
				} catch(Exception e) {
					throw new Exception("Error while saving key: "+pathPrefix+"/"+key, e);
				}
			}
		}
	}

	private void storeArrayValue(
			JSONArray jsonArray
			,File dir
			,Set<String> previousPaths
			,String pathPrefix
			) throws Exception {
		int length = jsonArray.length();
		for(int i=0; i<length; ++i){
			String key = ""+i;
			Object value = jsonArray.get(i);

			try {
				storeKeyValue(dir, key, value, previousPaths, pathPrefix);
			} catch(Exception e) {
				throw new Exception("Error while saving key: "+pathPrefix+"/"+key, e);
			}
		}
	}

	private void storeJsonValue(
			Object value
			,File dir
			,String key
			) throws Exception {

		File valueFile =  new File(dir, key+".json");

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
				
			} else {
				String valueStr = JSONSupport.valueToString(value);
				osw.write(valueStr);
			}
			osw.flush();
			
			fos.close();
			fos = null;
			
		} catch(Exception e) {
			throw new Exception("Unable to write JSON value for: "+key);
			
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

	private void storeStringValue(
			String value
			,File dir
			,String key
			) throws Exception {

		File valueFile = new File(dir, key+".txt");

		FileOutputStream fos = null;
		try {
			fos = new FileOutputStream(valueFile);
			OutputStreamWriter osw = new OutputStreamWriter(fos, "UTF-8");

			osw.write(value);

			osw.flush();
			
			fos.close();
			fos = null;
			
		} catch(Exception e) {
			throw new Exception("Unable to write string value for: "+key);
			
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
