package ca.carleton.gcrc.javascript;

import java.io.BufferedReader;
import java.io.File;
import java.io.Reader;
import java.util.ArrayList;
import java.util.List;
import java.util.Vector;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

/**
 * Instances of this class are used to read configuration files
 * that specify which javascript files are used to generate a library.
 *
 */
public class LibraryConfiguration {

	static private Pattern patternComment = Pattern.compile("#.*?");
	static private Pattern patternSection = Pattern.compile("\\[(.*)\\]");
	
	private File sourceDirectory = null;
	private List<String> inputFilePaths = null;
	
	public LibraryConfiguration(){
		inputFilePaths = new Vector<String>();
	}

	public File getSourceDirectory() {
		return sourceDirectory;
	}

	public void setSourceDirectory(File sourceDirectory) {
		this.sourceDirectory = sourceDirectory;
	}

	public List<File> getInputFiles() {
		List<File> files = new ArrayList<File>(inputFilePaths.size());
		for(String filePath : inputFilePaths){
			if( null != sourceDirectory ) {
				files.add( new File(sourceDirectory, filePath) );
			} else {
				files.add( new File(filePath) );
			}
		}
		return files;
	}

	public List<String> getInputFilePaths() {
		return inputFilePaths;
	}
	
	public void addInputFilePath(String path){
		inputFilePaths.add( path );
	}

	public void parseConfiguration(Reader reader) throws Exception {
		BufferedReader bufReader = new BufferedReader(reader);
		
		try {
			boolean isInsideInputSection = false;
			
			String line = bufReader.readLine();
			while(line != null){
				
				// Strip comments
				Matcher matcherComment = patternComment.matcher(line);
				if( matcherComment.find() ) {
					int index = matcherComment.start();
					line = line.substring(0,index);
				}
				
				// Strip eol and surrounding spaces
				line = line.trim();
				
				// Detect sections
				boolean isSectionLine = false;
				String sectionName = null;
				{
					Matcher matcherSection = patternSection.matcher(line);
					if( matcherSection.matches() ){
						isSectionLine = true;
						sectionName = matcherSection.group(1).trim();
					}
				}
				
				if( "".equals(line) ) {
					// Skip
					
				} else if( isSectionLine ) {
					isInsideInputSection = false;
					
					if( "input".equals(sectionName) ){
						isInsideInputSection = true;
					}
					
				} else if( isInsideInputSection ) {
					addInputFilePath( line );
				}
				
				line = bufReader.readLine();
			}
			
		} catch(Exception e) {
			throw new Exception("Error while reading compress configuration",e);
		}
	}
}
