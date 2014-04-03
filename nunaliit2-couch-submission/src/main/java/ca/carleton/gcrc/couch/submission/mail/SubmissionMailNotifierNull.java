package ca.carleton.gcrc.couch.submission.mail;

import org.json.JSONObject;

public class SubmissionMailNotifierNull implements SubmissionMailNotifier {

	@Override
	public void sendSubmissionWaitingForApprovalNotification(
			JSONObject submissionDoc) throws Exception {
	}

}
