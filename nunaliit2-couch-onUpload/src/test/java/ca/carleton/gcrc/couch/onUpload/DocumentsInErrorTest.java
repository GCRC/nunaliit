package ca.carleton.gcrc.couch.onUpload;

import java.util.Date;

import junit.framework.TestCase;

public class DocumentsInErrorTest extends TestCase {

	public void testIsDocumentInError(){
		DocumentsInError errors = new DocumentsInError();
		String docId = "123";
		
		if( errors.isDocumentInError(docId) ){
			fail("Should not report document in error");
		}
		
		errors.addDocumentInError(docId);
		
		if( false == errors.isDocumentInError(docId) ){
			fail("Should report document in error");
		}
		
		errors.removeErrorsWithDocId(docId);

		if( errors.isDocumentInError(docId) ){
			fail("Should not report document in error after removed");
		}
	}
	
	public void testRemoveErrorsOlderThanMs(){
		DocumentsInError errors = new DocumentsInError();
		
		Date now = new Date();
		
		String docId = "123";
		long intervalInMs = 5 * 60 * 1000; // 5 minutes
		Date errorTime = new Date( now.getTime() - intervalInMs );
		
		errors.addDocumentInError(docId, errorTime);
		
		if( false == errors.isDocumentInError(docId) ){
			fail("Should report document in error");
		}

		// Remove errors older than 2 minutes
		errors.removeErrorsOlderThanMs( (long)(2 * 60 * 1000) );

		if( errors.isDocumentInError(docId) ){
			fail("Should not report document in error after removed");
		}
	}
	
	public void testIsDocumentInErrorInLastMs(){
		DocumentsInError errors = new DocumentsInError();
		
		Date now = new Date();
		
		String docId = "123";
		long intervalInMs = 5 * 60 * 1000; // 5 minutes
		Date errorTime = new Date( now.getTime() - intervalInMs );
		
		errors.addDocumentInError(docId, errorTime);

		// Check if error in last 2 minutes
		long twoMinInMs = 2 * 60 * 1000;
		if( errors.isDocumentInErrorInLastMs(docId, twoMinInMs) ){
			fail("Should not report document in error in last 2 minutes");
		}
		
		// Check if error in last 10 minutes
		long tenMinInMs = 10 * 60 * 1000;
		if( false == errors.isDocumentInErrorInLastMs(docId, tenMinInMs) ){
			fail("Should report document in error in last 10 minutes");
		}
	}
}
