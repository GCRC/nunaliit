package ca.carleton.gcrc.couch.command.impl;

public class UpgradeCollision {

	public enum Type {
		/**
		 * Can not installed upgraded file because the file
		 * on disk was modified since installed
		 */
		MODIFIED
		,
		/**
		 * Can not add a new file because one is blocking it
		 */
		BLOCKED
		,
		/**
		 * Can not install file/directory from upgrade because
		 * previous version was deleted
		 */
		DELETED
	}
	
	private Type type;
	private String path;
	private FileManifest upgradeManifest;
	private FileManifest installedManifest;
	private FileManifest diskManifest;
	
	public UpgradeCollision(
		Type type
		,String path
		,FileManifest upgradeManifest
		,FileManifest installedManifest
		,FileManifest diskManifest) {
		this.type = type;
		this.path = path;
		this.upgradeManifest = upgradeManifest;
		this.installedManifest = installedManifest;
		this.diskManifest = diskManifest;
	}

	public Type getType() {
		return type;
	}

	public String getPath() {
		return path;
	}

	public FileManifest getUpgradeManifest() {
		return upgradeManifest;
	}

	public FileManifest getInstalledManifest() {
		return installedManifest;
	}

	public FileManifest getDiskManifest() {
		return diskManifest;
	}
}
