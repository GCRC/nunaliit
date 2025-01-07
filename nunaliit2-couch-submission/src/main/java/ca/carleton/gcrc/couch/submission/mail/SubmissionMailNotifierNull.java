package ca.carleton.gcrc.couch.submission.mail;

import java.util.List;

import org.json.JSONObject;

import ca.carleton.gcrc.mail.MailRecipient;

import ca.carleton.gcrc.couch.user.UserDocument;

public class SubmissionMailNotifierNull implements SubmissionMailNotifier {

	@Override
	public void sendSubmissionWaitingForApprovalNotification(
			JSONObject submissionDoc) throws Exception {
	}

	@Override
	public void sendSubmissionRejectionNotification(
			JSONObject submissionDoc,
			List<MailRecipient> recipients) throws Exception {
	}

	@Override
	public void sendSubmissionApprovalNotification(
			JSONObject submissionDoc,
			List<MailRecipient> recipients) throws Exception {
	}

	@Override
	public void sendDocumentCreatedNotification(
			JSONObject submissionDoc,
			UserDocument currentUser) throws Exception {
	}

}
