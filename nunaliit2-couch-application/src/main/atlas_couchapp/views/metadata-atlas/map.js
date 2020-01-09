function (doc) {
    if (doc.nunaliit_schema === 'metadata' && !doc.module) {
        emit(doc._id, doc.nunaliit_metadata.name);
    }
}