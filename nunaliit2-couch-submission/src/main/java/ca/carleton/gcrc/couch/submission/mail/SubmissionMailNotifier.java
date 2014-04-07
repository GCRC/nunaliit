package ca.carleton.gcrc.couch.submission.mail;

import java.util.List;

import org.json.JSONObject;

import ca.carleton.gcrc.mail.MailRecipient;

public interface SubmissionMailNotifier {

	void sendSubmissionWaitingForApprovalNotification(JSONObject submissionDoc) throws Exception;

	void sendSubmissionRejectionNotification(JSONObject submissionDoc, List<MailRecipient> recipients) throws Exception;
}
