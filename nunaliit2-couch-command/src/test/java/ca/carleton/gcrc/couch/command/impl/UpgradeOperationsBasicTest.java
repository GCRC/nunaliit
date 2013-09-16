package ca.carleton.gcrc.couch.command.impl;

import java.io.File;

import junit.framework.TestCase;
import ca.carleton.gcrc.couch.command.TestSupport;

public class UpgradeOperationsBasicTest extends TestCase {
	
	static public File getTestDir(String name) throws Exception {
		return TestSupport.getTestDir("UpgradeOperationsBasic" + name);
	}

	public void testDeleteDirectory() throws Exception{
		File testDir = getTestDir("deleteDirectory");
		if( null != testDir ){
			File dir = new File(testDir, "test");
			dir.mkdir();
			File subDir = new File(dir,"sub");
			subDir.mkdir();

			if( false == dir.exists() ){
				fail("Test broken: can not create directory");
			}
			if( false == subDir.exists() ){
				fail("Test broken: can not create sub-directory");
			}
			
			UpgradeOperationsBasic op = new UpgradeOperationsBasic(testDir, null, null);
			
			op.deleteDirectory("test/sub");
			op.deleteDirectory("test");
			
			if( subDir.exists() ){
				fail("Sub-directory was not deleted");
			}
			if( dir.exists() ){
				fail("Directory was not deleted");
			}
		}
	}

	public void testDeleteDottedDirectory() throws Exception{
		File testDir = getTestDir("deleteDottedDirectory");
		if( null != testDir ){
			File dir = new File(testDir, "test");
			dir.mkdir();

			if( false == dir.exists() ){
				fail("Test broken: can not create directory");
			}
			
			UpgradeOperationsBasic op = new UpgradeOperationsBasic(testDir, null, null);
			
			op.deleteDirectory("./test");
			
			if( dir.exists() ){
				fail("Directory was not deleted");
			}
		}
	}
}
