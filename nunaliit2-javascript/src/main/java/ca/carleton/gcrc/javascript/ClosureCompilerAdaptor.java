package ca.carleton.gcrc.javascript;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStreamReader;
import java.io.OutputStreamWriter;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;
import java.util.Vector;

import com.google.javascript.jscomp.CompilationLevel;
import com.google.javascript.jscomp.Compiler;
import com.google.javascript.jscomp.CompilerOptions;
import com.google.javascript.jscomp.CompilerOptions.LanguageMode;
import com.google.javascript.jscomp.JSError;
import com.google.javascript.jscomp.Result;
import com.google.javascript.jscomp.SourceFile;

public class ClosureCompilerAdaptor {

	@SuppressWarnings("unused")
	public void verifyFiles(LibraryConfiguration config) throws Exception {
		CompilerOptions compilerOptions = new CompilerOptions();
		compilerOptions.setLanguage(LanguageMode.ECMASCRIPT5_STRICT);
		
		if( false ){
			compilerOptions.setChecksOnly(true);
			
			// Iterate over the input files
			for(File file : config.getInputFiles()){
				List<SourceFile> externs = Collections.emptyList();
			    List<SourceFile> inputs = Arrays.asList(SourceFile.fromFile(file));
			    
			    Compiler compiler = new Compiler();
				Result result = compiler.compile(externs, inputs, compilerOptions);
				
				if( null != result.errors && result.errors.length > 0 ){
					for(JSError error : result.errors){
						System.err.println(error.toString());
					}
					throw new Exception("Verification error");
				}
				if( null != result.warnings && result.warnings.length > 0 ){
					for(JSError warning : result.warnings){
						System.err.println(warning.toString());
					}
				}
			}
		} else {
			List<SourceFile> externs = Collections.emptyList();
		    List<SourceFile> inputs = new Vector<SourceFile>();
			// Iterate over the input files
			for(File file : config.getInputFiles()){
			    inputs.add(SourceFile.fromFile(file));
			}

			Compiler compiler = new Compiler();
			Result result = compiler.compile(externs, inputs, compilerOptions);
			
			if( null != result.errors && result.errors.length > 0 ){
				for(JSError error : result.errors){
					System.err.println(error.toString());
				}
				throw new Exception("Verification error");
			}
			if( null != result.warnings && result.warnings.length > 0 ){
				for(JSError warning : result.warnings){
					System.err.println(warning.toString());
				}
			}
		}
	}

	public void compress(LibraryConfiguration config, File outputFile) throws Exception {
		CompilerOptions compilerOptions = new CompilerOptions();
		compilerOptions.setLanguage(LanguageMode.ECMASCRIPT5_STRICT);
		CompilationLevel.SIMPLE_OPTIMIZATIONS.setOptionsForCompilationLevel(compilerOptions);

		List<SourceFile> externs = Collections.emptyList();
	    List<SourceFile> inputs = new Vector<SourceFile>();
		// Iterate over the input files
		for(File file : config.getInputFiles()){
		    inputs.add(SourceFile.fromFile(file));
		}

		Compiler compiler = new Compiler();
		Result result = compiler.compile(externs, inputs, compilerOptions);

		// Report errors
		if( null != result.errors && result.errors.length > 0 ){
			for(JSError error : result.errors){
				System.err.println(error.toString());
			}
			throw new Exception("Compression error");
		}
		
		if( result.success ){
			String code = compiler.toSource();
			
			FileOutputStream fos = null;
			OutputStreamWriter osw = null;
			try {
				fos = new FileOutputStream(outputFile);
				osw = new OutputStreamWriter(fos, "UTF-8");

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
							osw.write(c);
							c = isr.read();
						}
						
						isr.close();
						isr = null;
						
						fis.close();
						fis = null;
						
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
				
				// Output code
				osw.write(code);
				
				osw.flush();
				osw.close();
				osw = null;
				
				fos.close();
				fos = null;
				
			} catch(Exception e) {
				throw new Exception("Error while writing out code",e);
				
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
	}
}
