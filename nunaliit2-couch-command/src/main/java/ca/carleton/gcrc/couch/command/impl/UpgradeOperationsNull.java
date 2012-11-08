package ca.carleton.gcrc.couch.command.impl;


public class UpgradeOperationsNull implements UpgradeOperations {

	public UpgradeOperationsNull(){
	}
	
	@Override
	public void saveInstalledManifest(FileSetManifest manifest) throws Exception {
	}

	@Override
	public void deleteFile(String path) throws Exception {
	}

	@Override
	public void deleteDirectory(String path) throws Exception {
	}

	@Override
	public void addDirectory(String path) throws Exception {
	}

	@Override
	public void copyFile(String path) throws Exception {
	}

	@Override
	public void handleCollision(UpgradeCollision collision) throws Exception {
	}

}
