package ca.carleton.gcrc.couch.config.impl;

import ca.carleton.gcrc.couch.app.Document;
import ca.carleton.gcrc.couch.app.DocumentUpdateListener;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public class UpdateListener implements DocumentUpdateListener {

	static public UpdateListener _singleton = new UpdateListener();
	
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());

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
