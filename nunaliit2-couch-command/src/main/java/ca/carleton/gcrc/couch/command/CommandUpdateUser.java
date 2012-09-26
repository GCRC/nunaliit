package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.util.Properties;
import java.util.Stack;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateListener;
import ca.carleton.gcrc.couch.app.DocumentUpdateProcess;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.client.CouchClient;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchFactory;
import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.couch.command.impl.UpdateProgress;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;

public class CommandUpdateUser implements Command {

	@Override
	public String getCommandString() {
		return "update-user";
	}

	@Override
	public boolean matchesKeyword(String keyword) {
		if( getCommandString().equalsIgnoreCase(keyword) ) {
			return true;
		}
		return false;
	}

	@Override
	public boolean requiresAtlasDir() {
		return true;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Update User DB Command");
		ps.println();
		ps.println("The 'update user' command updates the users database");
		ps.println("with information required by the framework. This update");
		ps.println("is required only once for a CouchDB installation. This");
		ps.println("command should be run before the first atlas instance is");
		ps.println("run.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit [<global-options>] update-user");
		ps.println();
		ps.println("Global Options");
		CommandHelp.reportGlobalSettingAtlasDir(ps);
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Stack<String> argumentStack
		) throws Exception {
		
		File atlasDir = gs.getAtlasDir();

		// Load properties for atlas
		AtlasProperties atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);

		// Prepare update process
		DocumentUpdateProcess updateProcess = 
				createDocumentUpdateProcessForUserDb(gs, atlasProperties);
		
		// Update site design document
		try {
			pushUserDesign(gs, atlasDir, atlasProperties, updateProcess);
		} catch(Exception e) {
			throw new Exception("Unable to upload site design document", e);
		}
	}
	
	private void pushUserDesign(
		GlobalSettings gs
		,File atlasDir
		,AtlasProperties atlasProperties
		,DocumentUpdateProcess updateProcess
		) throws Exception {
		
		// Create _design/mobile document...
		Document doc = null;
		{
			File userDesignDir = PathComputer.computeUserDesignDir(gs.getInstallDir());
					
			FSEntry fileEntry = new FSEntryFile(userDesignDir);
			doc = DocumentFile.createDocument(fileEntry);
		}

		// Update document
		updateProcess.update(doc, true);
	}

	private DocumentUpdateProcess createDocumentUpdateProcessForUserDb(
			GlobalSettings gs
			,AtlasProperties atlasProperties
			) throws Exception {
			
			// Create couch client
			CouchClient couchClient = null;
			{
				Properties couchClientProps = new Properties();
				couchClientProps.put("couchdb.server", atlasProperties.getCouchDbUrl().toExternalForm());
				couchClientProps.put("couchdb.user", atlasProperties.getCouchDbAdminUser());
				couchClientProps.put("couchdb.password", atlasProperties.getCouchDbAdminPassword());
		
				CouchFactory couchFactory = new CouchFactory();
				couchClient = couchFactory.getClient(couchClientProps);
			}
			
			// Get _user database from Couch Client
			CouchDb couchDb = null;
			{
				String dbName = "_users";
				if( false == couchClient.databaseExists(dbName) ) {
					throw new Exception("Unable to access _users database");
				}
				couchDb = couchClient.getDatabase(dbName);
			}
			
			DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
			DocumentUpdateListener l = new UpdateProgress(gs);
			updateProcess.setListener(l);
			
			return updateProcess;
		}
}
