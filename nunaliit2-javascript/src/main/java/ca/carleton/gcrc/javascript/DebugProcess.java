package ca.carleton.gcrc.javascript;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.io.PrintWriter;
import java.io.Writer;

/**
 * This class is used to create a debug version of a library, based on a number
 * of Javascript input files.
 *
 */
public class DebugProcess {

	public void generate(LibraryConfiguration config, File outputFile) throws Exception {
		FileOutputStream fos = null;
		OutputStreamWriter osw = null;
		try {
			fos = new FileOutputStream(outputFile);
			osw = new OutputStreamWriter(fos, "UTF-8");
			
			generate(config, outputFile.getName(), osw);
			
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
			pw.println("var nunaliit2;");
			pw.println("(function(){");
			pw.println("// Define here instead of n2.core.js");
			pw.println("if( typeof nunaliit2 !== 'function' ){");
			pw.println("\tnunaliit2 = function(){};");
			pw.println("\tif( typeof window !== 'undefined' ){");
			pw.println("\t\twindow.nunaliit2 = nunaliit2;");
			pw.println("\t};");
			pw.println("};");
			pw.println();
			pw.println("var scriptLocation = null;");
			pw.println("var pattern = new RegExp('(^|(.*?\\/))"+outputName+"$');");
 			pw.println("var scripts = document.getElementsByTagName('script');");
			pw.println("for( var loop=0; loop<scripts.length; ++loop ) {");
			pw.println("\tvar src = scripts[loop].getAttribute('src');");
			pw.println("\tif (src) {");
			pw.println("\t\tvar match = src.match(pattern);");
			pw.println("\t\tif( match ) {");
			pw.println("\t\t\tscriptLocation = match[1];");
			pw.println("\t\t\tbreak;");
			pw.println("\t\t}");
			pw.println("\t}");
			pw.println("};");
			pw.println("if( null === scriptLocation ) {");
			pw.println("\talert('Unable to find library tag ("+outputName+")');");
			pw.println("};");
			pw.println("if( typeof nunaliit2.coreScriptName === 'undefined' ){");
			pw.println("\tnunaliit2.coreScriptName = '"+outputName+"';");
			pw.println("};");
			pw.println("var jsfiles = [");
			
			boolean first = true;
			for(String path : config.getInputFilePaths()){
				if( first ) {
					first = false;
				} else {
					pw.print(",");
				}
				pw.println("'"+path+"'");
			}
			
			pw.println("];");
			pw.println("var allScriptTags = new Array();");
			pw.println("for( var i=0; i<jsfiles.length; ++i ) {");
			pw.println("\tallScriptTags.push('<script src=\"');");
			pw.println("\tallScriptTags.push(scriptLocation);");
			pw.println("\tallScriptTags.push(jsfiles[i]);");
			pw.println("\tallScriptTags.push('\"></script>');");
			pw.println("};");
			pw.println("document.write(allScriptTags.join(''));");
			pw.println("})();");

			pw.flush();
			
		} catch(Exception e) {
			throw new Exception("Error while creating debug version of javascript library",e);
		}
	}
}
