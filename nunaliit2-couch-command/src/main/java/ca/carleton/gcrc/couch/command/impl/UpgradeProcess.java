package ca.carleton.gcrc.couch.command.impl;

import java.io.File;
import java.util.Collections;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Vector;

public class UpgradeProcess {

	public UpgradeReport computeUpgrade(File newFiles, File targetDir, FileSetManifest installedManifest) throws Exception {
		UpgradeReport report =  new UpgradeReport();
		report.setInstalledFileSetManifest(installedManifest);
		
		FileSetManifest upgradedManifest = FileSetManifest.fromDirectory(newFiles);
		report.setUpgradeFileSetManifest(upgradedManifest);

		DigestComputerSha1 digestComputer = new DigestComputerSha1();
		
		// Detect added and upgraded files
		Set<String> relevantPaths = new HashSet<String>();
		for(FileManifest upgraded : upgradedManifest.getAllFileManifest()){
			String path = upgraded.getRelativePath();
			relevantPaths.add(path);

			FileManifest installed = installedManifest.getFileManifest(path);
			if( null == installed ) {
				// New file
				report.addAddedPath(path);
			} else if( false == upgraded.equals(installed) ) {
				// Upgraded file
				report.addUpgradedPath(path);
			}
		}
		
		// Detect deleted files
		for(FileManifest installed : installedManifest.getAllFileManifest()){
			String path = installed.getRelativePath();

			FileManifest upgraded = upgradedManifest.getFileManifest(path);
			if( null == upgraded ) {
				// Deleted file
				relevantPaths.add(path);
				report.addDeletedPath(path);
			}
		}
		
		// Construct a relevant manifest of what is found on disk
		FileSetManifest diskManifest = new FileSetManifest();
		report.setDiskFileSetManifest(diskManifest);
		for(String path : relevantPaths){
			File targetFile = new File(targetDir,path);
			
			if( targetFile.exists() ) {
				FileManifest fileManifest = new FileManifest();
				fileManifest.setRelativePath(path);
				if( targetFile.isDirectory() ){
					fileManifest.setDirectory(true);
				} else {
					try {
						String digest = digestComputer.computeDocumentDigest(targetFile);
						fileManifest.setDigest(digest);
					} catch(Exception e) {
						throw new Exception("Error while computing digest on file: "+targetFile.getAbsolutePath(), e);
					}
				}
				
				diskManifest.addFileManifest(fileManifest);
			}
		}
		
		// Only files that were not changed can be deleted
		for(String path : report.getDeletedPaths()){
			FileManifest installed = installedManifest.getFileManifest(path);
			FileManifest disk = diskManifest.getFileManifest(path);
			
			// If file is already deleted, then its OK
			if( null == disk ) {
				// OK
				report.addPathToAssumeUpgraded(path);
				
			} else if( installed.equals(disk) ) {
				// This path can be deleted
				if( installed.isDirectory() ) {
					report.addDirectoryToBeDeleted(path);
				} else {
					report.addFileToBeDeleted(path);
				}
			} else {
				// At this point, the element on disk is different
				// then the element in the installed manifest
				UpgradeCollision collision = new UpgradeCollision(
						UpgradeCollision.Type.MODIFIED
						,path
						,null
						,installed
						,disk
					);
				report.addCollision(collision);
			}
		}
		
		// Only files that are not present can be added, unless they
		// are exactly the same
		for(String path : report.getAddedPaths()){
			FileManifest upgraded = upgradedManifest.getFileManifest(path);
			FileManifest disk = diskManifest.getFileManifest(path);
			
			// Check if it exists on disk
			if( null == disk ) {
				// Normal case: it is not located on disk
				// Add file or directory
				if( upgraded.isDirectory() ) {
					report.addDirectoryToBeAdded(path);
				} else {
					report.addFileToBeAdded(path);
				}
			
			} else if( upgraded.equals(disk) ) {
				// What is found on disk is exactly the same
				// as what the upgrade would do. Therefore, simply
				// assume that the file was installed without performing
				// any operations on the element
				report.addPathToAssumeUpgraded(path);
				
			} else {
				// Collision
				UpgradeCollision collision = new UpgradeCollision(
						UpgradeCollision.Type.BLOCKED
						,path
						,upgraded
						,null
						,disk
					);
				report.addCollision(collision);
			}
		}
		
		// Upgrade files that were not changed
		for(String path : report.getUpgradedPaths()){
			FileManifest installed = installedManifest.getFileManifest(path);
			FileManifest upgrade = upgradedManifest.getFileManifest(path);
			FileManifest disk = diskManifest.getFileManifest(path);
			
			// If file was deleted, then we do not need to upgrade
			// This is a special kind of collision since this is a file that was
			// deliberately removed from the atlas
			if( null == disk ) {
				UpgradeCollision collision = new UpgradeCollision(
						UpgradeCollision.Type.DELETED
						,path
						,upgrade
						,null
						,disk
					);
				report.addCollision(collision);
				
				// Assume the manifest of the upgrade for this file, because this is 
				// equivalent as if the user had installed the latest upgrade and then 
				// deleted the file
				report.addPathToAssumeUpgraded(path);
				
			} else if( installed.equals(disk) ) {
				// User has not changed what was installed
				// Check if type is changed during upgrade
				if( upgrade.isDirectory() != disk.isDirectory() ) {
					if( disk.isDirectory() ) {
						report.addDirectoryToBeDeleted(path);
						report.addFileToBeAdded(path);
					} else {
						// Disk is file, upgrade is directory
						report.addFileToBeDeleted(path);
						report.addDirectoryToBeAdded(path);
					}
				} else {
					// Type was not changed. Therefore, this is a file that
					// needs upgrading
					report.addFileToBeUpgraded(path);
				}
				
			} else if( upgrade.equals(disk) ) {
				// The user has modified the disk version, but it is the same as
				// what is found in the upgrade. Therefore, no changes to the element
				// is required. Just assume that the upgrade was installed.
				report.addPathToAssumeUpgraded(path);
				
			} else {
				// What is found on disk is not the same as what was found
				// in the install manifest. Furthermore, the upgrade is different
				// than what is found on disk. Therefore, this is a collision.
				UpgradeCollision collision = new UpgradeCollision(
						UpgradeCollision.Type.MODIFIED
						,path
						,upgrade
						,installed
						,disk
					);
				report.addCollision(collision);
			}
		}
		
		return report;
	}
	
