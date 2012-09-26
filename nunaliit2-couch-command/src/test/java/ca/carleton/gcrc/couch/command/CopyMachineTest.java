package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.FileInputStream;
import java.util.Properties;

import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;

import junit.framework.TestCase;

public class CopyMachineTest extends TestCase {

	public void testTextConversion() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File inDir = new File(testDir, "copyMachine");
		
		File outDir = TestSupport.generateTestDirName();
		outDir.mkdir();
		
		CopyMachine copyMachine = new CopyMachine();
		copyMachine.addTextConversion("ONE", "1");
		
		FSEntry inEntry = new FSEntryFile(inDir);
		copyMachine.copyDir(inEntry, outDir);
		
		File propFile = new File(outDir,"textConversion.properties");
		Properties props = new Properties();
		props.load(new FileInputStream(propFile));
		
		if( false == "no conversion".equals(props.getProperty("none")) ){
			fail("Unexpected convsersion: none");
		}
		if( false == "1".equals(props.getProperty("one")) ){
			fail("Unexpected convsersion: one");
		}
		if( false == "1_1".equals(props.getProperty("two")) ){
			fail("Unexpected convsersion: two");
		}
		if( false == "@NOTFOUND@".equals(props.getProperty("notfound")) ){
			fail("Unexpected convsersion: notfound");
		}
	}
}
