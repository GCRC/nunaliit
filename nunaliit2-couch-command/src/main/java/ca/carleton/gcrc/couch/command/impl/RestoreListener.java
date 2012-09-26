package ca.carleton.gcrc.couch.command.impl;

import java.io.PrintStream;
import java.util.List;

import ca.carleton.gcrc.couch.app.DbRestoreListener;
import ca.carleton.gcrc.couch.app.Document;

public class RestoreListener implements DbRestoreListener {

	private PrintStream os;
	private int total = 0;
	private int count = 0;
	private int skipped = 0;
	
	public RestoreListener(PrintStream outStream) {
		this.os = outStream;
	}

	@Override
	public void reportDocumentIds(List<String> docIds) {
		count = 0;
		skipped = 0;
		total = docIds.size();
		os.println("Number of documents to restore: "+total);
	}

	@Override
	public void updatingDocument(Phase phase, Document doc) {
		if( phase == Phase.BEFORE ) {
			++count;
			os.println("Restoring "+count+" of "+total+" ("+doc.getId()+")");
		}
	}
	
	@Override
	public void documentSkippedBecauseModified(Document doc) {
		++count;
		++skipped;
		os.println("Can not restore "+doc.getId()+" because the document was modified in the database");
	}

	@Override
	public void documentSkippedBecauseUnchanged(Document doc) {
		++count;
		os.println("Not restoring "+count+" of "+total+" ("+doc.getId()+") because it is unchanged");
	}


	@Override
	public void endRestore() {
		os.println("Restore completed");
		if( skipped > 0 ) {
			os.println("*** "+skipped+" document(s) not restored");
		}
	}

}
