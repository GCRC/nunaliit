package ca.carleton.gcrc.couch.command;

import java.io.File;
import java.io.PrintStream;
import java.io.PrintWriter;
import java.io.StringWriter;
import java.util.List;
import java.util.Vector;

import javax.servlet.ServletException;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateListener;
import ca.carleton.gcrc.couch.app.DocumentUpdateProcess;
import ca.carleton.gcrc.couch.app.impl.DocumentFile;
import ca.carleton.gcrc.couch.app.impl.UpdateSpecifier;
import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDbSecurityDocument;
import ca.carleton.gcrc.couch.command.impl.CommandSupport;
import ca.carleton.gcrc.couch.command.impl.GenerateCssLibrariesProcess;
import ca.carleton.gcrc.couch.command.impl.GenerateJavascriptLibrariesProcess;
import ca.carleton.gcrc.couch.command.impl.PathComputer;
import ca.carleton.gcrc.couch.command.impl.UpdateProgress;
import ca.carleton.gcrc.couch.fsentry.FSEntry;
import ca.carleton.gcrc.couch.fsentry.FSEntryBuffer;
import ca.carleton.gcrc.couch.fsentry.FSEntryFile;
import ca.carleton.gcrc.couch.fsentry.FSEntryMerged;
import ca.carleton.gcrc.utils.VersionUtils;

public class CommandUpdate implements Command {

	static final private Logger logger = LoggerFactory.getLogger(UpdateSpecifier.class);
	
	private enum DatabaseType {
		DOCUMENT_DATABASE("isDocumentDb"),
		SUBMISSION_DATABASE("isSubmissionDb");
		
		private String propName;
		DatabaseType(String propName){
			this.propName = propName;
		}
		public String getPropName(){
			return propName;
		}
	};

	static public DocumentUpdateProcess createDocumentUpdateProcess(
		GlobalSettings gs
		,CouchDb couchDb
		) throws Exception {
		
		DocumentUpdateProcess updateProcess = new DocumentUpdateProcess(couchDb);
		DocumentUpdateListener l = new UpdateProgress(gs);
		updateProcess.setListener(l);
		
		return updateProcess;
	}

	@Override
	public String getCommandString() {
		return "update";
	}

	@Override
	public boolean matchesKeyword(String keyword) {
		if( getCommandString().equalsIgnoreCase(keyword) ) {
			return true;
		}
		return false;
	}

	@Override
	public boolean isDeprecated() {
		return false;
	}

	@Override
	public String[] getExpectedOptions() {
		return new String[]{
				Options.OPTION_ATLAS_DIR
			};
	}

	@Override
	public boolean requiresAtlasDir() {
		return true;
	}

	@Override
	public void reportHelp(PrintStream ps) {
		ps.println("Nunaliit2 Atlas Framework - Update Command");
		ps.println();
		ps.println("The update command packages the content found in the atlas");
		ps.println("directory and uploads it to the CouchDB instance associated");
		ps.println("with the atlas.");
		ps.println();
		ps.println("Command Syntax:");
		ps.println("  nunaliit update <options>");
		ps.println();
		ps.println("options:");
		CommandHelp.reportGlobalOptions(ps,getExpectedOptions());
	}

