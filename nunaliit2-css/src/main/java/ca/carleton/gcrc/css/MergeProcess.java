package ca.carleton.gcrc.css;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.Reader;
import java.io.SequenceInputStream;
import java.io.Writer;
import java.util.Vector;

public class MergeProcess {

	public void generate(LibraryConfiguration config, File outputFile) throws Exception {
		FileOutputStream fos = null;
		OutputStreamWriter osw = null;
		try {
			fos = new FileOutputStream(outputFile);
			osw = new OutputStreamWriter(fos, "UTF-8");
			
			generate(config, osw);
			
			osw.flush();
			
		} catch(Exception e) {
			throw new Exception("Error while merging CSS to file: "+outputFile,e);
			
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
		Vector<InputStream> streams = new Vector<InputStream>(); 
		SequenceInputStream sis = null;
		try {
			// Insert license file, if specified
			{
				File licenseFile = config.getLicenseFile();
				if( null != licenseFile ){
					FileInputStream fis = new FileInputStream(licenseFile);
					streams.add(fis);
				}
			}
			
			// Create sequence input stream from files in configuration
			for(File file : config.getInputFiles()){
				// Create header
				ByteArrayOutputStream baos = new ByteArrayOutputStream();
				OutputStreamWriter osw = new OutputStreamWriter(baos, "UTF-8");
				osw.write("\n\n/* --- ");
				osw.write(file.getPath());
				osw.write(" --- */\n");
				osw.flush();
				ByteArrayInputStream bais = new ByteArrayInputStream(baos.toByteArray());
				streams.add(bais);

				FileInputStream fis = new FileInputStream(file);
				streams.add(fis);
			}
			sis = new SequenceInputStream(streams.elements());
			reader = new InputStreamReader(sis, "UTF-8");
			
			int c = reader.read();
			while( c >= 0 ){
				writer.write(c);
				c = reader.read();
			}
			
		} catch(Exception e) {
			throw new Exception("Error while merging CSS",e);
			
		} finally {
			if( null != reader ) {
				try {
					reader.close();
				} catch (Exception e) {
					// Ignore
				}
			}
			for(InputStream fis : streams){
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
