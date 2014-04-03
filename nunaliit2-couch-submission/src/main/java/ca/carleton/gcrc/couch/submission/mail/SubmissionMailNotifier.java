package ca.carleton.gcrc.couch.submission.mail;

import org.json.JSONObject;

public interface SubmissionMailNotifier {

	void sendSubmissionWaitingForApprovalNotification(JSONObject submissionDoc) throws Exception;
}
