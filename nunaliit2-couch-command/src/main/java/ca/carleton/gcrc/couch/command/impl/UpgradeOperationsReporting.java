package ca.carleton.gcrc.couch.command.impl;

import java.io.File;
import java.io.PrintStream;

public class UpgradeOperationsReporting implements UpgradeOperations {

//	private File atlasDir;
	private File upgradeDir;
	private UpgradeOperations wrapped = null;
	private PrintStream outStream = null;
	private boolean reportCollisions = true;
	private boolean reportOperations = false; 
	
	public UpgradeOperationsReporting(
			File atlasDir
			,File upgradeDir
			,UpgradeOperations wrapped
			,PrintStream outStream
			){
//		this.atlasDir = atlasDir;
		this.upgradeDir = upgradeDir;
		this.wrapped = wrapped;
		this.outStream = outStream;
	}
	
	public boolean isReportCollisions() {
		return reportCollisions;
	}

	public void setReportCollisions(boolean reportCollisions) {
		this.reportCollisions = reportCollisions;
	}

	public boolean isReportOperations() {
		return reportOperations;
	}

	public void setReportOperations(boolean reportOperations) {
		this.reportOperations = reportOperations;
	}

	@Override
	public void saveInstalledManifest(FileSetManifest manifest) throws Exception {
		wrapped.saveInstalledManifest(manifest);
	}

	@Override
	public void deleteFile(String path) throws Exception {
		if( isReportOperations() ) {
			outStream.println("Delete file "+path);
		}
		wrapped.deleteFile(path);
	}

	@Override
	public void deleteDirectory(String path) throws Exception {
		if( isReportOperations() ) {
			outStream.println("Delete directory "+path);
		}
		wrapped.deleteDirectory(path);
	}

	@Override
	public void addDirectory(String path) throws Exception {
		if( isReportOperations() ) {
			outStream.println("Create directory "+path);
		}
		wrapped.addDirectory(path);
	}

	@Override
	public void copyFile(String path) throws Exception {
		if( isReportOperations() ) {
			outStream.println("Copy file "+path);
		}
		wrapped.copyFile(path);
	}

	@Override
	public void handleCollision(UpgradeCollision collision) throws Exception {
		if( isReportOperations() || isReportCollisions() ) {
			outStream.println("Collision "+collision.getPath());
		}
		
		wrapped.handleCollision(collision);
		
		if( isReportCollisions() ){
			if( collision.getType() == UpgradeCollision.Type.MODIFIED ){
				outStream.println("The file previously installed was modified.");
				
			} else if( collision.getType() == UpgradeCollision.Type.DELETED ){
				outStream.println("The file previously installed was deleted.");
				
			} else if( collision.getType() == UpgradeCollision.Type.BLOCKED ){
				outStream.println("The file can not be installed since an element of the same name exists.");
			}
			
			File element = new File(upgradeDir, collision.getPath());
			outStream.println("The element which would have been installed can be found here:");
			outStream.println(" "+element);
			outStream.println();
		}
	}

}
