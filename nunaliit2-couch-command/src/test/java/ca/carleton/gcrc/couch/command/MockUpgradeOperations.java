package ca.carleton.gcrc.couch.command;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Vector;

import ca.carleton.gcrc.couch.command.impl.FileSetManifest;
import ca.carleton.gcrc.couch.command.impl.UpgradeCollision;
import ca.carleton.gcrc.couch.command.impl.UpgradeOperations;

public class MockUpgradeOperations implements UpgradeOperations {

	private FileSetManifest savedManifest = null;
	private Set<String> deletedFiles = new HashSet<String>();
	private Set<String> deletedDirectories = new HashSet<String>();
	private Set<String> addedDirectories = new HashSet<String>();
	private Set<String> copiedFiles = new HashSet<String>();
	private List<UpgradeCollision> collisions = new Vector<UpgradeCollision>();
	
	@Override
	public void saveInstalledManifest(FileSetManifest manifest) throws Exception {
		this.savedManifest = manifest;
	}

	@Override
	public void deleteFile(String path) throws Exception {
		deletedFiles.add(path);
	}

	@Override
	public void deleteDirectory(String path) throws Exception {
		deletedDirectories.add(path);
	}

	@Override
	public void addDirectory(String path) throws Exception {
		addedDirectories.add(path);
	}

	@Override
	public void copyFile(String path) throws Exception {
		copiedFiles.add(path);
	}

	@Override
	public void handleCollision(UpgradeCollision collision) throws Exception {
		collisions.add(collision);
	}

	public FileSetManifest getSavedManifest() {
		return savedManifest;
	}

	public Set<String> getDeletedFiles() {
		return deletedFiles;
	}

	public Set<String> getDeletedDirectories() {
		return deletedDirectories;
	}

	public Set<String> getAddedDirectories() {
		return addedDirectories;
	}

	public Set<String> getCopiedFiles() {
		return copiedFiles;
	}

	public List<UpgradeCollision> getCollisions() {
		return collisions;
	}

}