	@Override
	public void runCommand(
		GlobalSettings gs
		,Options options
		) throws Exception {

		if( options.getArguments().size() > 1 ){
			throw new Exception("Unexpected argument: "+options.getArguments().get(1));
		}
		
		File atlasDir = gs.getAtlasDir();

		// Load properties for atlas
		AtlasProperties atlasProperties = AtlasProperties.fromAtlasDir(atlasDir);

		CouchDb couchDb = CommandSupport.createCouchDb(gs, atlasProperties);
		
		// Prepare update process
		DocumentUpdateProcess updateProcess = 
				CommandUpdate.createDocumentUpdateProcess(gs, couchDb);
		updateProcess.setIgnoringTimestamps(true);
		
		// Update site design document
		try {
			pushSiteDesign(gs, atlasDir, atlasProperties, updateProcess);
		} catch(Exception e) {
			throw new Exception("Unable to upload site design document", e);
		}
		
		// Update atlas design document
		try {
			pushAtlasDesign(gs, atlasDir, atlasProperties, updateProcess);
		} catch(Exception e) {
			throw new Exception("Unable to upload atlas design document", e);
		}
		
		// Update mobile design document
		try {
			pushMobileDesign(gs, atlasDir, atlasProperties, updateProcess);
		} catch(Exception e) {
			throw new Exception("Unable to upload mobile design document", e);
		}
		
		// Update submission database with design document
		if( atlasProperties.isCouchDbSubmissionDbEnabled() ) {
			CouchDb submissionCouchDb = null;
			System.out.println("///////////////////BUCK DICH");
			try {
				submissionCouchDb = CommandSupport.createCouchDbSubmission(gs, atlasProperties);
	
				DocumentUpdateProcess updateProcessForSubmissionDb = 
						CommandUpdate.createDocumentUpdateProcess(gs, submissionCouchDb);
				
				pushSubmissionDesign(gs, atlasDir, atlasProperties, updateProcessForSubmissionDb);
			} catch(Exception e) {
				System.out.println("##############" + e);
				throw new Exception("Unable to upload submission design document", e);
			}

			// Fix member roles on submission database
			try {
				CouchDbSecurityDocument secDoc = submissionCouchDb.getSecurityDocument();
				
				boolean updateRequired = false;
				
				// Administrator role
				{
					String adminRole = atlasProperties.getAtlasName() + "_administrator";
					if( false == secDoc.getAdminRoles().contains(adminRole) ) {
						secDoc.addAdminRole(adminRole);
						updateRequired = true;
					}
				}
				
				// Vetter role
				{
					String vetterRole = atlasProperties.getAtlasName() + "_vetter";
					if( false == secDoc.getMemberRoles().contains(vetterRole) ) {
						secDoc.addMemberRole(vetterRole);
						updateRequired = true;
					}
				}
				
				if( updateRequired ){
					submissionCouchDb.setSecurityDocument(secDoc);
				}
			} catch(Exception e) {
				throw new ServletException("Error while adjusting member roles on submission database", e);
			}
		}
		
		// Update documents from atlas directory
		try {
			File docsDir = new File(atlasDir, "docs");
			pushDocuments(gs, atlasDir, atlasProperties, updateProcess, docsDir);
		} catch(Exception e) {
			throw new Exception("Unable to upload atlas documents", e);
		}
		
		// Update documents from atlas framework
		try {
			File docsDir = PathComputer.computeInitializeDocsDir(gs.getInstallDir());
			pushDocuments(gs, atlasDir, atlasProperties, updateProcess, docsDir);

			docsDir = PathComputer.computeUpdateDocsDir(gs.getInstallDir());
			pushDocuments(gs, atlasDir, atlasProperties, updateProcess, docsDir);
			
		} catch(Exception e) {
			throw new Exception("Unable to upload documents from framework", e);
		}
	}
	
	private void pushSiteDesign(
		GlobalSettings gs
		,File atlasDir
		,AtlasProperties atlasProperties
		,DocumentUpdateProcess updateProcess
		) throws Exception {
		
		// Create _design/site document...
		Document doc = null;
		{
			List<FSEntry> mergedEntries = new Vector<FSEntry>();
			
			// htdocs from atlas project
			{
				File htdocsDir = new File(atlasDir, "htdocs");
				if( htdocsDir.exists() && htdocsDir.isDirectory() ) {
					FSEntry positionedHtDocs = FSEntryFile.getPositionedFile("d/_attachments", htdocsDir);
					mergedEntries.add(positionedHtDocs);
				}
			}
			
			// site from atlas project
			{
				File siteDir = new File(atlasDir, "site");
				if( siteDir.exists() && siteDir.isDirectory() ) {
					FSEntry siteEntry = new FSEntryFile(siteDir);
					mergedEntries.add(siteEntry);
				}
			}

			// Create atlas designator
			{
				StringWriter sw = new StringWriter();
				PrintWriter pw = new PrintWriter(sw);
				
				printAtlasVendorFile(pw, atlasProperties, DatabaseType.DOCUMENT_DATABASE);
				
				FSEntry f = FSEntryBuffer.getPositionedBuffer("a/vendor/nunaliit2/atlas.js", sw.toString());
				mergedEntries.add(f);
				f = FSEntryBuffer.getPositionedBuffer("a/_attachments/lib/atlas.js", sw.toString());
				mergedEntries.add(f);
			}
			
			
			// Template for _design/site
			{
				File siteDesignDocDir = PathComputer.computeSiteDesignDir( gs.getInstallDir() );
				if( siteDesignDocDir.exists() && siteDesignDocDir.isDirectory() ){
					FSEntry templateDir = new FSEntryFile(siteDesignDocDir);
					mergedEntries.add(templateDir);
				} else {
					throw new Exception("Unable to find internal template for _design/site");
				}
			}
			
			FSEntry merged = new FSEntryMerged(mergedEntries);
			doc = DocumentFile.createDocument(merged);
		}

		// Update document
		updateProcess.update(doc);
	}
	
