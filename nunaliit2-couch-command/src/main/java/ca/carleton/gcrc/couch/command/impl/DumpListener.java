package ca.carleton.gcrc.couch.command.impl;

import java.io.PrintStream;
import java.util.List;

import ca.carleton.gcrc.couch.app.DbDumpListener;

public class DumpListener implements DbDumpListener {

	private PrintStream os;
	private int total = 0;
	private int count = 0;
	
	public DumpListener(PrintStream outStream) {
		this.os = outStream;
	}

	@Override
	public void reportDocumentIds(List<String> docIds) {
		total = docIds.size();
		count = 0;
		os.println("Number of documents in dump: "+total);
	}

	@Override
	public void reportDownload(String docId) {
		++count;
		os.println("Downloading "+count+" of "+total+" ("+docId+")");
	}

	@Override
	public void reportStore(String docId) {
		os.println("Storing "+count+" of "+total+" ("+docId+")");
	}

	@Override
	public void reportEnd() {
		os.println("Dump completed");
	}

}
