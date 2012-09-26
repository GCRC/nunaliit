package ca.carleton.gcrc.couch.export;

import ca.carleton.gcrc.couch.app.Document;

public class MockDocumentFilter implements DocumentFilter {

	private boolean shouldAccept = true;
	
	@Override
	public boolean accepts(Document doc) throws Exception {
		return shouldAccept;
	}

	public boolean shouldAccept() {
		return shouldAccept;
	}

	public void setShouldAccept(boolean shouldAccept) {
		this.shouldAccept = shouldAccept;
	}
}
