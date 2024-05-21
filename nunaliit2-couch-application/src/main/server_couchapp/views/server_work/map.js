function(doc) {

	var ORIENTATION_LEVEL = 1;
	var THUMBNAIL_LEVEL = 1;

	if (doc
		&& doc.nunaliit_attachments
		&& doc.nunaliit_attachments.files
	) {
		for (var attachmentName in doc.nunaliit_attachments.files) {
			var file = doc.nunaliit_attachments.files[attachmentName];

			if (file) {
				var server = file.server;
				var orientation = 0;
				var thumbnail = 0;

				// Compute orientation level
				if (server
					&& typeof (server.orientation) === 'number') {
					orientation = server.orientation;
				};

				// Compute thumbnail level
				if (server
					&& typeof (server.thumbnail) === 'number') {
					thumbnail = server.thumbnail;
				};

				// Waiting for upload
				if (file.status === 'waiting for upload'
					&& file.uploadId) {
					emit([file.status, file.uploadId], null);
				};

				// Work based on file status
				if (file.status === 'submitted'
					|| file.status === 'submitted_inline'
					|| file.status === 'analyzed'
					|| file.status === 'approved') {
					emit([file.status, attachmentName], null);
				};

				// Fix orientation of images
				if (file.status === 'attached'
					&& file.fileClass === 'image') {
					if (orientation >= ORIENTATION_LEVEL) {
						// OK, no work
					} else {
						emit(['orientation', attachmentName], null);
					};
				};

				// Create thumbnail after orientation is fixed
				if (file.status === 'attached'
					&& file.fileClass === 'image'
					&& orientation >= ORIENTATION_LEVEL
					&& thumbnail < THUMBNAIL_LEVEL
					&& !file.source // do not create thumbnails for thumbnails
				) {
					emit(['thumbnail', attachmentName], null);
				};

				// Requested work
				if (file.work) {
					for (var requestedWork in file.work) {
						var workStatus = file.work[requestedWork];
						if (null == workStatus) {
							emit([requestedWork, attachmentName], null);
						};
					};
				};
			};
		};
	};

	if (doc
		&& doc.nunaliit_upload_request
		&& doc.nunaliit_upload_request.uploadId) {
		emit(['uploadId', doc.nunaliit_upload_request.uploadId], null);
	};

	if (doc.nunaliit_geom) {
		if (doc.nunaliit_geom.simplified) {
			// Nothing to do
		} else {
			emit(['simplifyGeometry'], null);
		};
	};

	// InReach GeoPro records
	if (doc &&
		(typeof doc.Action === 'string'
			&& typeof doc.ItemType === 'string'
			&& doc.Item
			&& typeof doc.Item.TenantCode === 'string'
			&& typeof doc.Item.DeviceId === 'string'
			&& typeof doc.Item.MessageId === 'string'
		)) {
		if (typeof doc.nunaliit_schema === 'string') {
			// Nothing to do
		} else {
			emit(['inReachSubmit'], null);
		};
	};

	// inReach GarminExplore messages
	if (doc &&
		(
			typeof doc.Version === 'string'
			&& Array.isArray(doc.Events)
		)
	) {
		if (typeof doc.nunaliit_inreach === 'object'
			&& doc.nunaliit_inreach.eventDocIds
			&& Array.isArray(doc.nunaliit_inreach.eventDocIds)) {
			// Original GarminExplore message already processed
		}
		else {
			emit(['inReachSubmit'], null);
		}
	}
};