	private void pushAtlasDesign(
		GlobalSettings gs
		,File atlasDir
		,AtlasProperties atlasProperties
		,DocumentUpdateProcess updateProcess
		) throws Exception {
		
		// Update javascript libraries and CSS libraries, if in development mode
		{
			File installDir = gs.getInstallDir();
			File nunaliitDir = PathComputer.computeNunaliitDir(installDir);
			if( null != nunaliitDir ) {
				GenerateJavascriptLibrariesProcess jsProcess = new GenerateJavascriptLibrariesProcess();
				jsProcess.generate(nunaliitDir);
				
				GenerateCssLibrariesProcess cssProcess = new GenerateCssLibrariesProcess();
				cssProcess.generate(nunaliitDir);
			}
		}
		
		// Create _design/atlas document...
		Document doc = null;
		{
			File installDir = gs.getInstallDir();

			List<FSEntry> entries = new Vector<FSEntry>();
			
			// Force identifier
			{
				FSEntry f = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "_design/atlas");
				entries.add(f);
			}
			
			// Create atlas designator
			{
				String version = VersionUtils.getVersion();
				String buildStr = VersionUtils.getBuildString();
				
				StringWriter sw = new StringWriter();
				PrintWriter pw = new PrintWriter(sw);
				
				pw.println("{");
				pw.println("\t\"name\":\""+atlasProperties.getAtlasName()+"\"");
				pw.println("\t,\"restricted\":"+atlasProperties.isRestricted());
				pw.println("\t,\"submissionDbEnabled\":"+atlasProperties.isCouchDbSubmissionDbEnabled());
				pw.println("\t,\"submissionDbName\":\""+atlasProperties.getCouchDbSubmissionDbName()+"\"");
				if( null != version ){
					pw.println("\t,\"version\":\""+version+"\"");
				}
				if( null != buildStr ){
					pw.println("\t,\"build\":\""+buildStr+"\"");
				}
				pw.println("}");
				
				FSEntry f = FSEntryBuffer.getPositionedBuffer("a/nunaliit.json", sw.toString());
				entries.add(f);
			}
			
			// Create atlas designator
			{
				StringWriter sw = new StringWriter();
				PrintWriter pw = new PrintWriter(sw);
				
				printAtlasVendorFile(pw, atlasProperties, DatabaseType.DOCUMENT_DATABASE);
				
				FSEntry f = FSEntryBuffer.getPositionedBuffer("a/vendor/nunaliit2/atlas.js", sw.toString());
				entries.add(f);
				f = FSEntryBuffer.getPositionedBuffer("a/_attachments/lib/atlas.js", sw.toString());
				entries.add(f);
			}
			
			// Atlas design template
			{
				File atlasDesignDir = PathComputer.computeAtlasDesignDir(installDir);
				if( null == atlasDesignDir ) {
					throw new Exception("Can not find _design/atlas template");
				} else {
					FSEntryFile f = new FSEntryFile(atlasDesignDir);
					entries.add(f);
				}
			}
			
			// Nunaliit2 javascript library
			{
				File n2Dir = PathComputer.computeNunaliit2JavascriptDir(installDir);
				if( null == n2Dir ) {
					throw new Exception("Can not find nunaliit2 javascript library");
				} else {
					// Libraries
					{
						FSEntry f = FSEntryFile.getPositionedFile("a/_attachments/nunaliit2", n2Dir);
						entries.add(f);
					}
					
					// Vendor file 'n2.couchUtils.js'
					{
						File file = new File(n2Dir,"n2.couchUtils.js");
						FSEntry f = FSEntryFile.getPositionedFile("a/vendor/nunaliit2/n2.couchUtils.js", file);
						entries.add(f);
					}
					
					// Vendor file 'n2.couchTiles.js'
					{
						File file = new File(n2Dir,"n2.couchTiles.js");
						FSEntry f = FSEntryFile.getPositionedFile("a/vendor/nunaliit2/n2.couchTiles.js", file);
						entries.add(f);
					}
				}
			}
			
			// External javascript library
			{
				File externalDir = PathComputer.computeExternalJavascriptDir(installDir);
				if( null == externalDir ) {
					throw new Exception("Can not find external javascript library");
				} else {
					FSEntry f = FSEntryFile.getPositionedFile("a/_attachments/js-external", externalDir);
					entries.add(f);
				}
			}
			
			// Install language
			{
				FSEntry f = FSEntryBuffer.getPositionedBuffer("a/language.txt", "javascript");
				entries.add(f);
			}
			
			// Create FSEntry to load document
			FSEntryMerged mergedEntry = new FSEntryMerged(entries);
			
			doc = DocumentFile.createDocument(mergedEntry, mergedEntry);
		}
		
