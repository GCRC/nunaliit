package ca.carleton.gcrc.javascript;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.SequenceInputStream;
import java.io.Writer;
import java.util.Vector;

/**
 * This class is used to create a minimized version of a library, based on a number
 * of Javascript input files.
 *
 */
public class CompressProcess {

	public void generate(LibraryConfiguration config, File outputFile) throws Exception {
		FileOutputStream fos = null;
		OutputStreamWriter osw = null;
		try {
			fos = new FileOutputStream(outputFile);
			osw = new OutputStreamWriter(fos, "UTF-8");
			
			generate(config, osw);
			
			osw.flush();
			
		} catch(Exception e) {
			throw new Exception("Error while compressing javacript to file: "+outputFile,e);
			
		} finally {
			if( null != osw ){
				try {
					osw.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			if( null != fos ){
				try {
					fos.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
	}

	public void generate(LibraryConfiguration config, Writer writer) throws Exception {
		// Create input reader
		Reader reader = null;
		Vector<FileInputStream> streams = new Vector<FileInputStream>(); 
		SequenceInputStream sis = null;
		try {
			// Create sequence input stream from files in configuration
			for(File file : config.getInputFiles()){
				FileInputStream fis = new FileInputStream(file);
				streams.add(fis);
			}
			sis = new SequenceInputStream(streams.elements());
			reader = new InputStreamReader(sis, "UTF-8");
			
			JSMin jsMin = new JSMin(reader, writer);
			jsMin.jsmin();
			
		} catch(Exception e) {
			throw new Exception("Error while compressing javascript",e);
			
		} finally {
			if( null != reader ) {
				try {
					reader.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			for(FileInputStream fis : streams){
				try {
					fis.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			if( null != sis ) {
				try {
					sis.close();
				} catch (Exception e) {
					// Ignore
				}
			}
		}
	}
}
