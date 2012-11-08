package ca.carleton.gcrc.couch.command.impl;

import java.io.PrintStream;

public class UpgradeOperationsReporting implements UpgradeOperations {

	private UpgradeOperations wrapped = null;
	private PrintStream outStream = null;
	
	public UpgradeOperationsReporting(UpgradeOperations wrapped, PrintStream outStream){
		this.wrapped = wrapped;
		this.outStream = outStream;
	}
	
	@Override
	public void saveInstalledManifest(FileSetManifest manifest) throws Exception {
		wrapped.saveInstalledManifest(manifest);
	}

	@Override
	public void deleteFile(String path) throws Exception {
		outStream.println("Delete file "+path);
		wrapped.deleteFile(path);
	}

	@Override
	public void deleteDirectory(String path) throws Exception {
		outStream.println("Delete directory "+path);
		wrapped.deleteDirectory(path);
	}

	@Override
	public void addDirectory(String path) throws Exception {
		outStream.println("Create directory "+path);
		wrapped.addDirectory(path);
	}

	@Override
	public void copyFile(String path) throws Exception {
		outStream.println("Copy file "+path);
		wrapped.copyFile(path);
	}

	@Override
	public void handleCollision(UpgradeCollision collision) throws Exception {
		outStream.println("Collision "+collision.getPath());
		wrapped.handleCollision(collision);
	}

}
