function(doc){
	if( doc 
	 && typeof doc.Action === 'string'
	 && typeof doc.ItemType === 'string'
	 && doc.Item
	 && typeof doc.Item.TenantCode === 'string'
	 && typeof doc.Item.DeviceId === 'string'
	 && typeof doc.Item.MessageId === 'string' ){
		
		emit(doc._id, {
			MessageType: doc.Item.MessageType
			,Message: doc.Item.Message
		});
	};
}