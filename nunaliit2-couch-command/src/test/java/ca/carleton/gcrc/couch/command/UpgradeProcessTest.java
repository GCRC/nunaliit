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
		
		FileSetManifest expectedManifest = FileSetManifest.fromDirectory(v2Dir);
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		upgradeProcess.setUpgradedFilesDir(v2Dir);
		upgradeProcess.setTargetDir(v2Dir);
		upgradeProcess.setInstalledManifest( FileSetManifest.fromDirectory(v2Dir) );
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade();
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		UpgradeProcess.performUpgrade(upgradeReport, operations);
		
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
		
		FileSetManifest finalManifest = operations.getSavedManifest();
		if( false == finalManifest.equals(expectedManifest) ){
			fail("Final file set manifest is not as expected");
		}
	}

	public void testAdded() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File upgradeProcessTestDir = new File(testDir, "upgradeProcess");
		File v2Dir = new File(upgradeProcessTestDir, "v2");
		File v1Dir = new File(upgradeProcessTestDir, "v1");
		
		FileSetManifest expectedManifest = FileSetManifest.fromDirectory(v2Dir);
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		upgradeProcess.setUpgradedFilesDir(v2Dir);
		upgradeProcess.setTargetDir(v1Dir);
		upgradeProcess.setInstalledManifest( FileSetManifest.fromDirectory(v1Dir) );
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade();
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		UpgradeProcess.performUpgrade(upgradeReport, operations);
		
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
		
		FileSetManifest finalManifest = operations.getSavedManifest();
		if( false == finalManifest.equals(expectedManifest) ){
			fail("Final file set manifest is not as expected");
		}
	}

	public void testRemoved() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File upgradeProcessTestDir = new File(testDir, "upgradeProcess");
		File v1Dir = new File(upgradeProcessTestDir, "v1");
		File v2Dir = new File(upgradeProcessTestDir, "v2");
		
		FileSetManifest expectedManifest = FileSetManifest.fromDirectory(v1Dir);
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		upgradeProcess.setUpgradedFilesDir(v1Dir);
		upgradeProcess.setTargetDir(v2Dir);
		upgradeProcess.setInstalledManifest( FileSetManifest.fromDirectory(v2Dir) );
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade();
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		UpgradeProcess.performUpgrade(upgradeReport, operations);
		
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
		
		FileSetManifest finalManifest = operations.getSavedManifest();
		if( false == finalManifest.equals(expectedManifest) ){
			fail("Final file set manifest is not as expected");
		}
	}

	public void testModified() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File upgradeProcessTestDir = new File(testDir, "upgradeProcess");
		File v1Dir = new File(upgradeProcessTestDir, "v1");
		File v3Dir = new File(upgradeProcessTestDir, "v3");
		File v4Dir = new File(upgradeProcessTestDir, "v4");
		
		FileSetManifest copyManifest = FileSetManifest.fromDirectory(v4Dir);
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		upgradeProcess.setUpgradedFilesDir(v1Dir);
		upgradeProcess.setTargetDir(v3Dir);
		upgradeProcess.setInstalledManifest( FileSetManifest.fromDirectory(v4Dir) );
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade();
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		UpgradeProcess.performUpgrade(upgradeReport, operations);
		
		// Verify that nothing was done
		if( operations.getAddedDirectories().size() > 0 ) {
			fail("Should report no added directory");
		}
		if( operations.getDeletedDirectories().size() > 0 ) {
			fail("Should report no deleted directory");
		}
		if( operations.getCopiedFiles().size() > 0 ) {
			fail("Should not copy any file");
		}
		if( operations.getDeletedFiles().size() > 0 ) {
			fail("Should report no deleted file");
		}
		
		FileSetManifest finalManifest = operations.getSavedManifest();
		if( false == finalManifest.equals(copyManifest) ){
			fail("Final file set manifest is not as expected");
		}
	}

	public void testUpgrade() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File upgradeProcessTestDir = new File(testDir, "upgradeProcess");
		File v1Dir = new File(upgradeProcessTestDir, "v1");
		File v3Dir = new File(upgradeProcessTestDir, "v3");
		
		FileSetManifest expectedManifest = FileSetManifest.fromDirectory(v3Dir);
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		upgradeProcess.setUpgradedFilesDir(v3Dir);
		upgradeProcess.setTargetDir(v1Dir);
		upgradeProcess.setInstalledManifest( FileSetManifest.fromDirectory(v1Dir) );
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade();
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		UpgradeProcess.performUpgrade(upgradeReport, operations);
		
		// Verify that nothing was done
		if( operations.getAddedDirectories().size() > 0 ) {
			fail("Should report no added directory");
		}
		if( operations.getDeletedDirectories().size() > 0 ) {
			fail("Should report no deleted directory");
		}
		if( operations.getCopiedFiles().size() != 1 ) {
			fail("Should have copied one file");
		}
		if( operations.getDeletedFiles().size() > 0 ) {
			fail("Should report no deleted file");
		}
		
		FileSetManifest finalManifest = operations.getSavedManifest();
		if( false == finalManifest.equals(expectedManifest) ){
			fail("Final file set manifest is not as expected");
		}
	}

	public void testSupressedCollision() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File upgradeProcessTestDir = new File(testDir, "upgradeProcess");
		File v1Dir = new File(upgradeProcessTestDir, "v1");
		File v3Dir = new File(upgradeProcessTestDir, "v3");
		
		FileSetManifest expectedManifest = FileSetManifest.fromDirectory(v3Dir);
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		upgradeProcess.setUpgradedFilesDir(v3Dir);
		upgradeProcess.setTargetDir(v3Dir);
		upgradeProcess.setInstalledManifest( FileSetManifest.fromDirectory(v1Dir) );
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade();
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		UpgradeProcess.performUpgrade(upgradeReport, operations);
		
		// Verify that nothing was done
		if( operations.getAddedDirectories().size() > 0 ) {
			fail("Should report no added directory");
		}
		if( operations.getDeletedDirectories().size() > 0 ) {
			fail("Should report no deleted directory");
		}
		if( operations.getCopiedFiles().size() > 0 ) {
			fail("Should report no copied file");
		}
		if( operations.getDeletedFiles().size() > 0 ) {
			fail("Should report no deleted file");
		}
		
		FileSetManifest finalManifest = operations.getSavedManifest();
		if( false == finalManifest.equals(expectedManifest) ){
			fail("Final file set manifest is not as expected");
		}
	}

	public void testRetainInstallationFile() throws Exception {
		File testDir = TestSupport.findTopTestingDir();
		File upgradeProcessTestDir = new File(testDir, "upgradeProcess");
		File v1Dir = new File(upgradeProcessTestDir, "v1");
		File v3Dir = new File(upgradeProcessTestDir, "v3");
		File v5Dir = new File(upgradeProcessTestDir, "v5");
		
		FileSetManifest expectedManifest = FileSetManifest.fromDirectory(v5Dir);
		
		UpgradeProcess upgradeProcess = new UpgradeProcess();
		upgradeProcess.setUpgradedFilesDir(v5Dir);
		upgradeProcess.setTargetDir(v3Dir);
		upgradeProcess.setInstalledManifest( FileSetManifest.fromDirectory(v3Dir) );
		upgradeProcess.setInstallationFilesDir(v1Dir);
		UpgradeReport upgradeReport = upgradeProcess.computeUpgrade();
		
		MockUpgradeOperations operations = new MockUpgradeOperations();
		UpgradeProcess.performUpgrade(upgradeReport, operations);
		
		// Verify that nothing was done
		if( operations.getAddedDirectories().size() > 0 ) {
			fail("Should report no added directory");
		}
		if( operations.getDeletedDirectories().size() > 0 ) {
			fail("Should report no deleted directory");
		}
		if( operations.getCopiedFiles().size() != 1 ) {
			fail("Should report exactly one file copied");
		}
		if( operations.getDeletedFiles().size() > 0 ) {
			fail("Should report no deleted file");
		}
		
		FileSetManifest finalManifest = operations.getSavedManifest();
		if( false == finalManifest.equals(expectedManifest) ){
			fail("Final file set manifest is not as expected");
		}
	}
}
