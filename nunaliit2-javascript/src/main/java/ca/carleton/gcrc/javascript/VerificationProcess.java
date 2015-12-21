package ca.carleton.gcrc.javascript;

import java.io.File;
import java.util.Arrays;
import java.util.Collections;
import java.util.List;

import com.google.javascript.jscomp.Compiler;
import com.google.javascript.jscomp.CompilerOptions;
import com.google.javascript.jscomp.CompilerOptions.LanguageMode;
import com.google.javascript.jscomp.JSError;
import com.google.javascript.jscomp.Result;
import com.google.javascript.jscomp.SourceFile;

public class VerificationProcess {

	public void verify(LibraryConfiguration config) throws Exception {
		CompilerOptions compilerOptions = new CompilerOptions();
		compilerOptions.setLanguage(LanguageMode.ECMASCRIPT5_STRICT);
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
		}
	}
}
