package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import java.util.Collection;
import java.util.HashSet;
import java.util.Iterator;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.json.JSONSupport;
import ca.carleton.gcrc.utils.Files;

public class DocumentStoreProcess {
	
	protected Logger logger = LoggerFactory.getLogger(this.getClass());

	static final public String FILE_EXT_ARRAY = "array";
	static final public String FILE_EXT_JSON = "json";
	static final public String FILE_EXT_TEXT = "txt";
	static final public String FILE_EXT_HTML = "html";
	
	static final public String ATT_INFO_EXTENSION = "_nunaliit";
	static final public String ATT_INFO_CONTENT_TYPE = "content_type";
	static final public String ATT_INFO_NAME = "name";

	static private Pattern patternNameExtension = Pattern.compile("^(.*)\\.([^.]*)$");
	static private Pattern patternIndex = Pattern.compile("^[0-9]+$");
	
	static private String rightTrim(String s) {
	    int i = s.length()-1;
	    
	    while( i >= 0 && Character.isWhitespace(s.charAt(i)) ) {
	        --i;
	    }
	    
	    if( i == (s.length()-1) ) return s;
	    
	    return s.substring(0,i+1);
	}

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
			} else {
				removeUndesiredFiles(doc.getJSONObject(), dir);
			}
			
			// Create _id.txt
			{
				String id = doc.getId();

				boolean fileUpdateRequired = true;
				File idFile = new File(dir, "_id.txt");
				if( idFile.exists() ){
					try{
						String fileValue = readStringFile(idFile);
						fileValue = fileValue.trim();
						if( fileValue.equals(id) ){
							fileUpdateRequired = false;
						}
						
					} catch(Exception e) {
						// ignore
					}
				}
				
				if( fileUpdateRequired ) {
					FileOutputStream fos = null;
					try {
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
							storeKeyValue(dir, key, value, null);
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
				Files.createDirectory(attachmentDir);
				
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
			,String pathPrefix
			) throws Exception {

		// Detect if a file already exists for this key
		File childFile = null;
		String fileExtension = null;
		{
			File[] childrenFiles = dir.listFiles();
			for(File child : childrenFiles){
				String name = child.getName();
				String extension = null;
				Matcher matcherNameExtension = patternNameExtension.matcher(name);
				if( matcherNameExtension.matches() ){
					name = matcherNameExtension.group(1);
					extension = matcherNameExtension.group(2);
				}
				
				if( name.equals(key) ){
					childFile = child;
					fileExtension = extension;
					break;
				}
			}
		}
		
		// Compute the path to this value
		String objectPath = key;
		if( null != pathPrefix ) {
			objectPath = pathPrefix + File.pathSeparator + key;
		}

		if( value instanceof JSONObject ){
			if( null != childFile && childFile.isDirectory() ){
				storeObjectValue((JSONObject)value, childFile, objectPath);
			} else {
				storeJsonValue(value, dir, key);
			}
			
		} else if( value instanceof JSONArray ){
			if( null != childFile && childFile.isDirectory() ){
				storeArrayValue((JSONArray)value, childFile, objectPath);
			} else {
				storeJsonValue(value, dir, key);
			}
			
		} else if( value instanceof String ) {
			if( null != childFile && FILE_EXT_JSON.equals(fileExtension) ){
				// Update current JSON file
				storeJsonValue(value, dir, key);
			} else if( null != childFile ){
				// Update current text file
				storeStringValue((String)value, childFile, key);
			} else {
				// Create new file
				File valueFile = new File(dir, key+"."+FILE_EXT_TEXT);
				storeStringValue((String)value, valueFile, key);
			}
		} else {
			// integers, double, etc.
			storeJsonValue(value, dir, key);
		}
	}

	private void storeObjectValue(
			JSONObject jsonObj
			,File dir
			,String pathPrefix
			) throws Exception {
		Iterator<?> it = jsonObj.keys();
		while( it.hasNext() ){
			Object keyObj = it.next();
			if( keyObj instanceof String ){
				String key = (String)keyObj;
				Object value = jsonObj.get(key);
				
				try {
					storeKeyValue(dir, key, value, pathPrefix);
				} catch(Exception e) {
					throw new Exception("Error while saving key: "+pathPrefix+"/"+key, e);
				}
			}
		}
	}

	private void storeArrayValue(
			JSONArray jsonArray
			,File dir
			,String pathPrefix
			) throws Exception {
		int length = jsonArray.length();
		for(int i=0; i<length; ++i){
			String key = ""+i;
			Object value = jsonArray.get(i);

			try {
				storeKeyValue(dir, key, value, pathPrefix);
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

		File valueFile =  new File(dir, key+"."+FILE_EXT_JSON);
		
		// Do not overwrite a JSON file if the content on disk is
		// equivalent
		boolean fileUpdateRequired = true;
		if( valueFile.exists() && valueFile.isFile() ){
			// Read in JSON file
			Object diskValue = readJsonFile(valueFile);
			
			if( 0 == JSONSupport.compare(diskValue, value) ) {
				fileUpdateRequired = false;
			}
		}

		if( fileUpdateRequired ){
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
	}

	private void storeStringValue(
			String value
			,File valueFile
			,String key
			) throws Exception {

		// Do not overwrite a text file if the content on disk is
		// equivalent
		boolean fileUpdateRequired = true;
		if( valueFile.exists() && valueFile.isFile() ){
			// Read in JSON file
			String diskValue = readStringFile(valueFile);
			
			if( diskValue.equals(value) ) {
				fileUpdateRequired = false;
			}
			
			// No update required if difference is just last end-of-line
			if( rightTrim(diskValue).equals( rightTrim(value) ) ) {
				fileUpdateRequired = false;
			}
		}
		
		if( fileUpdateRequired ){
			FileOutputStream fos = null;
			OutputStreamWriter osw = null;
			try {
				fos = new FileOutputStream(valueFile);
				osw = new OutputStreamWriter(fos, "UTF-8");

				osw.write(value);

				osw.flush();
				
			} catch(Exception e) {
				throw new Exception("Unable to write string value for: "+key);
				
			} finally {
				if( null != osw ){
					try {
						osw.close();
					} catch(Exception e){
						// Ignore
					}
				}
				if( null != fos ){
					try {
						fos.close();
					} catch(Exception e){
						// Ignore
					}
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
					Files.createDirectory(child);
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

	private Object readJsonFile(File file) throws Exception {
		
		Object result = null;
		
		StringWriter sw = new StringWriter();
		FileInputStream is = null;
		InputStreamReader isr = null;
		char[] buffer = new char[100];
		try {
			is = new FileInputStream(file);
			isr = new InputStreamReader(is, "UTF-8");
			
			int size = isr.read(buffer);
			while( size >= 0 ) {
				sw.write(buffer, 0, size);
				size = isr.read(buffer);
			}
			
			sw.flush();
			
			JSONTokener tokener = new JSONTokener(sw.toString());
			result = tokener.nextValue();
			
		} catch (Exception e) {
			throw new Exception("Error while reading file: "+file.getName(), e);
			
		} finally {
			if( null != isr ) {
				try {
					isr.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			if( null != is ) {
				try {
					is.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
		
		return result;
	}
	
	private String readStringFile(File file) throws Exception {
		StringWriter sw = new StringWriter();
		FileInputStream is = null;
		InputStreamReader isr = null;
		char[] buffer = new char[100];
		try {
			is = new FileInputStream(file);
			isr = new InputStreamReader(is, "UTF-8");
			
			int size = isr.read(buffer);
			while( size >= 0 ) {
				sw.write(buffer, 0, size);
				size = isr.read(buffer);
			}
			
			sw.flush();
			
		} catch (Exception e) {
			throw new Exception("Error while reading file: "+file.getName(), e);
			
		} finally {
			if( null != isr ) {
				try {
					isr.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			if( null != is ) {
				try {
					is.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
		
		return sw.toString();
	}
	
	/**
	 * This function scans the directory for files that are no longer needed to represent
	 * the document given in arguments. The detected files are deleted from disk.
	 * @param doc The document that should be stored in the directory
	 * @param dir The directory where the document is going to be stored
	 */
	private void removeUndesiredFiles(JSONObject doc, File dir) throws Exception {
		Set<String> keysKept = new HashSet<String>();
		
		// Loop through each child of directory
		File[] children = dir.listFiles();
		for(File child : children){
			String name = child.getName();
			String extension = "";
			Matcher matcherNameExtension = patternNameExtension.matcher(name);
			if( matcherNameExtension.matches() ){
				name = matcherNameExtension.group(1);
				extension = matcherNameExtension.group(2);
			}

			// Get child object
			Object childElement = doc.opt(name);
			
			// Verify if we should keep this file
			boolean keepFile = false;
			if( null == childElement ){
				// No matching element
				
			} else if( "_attachments".equals(name) ) {
				// Always remove _attachments

			} else if( keysKept.contains(name) ) {
				// Remove subsequent files that match same key
				
			} else if( child.isDirectory() ) {
				// If extension is array, then check if we have an array of that name
				if( FILE_EXT_ARRAY.equals(extension) ){
					// This must be an array
					if( childElement instanceof JSONArray ){
						// That's OK
						keepFile = true;
						
						// Continue checking with files in directory
						JSONArray childArr = (JSONArray)childElement;
						removeUndesiredFiles(childArr, child);
					}
					
				} else {
					// This must be an object
					if( childElement instanceof JSONObject ){
						// That's OK
						keepFile = true;
						
						// Continue checking with files in directory
						JSONObject childObj = (JSONObject)childElement;
						removeUndesiredFiles(childObj, child);
					}
				}
				
			} else {
				// Child is a file.
				if( FILE_EXT_JSON.equals(extension) ){
					// Anything can be saved in a .json file
					keepFile = true;
					
				} else if( childElement instanceof String ){
					// Anything else must match a string
					keepFile = true;
				}
			}

			// Remove file if it no longer fits the object
			if( keepFile ){
				keysKept.add(name);
				
			} else {
				if( child.isDirectory() ){
					Files.emptyDirectory(child);
				}
				child.delete();
			}
		}
	}

	private void removeUndesiredFiles(JSONArray arr, File dir) throws Exception {
		Set<String> keysKept = new HashSet<String>();
		
		// Loop through each child of directory
		File[] children = dir.listFiles();
		for(File child : children){
			String name = child.getName();
			String extension = "";
			Matcher matcherNameExtension = patternNameExtension.matcher(name);
			if( matcherNameExtension.matches() ){
				name = matcherNameExtension.group(1);
				extension = matcherNameExtension.group(2);
			}

			Matcher matcherIndex = patternIndex.matcher(name);
			boolean keepFile = false;
			if( matcherIndex.matches() ){
				// Get the index
				int index = Integer.parseInt(name);
			
				// Get child object
				Object childElement = arr.opt(index);
				
				// Verify if we should keep this file
				if( null == childElement ){
					// No matching element
					
				} else if( keysKept.contains(name) ) {
					// Remove subsequent files that match same key
					
				} else if( child.isDirectory() ) {
					// If extension is array, then check if we have an array of that name
					if( FILE_EXT_ARRAY.equals(extension) ){
						// This must be an array
						if( childElement instanceof JSONArray ){
							// That's OK
							keepFile = true;
							
							// Continue checking with files in directory
							JSONArray childArr = (JSONArray)childElement;
							removeUndesiredFiles(childArr, child);
						}
						
					} else {
						// This must be an object
						if( childElement instanceof JSONObject ){
							// That's OK
							keepFile = true;
							
							// Continue checking with files in directory
							JSONObject childObj = (JSONObject)childElement;
							removeUndesiredFiles(childObj, child);
						}
					}
					
				} else {
					// Child is a file.
					if( FILE_EXT_JSON.equals(extension) ){
						// Anything can be saved in a .json file
						keepFile = true;
						
					} else if( childElement instanceof String ){
						// Anything else must match a string
						keepFile = true;
					}
				}
			}

			// Remove file if it no longer fits the object
			if( keepFile ){
				keysKept.add(name);
				
			} else {
				if( child.isDirectory() ){
					Files.emptyDirectory(child);
				}
				child.delete();
			}
		}
	}
}
