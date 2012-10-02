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
				
			} else if( "--output-debug".equals(optionName) ){
				argumentStack.pop();
				
				if( argumentStack.empty() ){
					throw new Exception("File expected for option '--output-debug'");
				}
				String outputFileName = argumentStack.pop();
				outputDebugFile = new File(outputFileName);
				System.out.println("--ouput-debug "+outputDebugFile.getAbsolutePath());
					
			} else {
				System.err.println("Unknown option: "+optionName);
				argumentStack.pop();
			}
		}
		
		// Output release version
		if( null != outputFile ) {
			System.out.println("Generating release version");
			CompressProcess process = new CompressProcess();
			process.generate(config, outputFile);
		}
		
		// Output debug version
		if( null != outputDebugFile ) {
			System.out.println("Generating debug version");
			DebugProcess process = new DebugProcess();
			process.generate(config, outputDebugFile);
		}
	}
}
