package ca.carleton.gcrc.javascript;

import java.io.File;
import java.io.PrintWriter;
import java.io.StringReader;
import java.io.StringWriter;
import java.util.List;
import java.util.Vector;

import junit.framework.TestCase;

public class LibraryConfigurationTest extends TestCase {

	public void testInputFiles() throws Exception {
		// Create input stream
		StringReader sr = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println("# A line with a comment  ");
			pw.println("   # Another line with a comment  ");
			pw.println("");
			pw.println("  [input]  # start of input section");
			pw.println(" ");
			pw.println("abc.js");
			pw.println("def.js # with a comment");
			pw.println("[unknown section]");
			pw.println("ghi.js");
			pw.println("# That's it");
			
			sr = new StringReader(sw.toString());
		}
		
		// Create verification list
		List<File> check = new Vector<File>();
		check.add( new File("abc.js") );
		check.add( new File("def.js") );
		
		// Build compress config from input stream
		LibraryConfiguration config = new LibraryConfiguration();
		config.parseConfiguration(sr);
		
		// Verify input files
		{
			List<File> inputFiles = config.getInputFiles();
			if( inputFiles.size() != check.size() ) {
				fail("Invalid input file list size: "+inputFiles.size());
			} else {
				for(int loop=0,end=inputFiles.size(); loop<end; ++loop){
					File inputFile = inputFiles.get(loop);
					File checkFile = check.get(loop);
					if( false == inputFile.equals(checkFile) ){
						fail("Unexpected file at index "+loop+": "+checkFile.getPath());
					}
				}
			}
		}
	}

	public void testInputFilesWithSourceDirectory() throws Exception {
		// Create input stream
		StringReader sr = null;
		{
			StringWriter sw = new StringWriter();
			PrintWriter pw = new PrintWriter(sw);
			pw.println("# A line with a comment  ");
			pw.println("   # Another line with a comment  ");
			pw.println("");
			pw.println("  [input]  # start of input section");
			pw.println(" ");
			pw.println("abc.js");
			pw.println("def.js # with a comment");
			pw.println("[unknown section]");
			pw.println("ghi.js");
			pw.println("# That's it");
			
			sr = new StringReader(sw.toString());
		}
		
		// Create verification list
		List<File> check = new Vector<File>();
		check.add( new File("test/abc.js") );
		check.add( new File("test/def.js") );
		
		// Build compress config from input stream
		LibraryConfiguration config = new LibraryConfiguration();
		config.setSourceDirectory( new File("test") );
		config.parseConfiguration(sr);
		
		// Verify input files
		{
			List<File> inputFiles = config.getInputFiles();
			if( inputFiles.size() != check.size() ) {
				fail("Invalid input file list size: "+inputFiles.size());
			} else {
				for(int loop=0,end=inputFiles.size(); loop<end; ++loop){
					File inputFile = inputFiles.get(loop);
					File checkFile = check.get(loop);
					if( false == inputFile.equals(checkFile) ){
						fail("Unexpected file at index "+loop+": "+checkFile.getPath());
					}
				}
			}
		}
	}
}