	public void performUpgrade(
		UpgradeReport report
		,UpgradeOperations operations
		) throws Exception {
		
		try {
			FileSetManifest resultingInstalledManifest = 
					report.getInstalledFileSetManifest().clone();
			
			// Assumed upgrades
			{
				for(String path : report.getPathsToAssumeUpgraded()){
					FileManifest upgrade = report.getUpgradeFileSetManifest().getFileManifest(path);
					if( null == upgrade ) {
						resultingInstalledManifest.removeFileManifest(path);
					} else {
						resultingInstalledManifest.addFileManifest(upgrade);
					}
				}
				operations.saveInstalledManifest(resultingInstalledManifest);
			}
			
			// Delete files
			for(String path : report.getFilesToBeDeleted()){
				operations.deleteFile(path);
				
				// After each file removal, update installed manifest to reflect
				// current state in case process is aborted
				resultingInstalledManifest.removeFileManifest(path);
				operations.saveInstalledManifest(resultingInstalledManifest);
			}
			
			// Delete directories
			{
				// Delete longest paths first. This ensures that sub-dirs
				// are removed before a parent
				List<String> orderedPaths = new Vector<String>(report.getDirectoriesToBeDeleted());
				Collections.sort(orderedPaths, new Comparator<String>(){
					@Override
					public int compare(String s0, String s1) {
						return s1.length() - s0.length();
					}
				});

				for(String path : orderedPaths){
					operations.deleteDirectory(path);
					
					// After each directory removal, update installed manifest to reflect
					// current state in case process is aborted
					resultingInstalledManifest.removeFileManifest(path);
					operations.saveInstalledManifest(resultingInstalledManifest);
				}
			}
			
			// Add directories
			{
				// Add shortest paths first. This ensures that sub-dirs
				// are added after a parent
				List<String> orderedPaths = new Vector<String>(report.getDirectoriesToBeAdded());
				Collections.sort(orderedPaths, new Comparator<String>(){
					@Override
					public int compare(String s0, String s1) {
						return s0.length() - s1.length();
					}
				});
				for(String path : orderedPaths){
					operations.addDirectory(path);
					
					// After each directory creation, update installed manifest to reflect
					// current state in case process is aborted
					FileManifest upgrade = report.getUpgradeFileSetManifest().getFileManifest(path);
					resultingInstalledManifest.addFileManifest(upgrade);
					operations.saveInstalledManifest(resultingInstalledManifest);
				}
			}

			// Add files
			for(String path : report.getFilesToBeAdded()){
				operations.copyFile(path);
				
				// After each file copy, update installed manifest to reflect
				// current state in case process is aborted
				FileManifest upgrade = report.getUpgradeFileSetManifest().getFileManifest(path);
				resultingInstalledManifest.addFileManifest(upgrade);
				operations.saveInstalledManifest(resultingInstalledManifest);
			}
			
			// Upgrade files
			for(String path : report.getFilesToBeUpgraded()){
				operations.copyFile(path);
				
				// After each file copy, update installed manifest to reflect
				// current state in case process is aborted
				FileManifest upgrade = report.getUpgradeFileSetManifest().getFileManifest(path);
				resultingInstalledManifest.addFileManifest(upgrade);
				operations.saveInstalledManifest(resultingInstalledManifest);
			}
			
			// Save collisions
			for(UpgradeCollision collision : report.getCollisions()){
				operations.handleCollision(collision);
			}
			
		} catch(Exception e) {
			throw new Exception("Error while performing upgrade",e);
		}
	}
}
