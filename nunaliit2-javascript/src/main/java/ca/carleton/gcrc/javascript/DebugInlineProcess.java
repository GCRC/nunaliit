package ca.carleton.gcrc.javascript;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.Writer;

/**
 * This class is used to create a debug version of a library, where all
 * input Javascript files are concatenated to one another to generate
 * one large one.
 *
 */
public class DebugInlineProcess {
	public void generate(LibraryConfiguration config, File outputFile) throws Exception {
		FileOutputStream fos = null;
		OutputStreamWriter osw = null;
		try {
			fos = new FileOutputStream(outputFile);
			osw = new OutputStreamWriter(fos, "UTF-8");
			
			generate(config, outputFile.getName(), osw);
			
			osw.flush();
			
		} catch(Exception e) {
			throw new Exception("Error while generating debug inline Javacript library: "+outputFile,e);
			
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

	public void generate(LibraryConfiguration config, String outputName, Writer writer) throws Exception {
		try {
			PrintWriter pw = new PrintWriter(writer);
			
			// Insert license file
			File licenseFile = config.getLicenseFile();
			if( null != licenseFile ) {
				FileInputStream fis = null;
				InputStreamReader isr = null;
				try {
					fis = new FileInputStream(licenseFile);
					isr = new InputStreamReader(fis, "UTF-8");
					
					int c = isr.read();
					while( c >= 0 ){
						writer.write(c);
						c = isr.read();
					}
					
				} catch(Exception e) {
					throw new Exception("Error while exporting license file",e);
				} finally {
					if( null != isr ) {
						try{
							isr.close();
						} catch(Exception e) {
							// Ignore
						}
					}
					if( null != fis ) {
						try{
							fis.close();
						} catch(Exception e) {
							// Ignore
						}
					}
				}
			}

			pw.println("\"use strict\";");
			pw.println();

			// Adjust name of coreScriptName
			pw.println("var nunaliit2;");
			pw.println("(function(){");
			pw.println("// Define here instead of n2.core.js");
			pw.println("if( typeof nunaliit2 !== 'function' ){");
			pw.println("\tnunaliit2 = function(){};");
			pw.println("\tif( typeof window !== 'undefined' ){");
			pw.println("\t\twindow.nunaliit2 = nunaliit2;");
			pw.println("\t};");
			pw.println("};");
			pw.println("if( typeof nunaliit2.coreScriptName === 'undefined' ){");
			pw.println("\tnunaliit2.coreScriptName = '"+outputName+"';");
			pw.println("};");
			pw.println("})();");
			pw.println();
			
			// Loop over each file, copying each to the inline debug file
			for(File fileName : config.getInputFiles()) {
				copyFile(pw, fileName);
			}

			pw.flush();
			
		} catch(Exception e) {
			throw new Exception("Error while concatenating all files", e);
		}
	}

	private void copyFile(PrintWriter pw, File fileName) throws Exception {
		FileInputStream fis = null;
		InputStreamReader isr = null;
		try {
			fis = new FileInputStream(fileName);
			isr = new InputStreamReader(fis,"UTF-8");
			
			// Write header
			pw.println("// *** File: "+fileName);
			pw.println();
			
			// Content of file
			char buffer[] = new char[2048];
			int size = isr.read(buffer);
			while( size >= 0 ) {
				pw.write(buffer, 0, size);
				size = isr.read(buffer);
			}

			pw.println();
			
			isr.close();
			isr = null;
			fis.close();
			fis = null;
			
		} catch(Exception e) {
			throw new Exception("Error while processing file: "+fileName);
		} finally {
			if( null != isr ) {
				try {
					isr.close();
				} catch (Exception e) {
					// Ignore;
				}
			}
			if( null != fis ) {
				try {
					fis.close();
				} catch (Exception e) {
					// Ignore;
				}
			}
		}
	}
}
