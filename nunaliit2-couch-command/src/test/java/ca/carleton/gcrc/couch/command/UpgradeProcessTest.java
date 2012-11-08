package ca.carleton.gcrc.couch.command;

import java.io.File;

import junit.framework.TestCase;
import ca.carleton.gcrc.couch.command.impl.FileSetManifest;
import ca.carleton.gcrc.couch.command.impl.UpgradeProcess;
import ca.carleton.gcrc.couch.command.impl.UpgradeReport;

public class UpgradeProcessTest extends TestCase {

	public void testIdentity() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File upgradeProcessTestDir = new File(testDir, "upgradeProcess");
		File v2Dir = new File(upgradeProcessTestDir, "v2");
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade(
			v2Dir
			,v2Dir
			,new FileSetManifest()
			);
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		upgradeProcess.performUpgrade(upgradeReport, operations);
		
		// Verify that nothing was done
		if( operations.getAddedDirectories().size() > 0 ) {
			fail("Should not add any directory");
		}
		if( operations.getDeletedDirectories().size() > 0 ) {
			fail("Should not delete any directory");
		}
		if( operations.getDeletedFiles().size() > 0 ) {
			fail("Should not delete any file");
		}
		if( operations.getCopiedFiles().size() > 0 ) {
			fail("Should not copy any file");
		}
	}

	public void testAdded() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File upgradeProcessTestDir = new File(testDir, "upgradeProcess");
		File v2Dir = new File(upgradeProcessTestDir, "v2");
		File v1Dir = new File(upgradeProcessTestDir, "v1");
		
		FileSetManifest installedManifest = FileSetManifest.fromDirectory(v1Dir);
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade(
			v2Dir
			,v1Dir
			,installedManifest
			);
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		upgradeProcess.performUpgrade(upgradeReport, operations);
		
		// Verify that nothing was done
		if( operations.getAddedDirectories().size() != 1
		 || false == operations.getAddedDirectories().contains("sub") ) {
			fail("Should report adding directory 'sub'");
		}
		if( operations.getDeletedDirectories().size() > 0 ) {
			fail("Should not delete any directory");
		}
		if( operations.getDeletedFiles().size() > 0 ) {
			fail("Should not delete any file");
		}
		if( operations.getCopiedFiles().size() != 1
		 || false == operations.getCopiedFiles().contains("sub/b.txt") ) {
			fail("Should report copying file: sub/b.txt");
		}
	}

	public void testRemoved() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File upgradeProcessTestDir = new File(testDir, "upgradeProcess");
		File v1Dir = new File(upgradeProcessTestDir, "v1");
		File v2Dir = new File(upgradeProcessTestDir, "v2");
		
		FileSetManifest installedManifest = FileSetManifest.fromDirectory(v2Dir);
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade(
			v1Dir
			,v2Dir
			,installedManifest
			);
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		upgradeProcess.performUpgrade(upgradeReport, operations);
		
		// Verify that nothing was done
		if( operations.getAddedDirectories().size() > 0 ) {
			fail("Should report no added directory");
		}
		if( operations.getDeletedDirectories().size() != 1
		 || false == operations.getDeletedDirectories().contains("sub") ) {
			fail("Should report deleted directory: sub");
		}
		if( operations.getCopiedFiles().size() > 0 ) {
			fail("Should not copy any file");
		}
		if( operations.getDeletedFiles().size() != 1
		 || false == operations.getDeletedFiles().contains("sub/b.txt") ) {
			fail("Should report deleting file: sub/b.txt");
		}
	}
}
