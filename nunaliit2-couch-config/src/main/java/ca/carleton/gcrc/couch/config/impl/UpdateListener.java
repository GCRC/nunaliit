package ca.carleton.gcrc.couch.config.impl;

import org.apache.log4j.Logger;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateListener;

public class UpdateListener implements DocumentUpdateListener {

	static public UpdateListener _singleton = new UpdateListener();
	
	final protected Logger logger = Logger.getLogger(this.getClass());

	@Override
	public void documentSkippedBecauseModified(Document doc) {
		logger.info("Skip updating (modified): "+doc.getId());
	}

	@Override
	public void documentSkippedBecauseUnchanged(Document doc) {
		//logger.info("Skip updating (unchanged): "+doc.getId());
	}

	@Override
	public void updatingDocument(Phase phase, Document doc) {
		if( phase == Phase.AFTER ) {
			logger.info("Updating document: "+doc.getId());
		}
	}

}
