package ca.carleton.gcrc.couch.app.impl;

import java.io.BufferedReader;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.io.StringReader;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Collection;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONTokener;

import ca.carleton.gcrc.couch.app.Attachment;
import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryNameFilter;
import ca.carleton.gcrc.couch.fsentry.FSEntryNull;
import ca.carleton.gcrc.couch.fsentry.FSEntrySupport;
import ca.carleton.gcrc.utils.StreamUtils;

public class DocumentFile implements Document {

	static final private Pattern patternFileNameAndExtension = Pattern.compile("^(.*)\\.([^.]*)$");
	static final private Pattern patternInteger = Pattern.compile("^([0-9]+)$");
	static final private Pattern patternInclusion = Pattern.compile("!code\\s+([^ \\t\\r\\n]*)");

	static public FSEntryNameFilter defaultFilenameFilter = new FSEntryNameFilter() {
		@Override
		public boolean accept(FSEntry dir, String name) {
			if( name.startsWith(".") ) {
				return false;
			}
			if( name.endsWith("~") ) {
				return false;
			}
			return true;
		}
	};
	static public FSEntry defaultIncludeEntry = new FSEntryNull();
	
	static public DocumentFile createDocument(FSEntry directory) throws Exception {
		return createDocument(directory, defaultFilenameFilter, defaultIncludeEntry);
	}
	
	static public DocumentFile createDocument(FSEntry directory, FSEntryNameFilter filter) throws Exception {
		return createDocument(directory, filter, defaultIncludeEntry);
	}
	
	static public DocumentFile createDocument(FSEntry directory, FSEntry includeDir) throws Exception {
		return createDocument(directory, defaultFilenameFilter, includeDir);
	}
	
	static public DocumentFile createDocument(FSEntry directory, FSEntryNameFilter filter, FSEntry includeDir) throws Exception {
		// Check that directory exists and is a directory
		if( null == directory ) {
			throw new Exception("Directory required to build a document");
		}
		
		if( null == filter ){
			filter = defaultFilenameFilter;
		}
		
		if( null == includeDir ){
			includeDir = defaultIncludeEntry;
		}
		
		DocumentFile doc = new DocumentFile(directory, filter, includeDir);
		
		return doc;
	}

	static public Object readJson(Reader reader) throws Exception {
		
		Object result = null;
		
		try {
			JSONTokener tokener = new JSONTokener(reader);
			result = tokener.nextValue();
			
			// There should be nothing left in the stream but white spaces
			// There should be nothing left in the stream but white spaces
			char c = tokener.next();
			while( c > 0 ){
				if( ' ' == c ){
					// OK
				} else if( '\t'  == c ){
					// OK
				} else if( '\r'  == c ){
					// OK
				} else if( '\n'  == c ){
					// OK
				} else {
					throw new Exception("Unexpected character found at end of JSON stream: "+c+ " ("+tokener+")");
				}
				
				c = tokener.next();
			}
			
		} catch (Exception e) {
			throw new Exception("Error while reading JSON stream", e);
		}
		
		return result;
	}

