package ca.carleton.gcrc.couch.app;

import java.io.File;
import java.io.FileInputStream;
import java.io.FilenameFilter;
import java.io.InputStreamReader;
import java.io.OutputStream;
import java.io.OutputStreamWriter;
import java.io.StringWriter;
import java.io.Writer;
import java.util.ArrayList;
import java.util.Collections;
import java.util.Iterator;
import java.util.List;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import org.json.JSONArray;
import org.json.JSONObject;
import org.json.JSONWriter;
import org.json.JSONTokener;

public class JSONFileLoader implements JSONLoader {

	static final private Pattern patternFileNameAndExtension = Pattern.compile("^(.*)\\.([^.]*)$");
	
	private File top;
	private FilenameFilter filter = null;

	public JSONFileLoader(File directory) throws Exception {
		// Check that directory exists and is a directory
		if( false == directory.exists() ) {
			throw new Exception("Can not build JSON from a file/directory that does not exist: "+directory.getAbsolutePath());
		}
		
		this.top = directory;
		this.filter = new FilenameFilter() {
			@Override
			public boolean accept(File dir, String name) {
				if( name.startsWith(".") ) {
					return false;
				}
				return true;
			}
		};
	}

	public JSONFileLoader(File directory, FilenameFilter filter) throws Exception {
		// Check that directory exists and is a directory
		if( false == directory.exists() ) {
			throw new Exception("Can not build JSON from a file/directory that does not exist: "+directory.getAbsolutePath());
		}
		
		this.top = directory;
		this.filter = filter;
	}
	
	public FilenameFilter getFilter() {
		return filter;
	}

	public void setFilter(FilenameFilter filter) {
		this.filter = filter;
	}
	
	@Override
	public void write(OutputStream stream, String charSet) throws Exception {
		OutputStreamWriter osw = new OutputStreamWriter(stream, charSet);
		write(osw);
		osw.flush();
	}
	
	@Override
	public void write(Writer writer) throws Exception {
		JSONWriter builder = new JSONWriter(writer);
		write(builder);
	}

	@Override
	public void write(JSONWriter builder) throws Exception {
		if( top.isDirectory() ) {
			builder.object();
			writeDirectory(builder, top, true);
			builder.endObject();
			
		} else if( top.isFile() ) {
			Object obj = fileToJSON(top);
			writeObject(builder, obj);

		} else {
			throw new Exception("Unable to handle file/directory: "+top.getAbsolutePath());
		}
	}

	private void writeDirectory(JSONWriter builder, File dir, boolean withinObject) throws Exception {
		// List all elements in directory, in sorted order
		List<String> children = null;
		{
			String[] childrenArr = dir.list(filter);
			children = new ArrayList<String>(childrenArr.length);
			for(String child : childrenArr) {
				children.add(child);
			}
			Collections.sort(children);
		}
		
		// Process each child
		for(String child : children) {
			File file = new File(dir,child);
			
			// Compute name without extension, which is the key
			String key = null;
			boolean isChildAnArray = false;
			boolean isChildJson = false;
			{
				Matcher faeMatcher = patternFileNameAndExtension.matcher(child);
				if( faeMatcher.matches() ) {
					key = faeMatcher.group(1);
					
					String ext = faeMatcher.group(2);
					isChildAnArray = "array".equals(ext);
					isChildJson = "json".equals(ext);
				} else {
					key = child;
				}
			}

			// If this is within an object definition, then
			// output the key
			if( withinObject ) {
				builder.key(key);
			}
			
			// Output value
			if( file.isDirectory() ) {
				if( isChildAnArray ) {
					// Child is an array
					builder.array();
					writeDirectory(builder, file, false);
					builder.endArray();
				} else {
					// Child is an object
					builder.object();
					writeDirectory(builder, file, true);
					builder.endObject();
				}
			} else if( file.isFile() ) {
				if( isChildJson ) {
					Object obj = fileToJSON(file);
					writeObject(builder, obj);
				} else {
					String content = fileToString(file);
					builder.value(content);
				}
			} else {
				// Ignore?
			}
		}
	}

	private String fileToString(File file) throws Exception {
		StringWriter sw = new StringWriter();
		FileInputStream fis = null;
		char[] buffer = new char[100];
		try {
			fis = new FileInputStream(file);
			InputStreamReader isr = new InputStreamReader(fis, "UTF-8");
			
			int size = isr.read(buffer);
			while( size >= 0 ) {
				sw.write(buffer, 0, size);
				size = isr.read(buffer);
			}
			
			sw.flush();
			
		} catch (Exception e) {
			throw new Exception("Error while reading file: "+file.getAbsolutePath(), e);
			
		} finally {
			if( null != fis ) {
				try {
					fis.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
		
		return sw.toString();
	}

	private void writeObject(JSONWriter builder, Object obj) throws Exception {
		if( obj instanceof JSONObject ) {
			JSONObject jsonObj = (JSONObject)obj;

			builder.object();
			
			List<String> keys = new Vector<String>();
			Iterator<?> it = jsonObj.keys();
			while( it.hasNext() ) {
				Object keyObject = it.next();
				if( keyObject instanceof String ) {
					keys.add( (String)keyObject );
				}
			}
			Collections.sort(keys);
			
			for(String key : keys) {
				builder.key(key);
				Object value = jsonObj.get(key);
				writeObject(builder, value);
			}
			
			builder.endObject();
			
		} else if( obj instanceof JSONArray ) {
			JSONArray jsonArr = (JSONArray)obj;
			
			builder.array();
			
			for(int i=0,e=jsonArr.length(); i<e; ++i) {
				Object value = jsonArr.get(i);
				writeObject(builder, value);
			}
			
			builder.endArray();
			
		} else {
			builder.value(obj);
		}
	}

	private Object fileToJSON(File file) throws Exception {
		
		Object result = null;
		
		StringWriter sw = new StringWriter();
		FileInputStream fis = null;
		char[] buffer = new char[100];
		try {
			fis = new FileInputStream(file);
			InputStreamReader isr = new InputStreamReader(fis, "UTF-8");
			
			int size = isr.read(buffer);
			while( size >= 0 ) {
				sw.write(buffer, 0, size);
				size = isr.read(buffer);
			}
			
			sw.flush();
			
			JSONTokener tokener = new JSONTokener(sw.toString());
			result = tokener.nextValue();
			
		} catch (Exception e) {
			throw new Exception("Error while reading file: "+file.getAbsolutePath(), e);
			
		} finally {
			if( null != fis ) {
				try {
					fis.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
		
		return result;
	}
}
