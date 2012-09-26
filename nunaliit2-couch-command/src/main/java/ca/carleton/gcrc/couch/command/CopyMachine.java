package ca.carleton.gcrc.couch.command;

import java.io.BufferedReader;
import java.io.File;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import ca.carleton.gcrc.couch.command.impl.FSEntryNameFilterTextFiles;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryNameFilter;

public class CopyMachine {

	static final private Pattern variablePattern = Pattern.compile("(@([^@]*)@)");
	
	private FSEntryNameFilter acceptFileFilter = FSEntryNameFilter.all;
	private FSEntryNameFilter textFileFilter = FSEntryNameFilterTextFiles.singleton;
	private Map<String,String> textConversionMap = new HashMap<String,String>();

	public FSEntryNameFilter getAcceptFileFilter() {
		return acceptFileFilter;
	}

	public void setAcceptFileFilter(FSEntryNameFilter acceptFileFilter) {
		this.acceptFileFilter = acceptFileFilter;
	}

	public FSEntryNameFilter getTextFileFilter() {
		return textFileFilter;
	}

	public void setTextFileFilter(FSEntryNameFilter textFileFilter) {
		this.textFileFilter = textFileFilter;
	}
	
	public Map<String, String> getTextConversionMap() {
		return textConversionMap;
	}
	
	public void addTextConversion(String fromName, String toName){
		textConversionMap.put(fromName, toName);
	}

	public void setTextConversionMap(Map<String, String> textConversion) {
		this.textConversionMap = textConversion;
	}

	public void copyDir(FSEntry sourceDir, File targetDir) throws Exception {
		if( false == targetDir.exists() ){
			throw new Exception("Directory does not exist: "+targetDir.getAbsolutePath());
		}
		if( false == targetDir.isDirectory() ){
			throw new Exception("Path is not a directory: "+targetDir.getAbsolutePath());
		}
		
		// Process each child
		List<FSEntry> children = null;
		if( null == acceptFileFilter ) {
			children = sourceDir.getChildren();
		} else {
			children = sourceDir.getChildren(acceptFileFilter);
		}
		for(FSEntry child : children){
			String childName = child.getName();
			if( child.isDirectory() ){
				// Create directory in target
				File childDir = new File(targetDir, childName);
				boolean created = childDir.mkdir();
				if( false == created ){
					throw new Exception("Unable to create directory: "+childDir.getAbsolutePath());
				}
				
				// Copy dir
				copyDir(child, childDir);
				
			} else {
				// Copy File
				File targetFile = new File(targetDir, childName);
				
				if( textFileFilter.accept(sourceDir, childName) ){
					copyTextFile(child, targetFile);
				} else {
					copyBinaryFile(child, targetFile);
				}
			}
		}
	}

	public void copyBinaryFile(FSEntry sourceFile, File targetFile) throws Exception {
		InputStream is = null;
		FileOutputStream fos = null;
		String fromPath = "<unknown>";
		String toPath = "<unknown>";
		try {
			fromPath = sourceFile.getName();
			toPath = targetFile.getAbsolutePath();

			is = sourceFile.getInputStream();
			fos = new FileOutputStream(targetFile);
			byte[] buffer = new byte[256];
			int size = is.read(buffer);
			while(size >= 0){
				fos.write(buffer,0,size);
				size = is.read(buffer);
			}
			fos.flush();
			
		} catch(Exception e) {
			throw new Exception("Unable to copy binary file: "+fromPath+" to "+toPath);
			
		} finally {
			if( null != is ) {
				try {
					is.close();
				} catch(Exception e) {
					// Ignore
				}
			}
			if( null != fos ) {
				try {
					fos.close();
				} catch(Exception e) {
					// Ignore
				}
			}
		}
		
		// Copy execute bit
		if( sourceFile.canExecute() ) {
			targetFile.setExecutable(true, false);
		}
	}

	public void copyTextFile(FSEntry sourceFile, File targetFile) throws Exception {
		InputStream is = null;
		FileOutputStream fos = null;
		String fromPath = "<unknown>";
		String toPath = "<unknown>";
		try {
			fromPath = sourceFile.getName();
			toPath = targetFile.getAbsolutePath();

			is = sourceFile.getInputStream();
			fos = new FileOutputStream(targetFile);
			
			InputStreamReader isr = new InputStreamReader(is,"UTF-8");
			BufferedReader reader = new BufferedReader(isr);
			OutputStreamWriter osw = new OutputStreamWriter(fos,"UTF-8");
			
			boolean first = true;
			String line = reader.readLine();
			while( null != line ){
				if( first ) {
					first = false;
				} else {
					osw.write("\n");
				}
				
				// Perform conversion on line
				Matcher variableMatcher = variablePattern.matcher(line);
				while( variableMatcher.find() ){
					String variableName = variableMatcher.group(2);
					if( textConversionMap.containsKey(variableName) ) {
						// Convert
						int start = variableMatcher.start(1);
						int end = variableMatcher.end(1);
						String preGroup = line.substring(0,start);
						String postGroup = line.substring(end);
						line = preGroup + textConversionMap.get(variableName) + postGroup;
						
						variableMatcher = variablePattern.matcher(line);
					}
				}
				
				osw.write(line);
				
				line = reader.readLine();
			}

			osw.flush();
			
		} catch(Exception e) {
			throw new Exception("Unable to copy text file: "+fromPath+" to "+toPath);
			
		} finally {
			if( null != is ) {
				try {
					is.close();
				} catch(Exception e) {
					// Ignore
				}
			}
			if( null != fos ) {
				try {
					fos.close();
				} catch(Exception e) {
					// Ignore
				}
			}
		}
		
		// Copy execute bit
		if( sourceFile.canExecute() ) {
			targetFile.setExecutable(true, false);
		}
	}
}
