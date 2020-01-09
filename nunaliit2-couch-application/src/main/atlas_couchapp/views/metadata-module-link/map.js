function (doc) {
    if (doc.nunaliit_schema === 'metadata') {
        if (doc.module) {
            emit(doc._id, doc.module.doc);
        } else {
            emit(doc._id, null);
        }
    }
}