		// Update document
		updateProcess.update(doc);
	}
	
	private void pushMobileDesign(
		GlobalSettings gs
		,File atlasDir
		,AtlasProperties atlasProperties
		,DocumentUpdateProcess updateProcess
		) throws Exception {
		
		// Create _design/mobile document...
		Document doc = null;
		{
			File installDir = gs.getInstallDir();

			List<FSEntry> entries = new Vector<FSEntry>();
			
			// Force identifier
			{
				FSEntry f = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "_design/mobile");
				entries.add(f);
			}
			
			// Create atlas designator
			{
				StringWriter sw = new StringWriter();
				PrintWriter pw = new PrintWriter(sw);
				
				printAtlasVendorFile(pw, atlasProperties, DatabaseType.DOCUMENT_DATABASE);
				
				FSEntry f = FSEntryBuffer.getPositionedBuffer("a/vendor/nunaliit2/atlas.js", sw.toString());
				entries.add(f);
			}
			
			// Nunaliit2 vendor libraries
			{
				File n2Dir = PathComputer.computeNunaliit2JavascriptDir(installDir);
				if( null == n2Dir ) {
					throw new Exception("Can not find nunaliit2 javascript library");
				} else {
					// Vendor file 'n2.couchUtils.js'
					{
						File file = new File(n2Dir,"n2.couchUtils.js");
						FSEntry f = FSEntryFile.getPositionedFile("a/vendor/nunaliit2/n2.couchUtils.js", file);
						entries.add(f);
					}
					
					// Vendor file 'n2.couchTiles.js'
					{
						File file = new File(n2Dir,"n2.couchTiles.js");
						FSEntry f = FSEntryFile.getPositionedFile("a/vendor/nunaliit2/n2.couchTiles.js", file);
						entries.add(f);
					}
				}
			}
			
			// Mobile design content
			{
				File mobileDesignDir = PathComputer.computeMobileDesignDir(gs.getInstallDir());
				FSEntry f = new FSEntryFile(mobileDesignDir);
				entries.add(f);
			}

			// Create FSEntry to load document
			FSEntryMerged mergedEntry = new FSEntryMerged(entries);
			
			doc = DocumentFile.createDocument(mergedEntry, mergedEntry);
		}

		// Update document
		updateProcess.update(doc);
	}
	
	private void pushSubmissionDesign(
		GlobalSettings gs
		,File atlasDir
		,AtlasProperties atlasProperties
		,DocumentUpdateProcess updateProcess
		) throws Exception {
		
		// Create _design/submission document...
		Document doc = null;
		{
			File installDir = gs.getInstallDir();

			List<FSEntry> entries = new Vector<FSEntry>();
			
			// Force identifier
			{
				FSEntry f = FSEntryBuffer.getPositionedBuffer("a/_id.txt", "_design/submission");
				entries.add(f);
			}
			
			// Create atlas designator
			{
				StringWriter sw = new StringWriter();
				PrintWriter pw = new PrintWriter(sw);
				
				printAtlasVendorFile(pw, atlasProperties, DatabaseType.SUBMISSION_DATABASE);
				
				FSEntry f = FSEntryBuffer.getPositionedBuffer("a/vendor/nunaliit2/atlas.js", sw.toString());
				entries.add(f);
			}
			
			// Install atlas validation routines from atlas design document
			{
				File atlasDesignDir = PathComputer.computeAtlasDesignDir(installDir);
				if( null == atlasDesignDir ) {
					throw new Exception("Can not find _design/atlas template");
				} else {
					File validateFile = new File(atlasDesignDir,"vendor/nunaliit2/validate.js");
					FSEntry f = FSEntryFile.getPositionedFile("a/vendor/nunaliit2/validate.js", validateFile);
					entries.add(f);
				}
			}
			
			// Nunaliit2 vendor libraries
			{
				File n2Dir = PathComputer.computeNunaliit2JavascriptDir(installDir);
				if( null == n2Dir ) {
					throw new Exception("Can not find nunaliit2 javascript library");
				} else {
					// Vendor file 'n2.couchUtils.js'
					{
						File file = new File(n2Dir,"n2.couchUtils.js");
						FSEntry f = FSEntryFile.getPositionedFile("a/vendor/nunaliit2/n2.couchUtils.js", file);
						entries.add(f);
					}
					
					// Vendor file 'n2.couchTiles.js'
					{
						File file = new File(n2Dir,"n2.couchTiles.js");
						FSEntry f = FSEntryFile.getPositionedFile("a/vendor/nunaliit2/n2.couchTiles.js", file);
						entries.add(f);
					}
				}
			}
			
			// Submission design content
			{
				File submissionDesignDir = PathComputer.computeSubmissionDesignDir(installDir);
				FSEntry f = new FSEntryFile(submissionDesignDir);
				entries.add(f);
			}

			// Create FSEntry to load document
			FSEntryMerged mergedEntry = new FSEntryMerged(entries);
			
			doc = DocumentFile.createDocument(mergedEntry, mergedEntry);
		}

		// Update document
		updateProcess.update(doc);
	}
	
	private void pushDocuments(
		GlobalSettings gs
		,File atlasDir
		,AtlasProperties atlasProperties
		,DocumentUpdateProcess updateProcess
		,File docsDir
		) throws Exception {

		if( docsDir.exists() && docsDir.isDirectory() ){
			// Iterate over each subdirectory, attempting to
			// load each document
			String[] subDirNames = docsDir.list( gs.getFilenameFilter() );
			for(String subDirName : subDirNames){
				File subDir = new File(docsDir, subDirName);
				if( subDir.exists() && subDir.isDirectory() ) {
					// OK, let's create a document based on this
					Document doc = null;
					try {
						FSEntryFile entry = new FSEntryFile(subDir);
						doc = DocumentFile.createDocument(entry);
						
						if( null != doc && null != doc.getJSONObject() ){
							if( logger.isTraceEnabled() ){
								logger.trace(subDirName);
								logger.trace(doc.getJSONObject().toString());
							}
						}

					} catch(Exception e){
						throw new Exception("Unable to read document at: "+subDir.getName(), e);
					}
					
					// Update document to database
					try {
						updateProcess.update(doc);
					} catch(Exception e) {
						throw new Exception("Unable to update database with document at: "+subDir.getName(), e);
					}
				}
			}
		}
	}
	
	private void printAtlasVendorFile(PrintWriter pw, AtlasProperties atlasProperties, DatabaseType type){
		String version = VersionUtils.getVersion();
		String buildStr = VersionUtils.getBuildString();

		pw.println("var n2atlas = {");
		pw.println("\tname: \""+atlasProperties.getAtlasName()+"\"");
		pw.println("\t,restricted: "+atlasProperties.isRestricted());
		pw.println("\t,\"submissionDbEnabled\":"+atlasProperties.isCouchDbSubmissionDbEnabled());
		pw.println("\t,\"submissionDbName\":\""+atlasProperties.getCouchDbSubmissionDbName()+"\"");
		pw.println("\t,\"googleMapApiKey\":\""+atlasProperties.getGoogleMapApiKey()+"\"");
		if( null != version ){
			pw.println("\t,\"version\":\""+version+"\"");
		}
		if( null != buildStr ){
			pw.println("\t,\"build\":\""+buildStr+"\"");
		}
		pw.println("\t,\""+type.getPropName()+"\":true");
		pw.println("};");
		pw.println("if( typeof(exports) === 'object' ) {");
		pw.println("\texports.name = n2atlas.name;");
		pw.println("\texports.restricted = n2atlas.restricted;");
		pw.println("\texports.submissionDbEnabled = n2atlas.submissionDbEnabled;");
		pw.println("\texports.submissionDbName = n2atlas.submissionDbName;");
		pw.println("\texports.googleMapApiKey = n2atlas.googleMapApiKey;");
		if( null != version ){
			pw.println("\texports.version = n2atlas.version;");
		}
		if( null != buildStr ){
			pw.println("\texports.build = n2atlas.build;");
		}
		pw.println("\texports."+type.getPropName()+" = true;");
		pw.println("};");
		
		pw.flush();
	}
}
