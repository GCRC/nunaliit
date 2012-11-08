package ca.carleton.gcrc.couch.command.impl;

public interface UpgradeOperations {

	void saveInstalledManifest(FileSetManifest manifest) throws Exception;
	
	void deleteFile(String path) throws Exception;
	
	void deleteDirectory(String path) throws Exception;

	void addDirectory(String path) throws Exception;

	void copyFile(String path) throws Exception;

	void handleCollision(UpgradeCollision collision) throws Exception;
}
