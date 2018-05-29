package ca.carleton.gcrc.javascript;

import java.io.File;
import java.io.PrintStream;
import java.util.ArrayList;
import java.util.List;
import java.util.Stack;

public class JavascriptMain {

	static public void main(String[] args) {
		try {
			List<String> arguments = new ArrayList<String>(args.length);
			for(String arg : args){
				arguments.add(arg);
			}
			
			JavascriptMain app = new JavascriptMain();
			app.execute(arguments);
			System.exit(0);
			
		} catch(Exception e) {
			
			PrintStream err = System.err;
			e.printStackTrace(err);

			// Error
			System.exit(1);
		}
	}
	
	public void execute(List<String> args) throws Exception {
		
		LibraryConfiguration config = new LibraryConfiguration();
		File outputFile = null;
		File outputDebugFile = null;
		File outputDebugInlineFile = null;
		boolean performVerification = false;
		
		// Turn arguments into a stack
		Stack<String> argumentStack = new Stack<String>();
		for(int i=args.size()-1; i>=0; --i){
			argumentStack.push( args.get(i) );
		}

		// Pick up options
		while( false == argumentStack.empty() ){
			String optionName = argumentStack.peek();
			if( "--config-file".equals(optionName) ){
				argumentStack.pop();
				
				if( argumentStack.empty() ){
					throw new Exception("File expected for option '--config-file'");
				}
				String configFileName = argumentStack.pop();
				File configFile = new File(configFileName);
				System.out.println("--config-file "+configFile.getAbsolutePath());
				config.parseConfiguration(configFile);
				
			} else if( "--source-dir".equals(optionName) ){
				argumentStack.pop();
				
				if( argumentStack.empty() ){
					throw new Exception("Directory expected for option '--source-dir'");
				}
				String sourceDirName = argumentStack.pop();
				File sourceDir = new File(sourceDirName);
				System.out.println("--source-dir "+sourceDir.getAbsolutePath());
				config.setSourceDirectory(sourceDir);
				
			} else if( "--license-file".equals(optionName) ){
				argumentStack.pop();
				
				if( argumentStack.empty() ){
					throw new Exception("File expected for option '--license-file'");
				}
				String licenseFileName = argumentStack.pop();
				File licenseFile = new File(licenseFileName);
				System.out.println("--license-file "+licenseFile.getAbsolutePath());
				config.setLicenseFile(licenseFile);
					
			} else if( "--output".equals(optionName) ){
				argumentStack.pop();
				
				if( argumentStack.empty() ){
					throw new Exception("File expected for option '--output'");
				}
				String outputFileName = argumentStack.pop();
				outputFile = new File(outputFileName);
				System.out.println("--ouput "+outputFile.getAbsolutePath());

			} else if( "--compile-level".equals(optionName) ){
				argumentStack.pop();
				
				if( argumentStack.empty() ){
					throw new Exception("File expected for option '--compile-level'");
				}
				String compileLevelStr = argumentStack.pop();
				LibraryConfiguration.CompileLevel level = LibraryConfiguration.getCompilerLevelFromName(compileLevelStr);
				config.setCompileLevel(level);
				System.out.println("--compile-level "+level);
				
			} else if( "--output-debug".equals(optionName) ){
				argumentStack.pop();
				
				if( argumentStack.empty() ){
					throw new Exception("File expected for option '--output-debug'");
				}
				String outputFileName = argumentStack.pop();
				outputDebugFile = new File(outputFileName);
				System.out.println("--ouput-debug "+outputDebugFile.getAbsolutePath());
				
			} else if( "--output-debug-inline".equals(optionName) ){
				argumentStack.pop();
				
				if( argumentStack.empty() ){
					throw new Exception("File expected for option '--output-debug-inline'");
				}
				String outputFileName = argumentStack.pop();
				outputDebugInlineFile = new File(outputFileName);
				System.out.println("--ouput-debug-inline "+outputDebugInlineFile.getAbsolutePath());
					
			} else if( "--verify".equals(optionName) ){
				argumentStack.pop();
				
				performVerification = true;
				System.out.println("--verify");
					
			} else {
				System.err.println("Unknown option: "+optionName);
				argumentStack.pop();
			}
		}
		
		if( performVerification ){
			System.out.println("Verifying Code");
			ClosureCompilerAdaptor process = new ClosureCompilerAdaptor();
			process.verifyFiles(config);
		}
		
		// Output release version
		if( null != outputFile ) {
			System.out.println("Generating release version");
			LibraryConfiguration.CompileLevel level = config.getCompileLevel();
			if( LibraryConfiguration.CompileLevel.JSMIN == level ){
				CompressProcess process = new CompressProcess();
				process.generate(config, outputFile);

			} else if( LibraryConfiguration.CompileLevel.CLOSURE == level ){
				ClosureCompilerAdaptor process = new ClosureCompilerAdaptor();
				process.compress(config, outputFile);

			} else {
				throw new Exception("Unable to compress compile level: "+level);
			}
		}
		
		// Output debug version
		if( null != outputDebugFile ) {
			System.out.println("Generating debug version");
			DebugProcess process = new DebugProcess();
			process.generate(config, outputDebugFile);
		}
		
		// Output debug inline version
		if( null != outputDebugInlineFile ) {
			System.out.println("Generating debug inline version");
			DebugInlineProcess process = new DebugInlineProcess();
			process.generate(config, outputDebugInlineFile);
		}
	}
}