	static public Object readJson(FSEntry file) throws Exception {
		
		Object result = null;
		
		InputStream is = null;
		InputStreamReader isr = null;
		try {
			is = file.getInputStream();
			isr = new InputStreamReader(is, "UTF-8");

			result = readJson(isr);
			
			isr.close();
			isr = null;
			
			is.close();
			is = null;
			
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
	
	private FSEntry top;
	private FSEntryNameFilter filter = null;
	private FSEntry includeDir;
	private JSONObject jsonObj = null;
	private Map<String,AttachmentFile> attachmentsByName = new HashMap<String,AttachmentFile>();
	private String ATT_INFO_PERIOD_EXTENSION = "."+DocumentStoreProcessImpl.ATT_INFO_EXTENSION;

	private DocumentFile(FSEntry directory, FSEntryNameFilter filter, FSEntry includeDir) throws Exception {
		this.top = directory;
		this.filter = filter;
		this.includeDir = includeDir;
		
		readTopDirectory();
	}
	
	@Override
	public String getId() {
		if( null != jsonObj ) {
			String id = jsonObj.optString("_id",null);
			return id;
		}
		return null;
	}

	@Override
	public void setId(String id) throws Exception {
		jsonObj.put("_id", id);
	}

	@Override
	public String getRevision() {
		if( null != jsonObj ) {
			String id = jsonObj.optString("_rev");
			return id;
		}
		return null;
	}

	@Override
	public JSONObject getJSONObject() {
		return jsonObj;
	}

	@Override
	public Collection<Attachment> getAttachments() {
		return new ArrayList<Attachment>(attachmentsByName.values());
	}

	@Override
	public Attachment getAttachmentByName(String attachmentName) {
		return attachmentsByName.get(attachmentName);
	}

	private void readTopDirectory() throws Exception {
		this.jsonObj = new JSONObject();
		
		// List all elements in directory
		List<FSEntry> children = this.top.getChildren(filter);
		
		// Process each child
		for(FSEntry child : children) {
			String childName = child.getName();

			// Handle attachments in a special manner
			if( "_attachments".equals(childName) ) {
				createAttachmentsFromDirectory("", child);
			} else {
				
				// Compute name without extension, which is the key
				String key = null;
				boolean isChildAnArray = false;
				boolean isChildJson = false;
				{
					Matcher faeMatcher = patternFileNameAndExtension.matcher(childName);
					if( faeMatcher.matches() ) {
						key = faeMatcher.group(1);
						
						String ext = faeMatcher.group(2);
						isChildAnArray = "array".equals(ext);
						isChildJson = "json".equals(ext);
					} else {
						key = childName;
					}
				}
	
				// Read value
				if( child.isDirectory() ) {
					if( isChildAnArray ) {
						// Child is an array
						JSONArray value = readArrayDirectory(child);
						this.jsonObj.put(key, value);
					} else {
						// Child is an object
						JSONObject value = readObjectDirectory(child);
						this.jsonObj.put(key, value);
					}
				} else if( child.isFile() ) {
					if( isChildJson ) {
						Object value = readJson(child);
						this.jsonObj.put(key, value);
					} else {
						String value = readStringFile(child);
						
						if( "_id".equals(key) ){
							// It is not likely that preceding and trailing
							// spaces are intended for document identifiers.
							// They cause way too much trouble.
							value = value.trim();
						}
						
						this.jsonObj.put(key, value);
					}
				} else {
					throw new Exception("Does not know how to handle children element of top object: "+childName);
				}
			}
		}
	}
	
	private void createAttachmentsFromDirectory(String parentName, FSEntry dir) throws Exception {
		// List all elements in directory
		List<FSEntry> children = dir.getChildren(filter);
		
		// Process each child
		for(FSEntry child : children) {
			String childName = child.getName();
			
			if( childName.endsWith(ATT_INFO_PERIOD_EXTENSION) ) {
				// Skip info files
				
			} else if( child.isDirectory() ) {
				String name = parentName + childName + "/";
				createAttachmentsFromDirectory(name, child);
				
			} else if( child.isFile() ) {
				String name = parentName + childName;
				createAttachmentFromFile(dir, name, child);
			}
		}
	}

	private void createAttachmentFromFile(FSEntry parentDir, String name, FSEntry file) throws Exception {
		
		String attachmentName = name;
		String contentType = null;
		
		// Look for info file
		{
			FSEntry infoFile = parentDir.getChild(name+ATT_INFO_PERIOD_EXTENSION);
			if( null != infoFile 
			 && infoFile.isFile() ) {
				// Load and interpret info file
				InputStream fis = null;
				try {
					fis = infoFile.getInputStream();
					InputStreamReader isr = new InputStreamReader(fis,"UTF-8");
					StringWriter sw = new StringWriter();

					StreamUtils.copyStream(isr, sw);
					
					sw.flush();
					
					fis.close();
					fis = null;
					
					JSONTokener tokener = new JSONTokener(sw.toString());
					Object infoObj = tokener.nextValue();
					if( infoObj instanceof JSONObject ) {
						JSONObject info = (JSONObject)infoObj;
						
						{
							String testName = info.optString(DocumentStoreProcessImpl.ATT_INFO_NAME);
							if( null == testName ){
								// Ignore
							} else if("".equals(testName)) {
								// Ignore
							} else {
								attachmentName = testName;
							}
						}

						{
							String testContentType = info.optString(DocumentStoreProcessImpl.ATT_INFO_CONTENT_TYPE);
							if( null == testContentType ){
								// Ignore
							} else if("".equals(testContentType)) {
								// Ignore
							} else {
								contentType = testContentType;
							}
						}
						
					} else {
						throw new Exception("Unexpected class for information object: "+infoObj.getClass().getName());
					}
					
				} catch(Exception e) {
					throw new Exception("Error while reading info file", e);
				} finally {
					if( null != fis ){
						try {
							fis.close();
						} catch(Exception e) {
							// Ignore
						}
					}
				}
			}
		}

		// Predict content type from extension
		if( null == contentType ) {
			Matcher fnaeMatcher = patternFileNameAndExtension.matcher(name);
			if( fnaeMatcher.matches() ) {
				String extension = fnaeMatcher.group(2);
				MimeType mimeType = MimeTypeDb.getDefaultDB().fromFileExtension(extension);
				if( null != mimeType ){
					contentType = mimeType.getContentType();
				}
			}
		}

		// Default content type
		if( null == contentType ) {
			contentType = "application/binary";
		}
		
		AttachmentFile att = new AttachmentFile(attachmentName, file, contentType);
		this.attachmentsByName.put(attachmentName,att);
	}

	private JSONArray readArrayDirectory(FSEntry dir) throws Exception{
		JSONArray arr = new JSONArray();
		
		// List all elements in directory, in sorted order
		List<FSEntry> children = dir.getChildren(filter);
		Collections.sort(children,new Comparator<FSEntry>(){
			@Override
			public int compare(FSEntry o1, FSEntry o2) {
				return o1.getName().compareTo( o2.getName() );
			}
		});
		
		// Process each child
		for(FSEntry child : children) {
			String childName = child.getName();
			
			// Compute name without extension, which is the key
			String keyStr = null;
			boolean isChildAnArray = false;
			boolean isChildJson = false;
			{
				Matcher faeMatcher = patternFileNameAndExtension.matcher(childName);
				if( faeMatcher.matches() ) {
					keyStr = faeMatcher.group(1);
					
					String ext = faeMatcher.group(2);
					isChildAnArray = "array".equals(ext);
					isChildJson = "json".equals(ext);
				} else {
					keyStr = childName;
				}
			}
			
			// The key should be an integer
			{
				Matcher integerMatcher = patternInteger.matcher(keyStr);
				if( false == integerMatcher.matches() ) {
					throw new Exception("An array represented by a directory must have files with integer names: "+keyStr+" ("+childName+")");
				}
			}
			
			// Read value
			if( child.isDirectory() ) {
				if( isChildAnArray ) {
					// Child is an array
					JSONArray value = readArrayDirectory(child);
					arr.put(value);
				} else {
					// Child is an object
					JSONObject value = readObjectDirectory(child);
					arr.put(value);
				}
			} else if( child.isFile() ) {
				if( isChildJson ) {
					Object value = readJson(child);
					arr.put(value);
				} else {
					String value = readStringFile(child);
					arr.put(value);
				}
			} else {
				throw new Exception("Does not know how to handle children element of array: "+childName);
			}
		}
		
		return arr;
	}

	private JSONObject readObjectDirectory(FSEntry dir) throws Exception {
		JSONObject obj = new JSONObject();
		
		// List all elements in directory
		List<FSEntry> children = dir.getChildren(filter);
		
		// Process each child
		for(FSEntry child : children) {
			String childName = child.getName();
			
			// Compute name without extension, which is the key
			String key = null;
			boolean isChildAnArray = false;
			boolean isChildJson = false;
			{
				Matcher faeMatcher = patternFileNameAndExtension.matcher(childName);
				if( faeMatcher.matches() ) {
					key = faeMatcher.group(1);
					
					String ext = faeMatcher.group(2);
					isChildAnArray = "array".equals(ext);
					isChildJson = "json".equals(ext);
				} else {
					key = childName;
				}
			}

			// Read value
			if( child.isDirectory() ) {
				if( isChildAnArray ) {
					// Child is an array
					JSONArray value = readArrayDirectory(child);
					obj.put(key, value);
				} else {
					// Child is an object
					JSONObject value = readObjectDirectory(child);
					obj.put(key, value);
				}
			} else if( child.isFile() ) {
				if( isChildJson ) {
					Object value = readJson(child);
					obj.put(key, value);
				} else {
					String value = readStringFile(child);
					obj.put(key, value);
				}
			} else {
				throw new Exception("Does not know how to handle children element of object: "+childName);
			}
		}
		
		return obj;
	}

	private String readStringFile(FSEntry file) throws Exception {
		StringWriter sw = new StringWriter();
		InputStream is = null;
		try {
			is = file.getInputStream();
			InputStreamReader isr = new InputStreamReader(is, "UTF-8");

			StreamUtils.copyStream(isr, sw);
			
			sw.flush();
			
		} catch (Exception e) {
			throw new Exception("Error while reading file: "+file.getName(), e);
			
		} finally {
			if( null != is ) {
				try {
					is.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
		
		String expandedValue = expandInclusion(sw.toString());
		
		if( expandedValue.length() > 0 
		 && expandedValue.indexOf('\n') == (expandedValue.length()-1) ) {
			// If there is only one EOL char and it is located at the
			// end, remove it. This is to fix issues where editors (such as
			// vi) insert an extraneous EOL. If there is only one EOL, it is
			// a text field that is probably meant to not have multi-lines
			expandedValue = expandedValue.substring(0, expandedValue.length()-1);
			while( expandedValue.length() > 0 
			  && '\r' == expandedValue.charAt(expandedValue.length()-1) ){
				expandedValue = expandedValue.substring(0, expandedValue.length()-1);
			}
		}
		
		return expandedValue;
	}
	
	/**
	 * This method takes a string and expands the inclusion statements found in it. 
	 * It returns the fully expanded string. An inclusion is a line that contains
	 * !code <filename> 
	 * @param content Initial content
	 * @return Expanded content by inserting the included files
	 * @throws Exception 
	 */
	private String expandInclusion(String content) throws Exception{
		// Quick check
		{
			Matcher matcher = patternInclusion.matcher(content);
			if( false == matcher.find() ){
				return content;
			}
		}
		
		// OK, perform processing
		StringWriter output = new StringWriter();
		StringReader sr = new StringReader(content);
		BufferedReader br = new BufferedReader(sr);
		String line = br.readLine();
		while( null != line ){
			Matcher matcher = patternInclusion.matcher(line);
			if( matcher.find() ){
				output.write(line);
				
				String filePath = matcher.group(1);
				FSEntry includedEntry = FSEntrySupport.findDescendant(includeDir, filePath);
				if( null != includedEntry ) {
					output.write("\n");
					insertFile(output, includedEntry);
				} else {
					output.write(" - not found\n");
				}
				
			} else {
				output.write(line);
				output.write("\n");
			}
			line = br.readLine();
		}
		
		return output.toString();
	}

	private void insertFile(Writer writer, FSEntry includedEntry) throws Exception {
		InputStream is = null;
		try {
			is = includedEntry.getInputStream();
			InputStreamReader isr = new InputStreamReader(is, "UTF-8");
			
			StreamUtils.copyStream(isr, writer);
			
			writer.flush();
			
		} catch (Exception e) {
			throw new Exception("Error while reading file: "+includedEntry.getName(), e);
			
		} finally {
			if( null != is ) {
				try {
					is.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
	}
}
