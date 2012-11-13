package ca.carleton.gcrc.couch.command.impl;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.OutputStreamWriter;

import org.json.JSONObject;

public class UpgradeOperationsBasic implements UpgradeOperations {

	private File atlasDir = null;
	private File upgradeDir = null;
	private File upgradeCollisionDir = null;
	
	public UpgradeOperationsBasic(File atlasDir, File upgradeDir, File upgradeCollisionDir){
		this.atlasDir = atlasDir;
		this.upgradeDir = upgradeDir;
		this.upgradeCollisionDir = upgradeCollisionDir;
	}
	
	@Override
	public void saveInstalledManifest(FileSetManifest manifest) throws Exception {
		
		FileOutputStream fos = null;
		try {
			File configDir = new File(atlasDir,"config");
			File manifestFile = new File(configDir,"nunaliit_manifest.json");
			
			JSONObject json = manifest.toJson();
			
			fos = new FileOutputStream(manifestFile,false); // overwrite
			OutputStreamWriter osw = new OutputStreamWriter(fos,"UTF-8");
			
			osw.write( json.toString(3) );

			osw.flush();
			
			fos.close();
			fos = null;
			
		} catch(Exception e) {
			throw new Exception("Error while saving manifest",e);
			
		} finally {
			if( null != fos ){
				try {
					fos.close();
				} catch(Exception e){
					// Ignored
				}
			}
		}
	}

	@Override
	public void deleteFile(String path) throws Exception {
		File targetFile = new File(atlasDir, path);
		if( false == targetFile.exists() ) {
			throw new Exception("Attemping to delete file "+path+", but it does not exists: "+targetFile.getAbsolutePath());
		}
		if( false == targetFile.isFile() ) {
			throw new Exception("Attemping to delete file "+path+", but it is not a file: "+targetFile.getAbsolutePath());
		}
		try {
			boolean deleted = targetFile.delete();
			if( !deleted ) {
				throw new Exception("Unable to delete: "+targetFile.getAbsolutePath());
			}
		} catch(Exception e) {
			throw new Exception("Error attempting to delete a file: "+path,e);
		}
	}

	@Override
	public void deleteDirectory(String path) throws Exception {
		File targetDir = new File(atlasDir, path);
		if( false == targetDir.exists() ) {
			throw new Exception("Attemping to delete directory "+path+", but it does not exists: "+targetDir.getAbsolutePath());
		}
		if( false == targetDir.isDirectory() ) {
			throw new Exception("Attemping to delete directory "+path+", but it is not a file: "+targetDir.getAbsolutePath());
		}
		try {
			boolean deleted = targetDir.delete();
			if( !deleted ) {
				throw new Exception("Unable to delete: "+targetDir.getAbsolutePath());
			}
		} catch(Exception e) {
			throw new Exception("Error attempting to delete a directory: "+path,e);
		}
	}

	@Override
	public void addDirectory(String path) throws Exception {
		File targetDir = new File(atlasDir, path);
		if( true == targetDir.exists() && false == targetDir.isDirectory() ) {
			throw new Exception("Attemping to create directory "+path+", but a file already exists: "+targetDir.getAbsolutePath());
		}
		if( true == targetDir.exists() && targetDir.isDirectory() ) {
			return; // OK
		}
		try {
			boolean created = targetDir.mkdir();
			if( !created ) {
				throw new Exception("Unable to create directory: "+targetDir.getAbsolutePath());
			}
		} catch(Exception e) {
			throw new Exception("Error while creating a directory: "+path,e);
		}
	}

	@Override
	public void copyFile(String path) throws Exception {

		File targetFile = new File(atlasDir, path);
		File sourceFile = new File(upgradeDir, path);

		try {
			copyFile(sourceFile, targetFile);
		} catch(Exception e) {
			throw new Exception("Error while copying file: "+path,e);
		}
	}

	@Override
	public void handleCollision(UpgradeCollision collision) throws Exception {
		String path = collision.getPath();
		File sourceFile = new File(upgradeDir, path);
		
		if( sourceFile.exists() && sourceFile.isFile() ) {
			// Create upgrade directory
			if( false == upgradeCollisionDir.exists() ) {
				boolean created = upgradeCollisionDir.mkdirs();
				if( false == created ){
					throw new Exception("Unable to created directory: "+upgradeCollisionDir.getAbsolutePath());
				}
			}
			
			// Figure out target
			File targetFile = new File(upgradeCollisionDir, path);
			
			// Create parent directory
			File targetParent = targetFile.getParentFile();
			if( !targetParent.exists() ) {
				boolean created = targetParent.mkdirs();
				if( false == created ){
					throw new Exception("Unable to created directory: "+targetParent.getAbsolutePath());
				}
			}
			
			// Copy over file
			try {
				copyFile(sourceFile, targetFile);
			} catch(Exception e) {
				throw new Exception("Error while copying file related to collision: "+path,e);
			}
		}
	}

	private void copyFile(File sourceFile, File targetFile) throws Exception {

		InputStream is = null;
		FileOutputStream fos = null;
		String fromPath = "<unknown>";
		String toPath = "<unknown>";
		try {
			fromPath = sourceFile.getAbsolutePath();
			toPath = targetFile.getAbsolutePath();

			is = new FileInputStream(sourceFile);
			fos = new FileOutputStream(targetFile);
			byte[] buffer = new byte[256];
			int size = is.read(buffer);
			while(size >= 0){
				fos.write(buffer,0,size);
				size = is.read(buffer);
			}
			fos.flush();
			
		} catch(Exception e) {
			throw new Exception("Unable to copy file: "+fromPath+" to "+toPath);
			
		} finally {
			if( null != is ) {
				try {
					is.close();
				} catch(Exception e) {
					// Ignore
				}
			}
			if( null != fos ) {
				try {
					fos.close();
				} catch(Exception e) {
					// Ignore
				}
			}
		}
		
		// Copy execute bit
		if( sourceFile.canExecute() ) {
			targetFile.setExecutable(true, false);
		}
	}
	
//	private File getUpgradeCollisionDir() throws Exception {
//		if( null == upgradeCollisionDir ) {
//			// Compute upgrade dir
//			File temp = null;
//			{
//				Calendar calendar = Calendar.getInstance();
//				String name = String.format(
//					"upgrade_%04d-%02d-%02d_%02d:%02d:%02d"
//					,calendar.get(Calendar.YEAR)
//					,(calendar.get(Calendar.MONTH)+1)
//					,calendar.get(Calendar.DAY_OF_MONTH)
//					,calendar.get(Calendar.HOUR_OF_DAY)
//					,calendar.get(Calendar.MINUTE)
//					,calendar.get(Calendar.SECOND)
//					);
//				temp = new File(atlasDir, "upgrade/"+name);
//			}
//			
//			boolean created = temp.mkdirs();
//			if( !created ){
//				throw new Exception("Unable to create directory for upgrade collisions: "+temp.getAbsolutePath());
//			}
//			upgradeCollisionDir = temp;
//		}
//		
//		return upgradeCollisionDir;
//	}
}
