function (doc) {
    if (doc.nunaliit_schema === 'atlas') {
        emit(doc._id, doc.nunaliit_atlas.title);
    }
}