package ca.carleton.gcrc.couch.command.impl;

import java.util.HashSet;
import java.util.List;
import java.util.Set;
import java.util.Vector;

public class UpgradeReport {

	/**
	 * File paths that are reported as deleted by upgrade process
	 */
	private Set<String> deletedPaths = new HashSet<String>();

	/**
	 * File paths that are reported as added by upgrade process
	 */
	private Set<String> addedPaths = new HashSet<String>();

	/**
	 * File paths that are reported as upgraded by upgrade process
	 */
	private Set<String> upgradedPaths = new HashSet<String>();
	
	/**
	 * Manifest computed from upgrade directory
	 */
	private FileSetManifest upgradeFileSetManifest = null;
	
	/**
	 * Manifest retrieved from installation report
	 */
	private FileSetManifest installedFileSetManifest = null;
	
	/**
	 * Manifest of relevant files on disk
	 */
	private FileSetManifest diskFileSetManifest = null;
	
	/**
	 * List of collisions that occurs during upgrade
	 */
	private List<UpgradeCollision> collisions = new Vector<UpgradeCollision>();
	
	/**
	 * Files that should actually be deleted during upgrade process
	 */
	private Set<String> filesToBeDeleted = new HashSet<String>();
	
	/**
	 * Directories that should actually be deleted during upgrade process
	 */
	private Set<String> directoriesToBeDeleted = new HashSet<String>();
	
	/**
	 * Files that should actually be added during upgrade process
	 */
	private Set<String> filesToBeAdded = new HashSet<String>();
	
	/**
	 * Directories that should actually be added during upgrade process
	 */
	private Set<String> directoriesToBeAdded = new HashSet<String>();
	
	/**
	 * Files that should actually be upgraded during upgrade process
	 */
	private Set<String> filesToBeUpgraded = new HashSet<String>();
	
	/**
	 * Paths of files that should be assumed as installed (simply update manifest
	 * of installed files)
	 */
	private Set<String> pathsToAssumeUpgraded = new HashSet<String>();
	
	/**
	 * Paths of files that should be assumed as deleted (simply remove from manifest
	 * of installed files)
	 */
	private Set<String> pathsToAssumeDeleted = new HashSet<String>();

	public Set<String> getDeletedPaths() {
		return deletedPaths;
	}
	
	public void addDeletedPath(String path){
		deletedPaths.add(path);
	}

	public Set<String> getAddedPaths() {
		return addedPaths;
	}
	
	public void addAddedPath(String path){
		addedPaths.add(path);
	}

	public Set<String> getUpgradedPaths() {
		return upgradedPaths;
	}
	
	public void addUpgradedPath(String path){
		upgradedPaths.add(path);
	}

	public FileSetManifest getUpgradeFileSetManifest() {
		return upgradeFileSetManifest;
	}

	public void setUpgradeFileSetManifest(FileSetManifest upgradeFileSetManifest) {
		this.upgradeFileSetManifest = upgradeFileSetManifest;
	}

	public FileSetManifest getInstalledFileSetManifest() {
		return installedFileSetManifest;
	}

	public void setInstalledFileSetManifest(FileSetManifest installedFileSetManifest) {
		this.installedFileSetManifest = installedFileSetManifest;
	}

	public FileSetManifest getDiskFileSetManifest() {
		return diskFileSetManifest;
	}

	public void setDiskFileSetManifest(FileSetManifest diskFileSetManifest) {
		this.diskFileSetManifest = diskFileSetManifest;
	}

	public List<UpgradeCollision> getCollisions() {
		return collisions;
	}

	public void addCollision(UpgradeCollision collision){
		collisions.add(collision);
	}

	public Set<String> getFilesToBeDeleted() {
		return filesToBeDeleted;
	}
	
	public void addFileToBeDeleted(String path){
		filesToBeDeleted.add(path);
	}

	public Set<String> getDirectoriesToBeDeleted() {
		return directoriesToBeDeleted;
	}
	
	public void addDirectoryToBeDeleted(String path){
		directoriesToBeDeleted.add(path);
	}

	public Set<String> getFilesToBeAdded() {
		return filesToBeAdded;
	}
	
	public void addFileToBeAdded(String path){
		filesToBeAdded.add(path);
	}

	public Set<String> getDirectoriesToBeAdded() {
		return directoriesToBeAdded;
	}
	
	public void addDirectoryToBeAdded(String path){
		directoriesToBeAdded.add(path);
	}

	public Set<String> getFilesToBeUpgraded() {
		return filesToBeUpgraded;
	}
	
	public void addFileToBeUpgraded(String path){
		filesToBeUpgraded.add(path);
	}

	public Set<String> getPathsToAssumeUpgraded() {
		return pathsToAssumeUpgraded;
	}
	
	public void addPathToAssumeUpgraded(String path){
		pathsToAssumeUpgraded.add(path);
	}

	public Set<String> getPathsToAssumeDeleted() {
		return pathsToAssumeDeleted;
	}
	
	public void addPathToAssumeDeleted(String path){
		pathsToAssumeDeleted.add(path);
	}
}
