package ca.carleton.gcrc.couch.command.impl;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateListener;
import ca.carleton.gcrc.couch.command.GlobalSettings;

public class UpdateProgress implements DocumentUpdateListener {

	private GlobalSettings gs;
	
	public UpdateProgress(GlobalSettings gs){
		this.gs = gs;
	}
	
	@Override
	public void documentSkippedBecauseModified(Document doc) {
		gs.getOutStream().println("Update skipped: "+doc.getId());
	}

	@Override
	public void documentSkippedBecauseUnchanged(Document doc) {
	}

	@Override
	public void updatingDocument(Phase phase, Document doc) {
	}

}
