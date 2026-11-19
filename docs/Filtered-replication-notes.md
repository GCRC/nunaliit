 Have a look at filtered replication in the couchdb docs. Basically you create a view that returns a list of documents and use that as a filter for your replication.

https://wiki.apache.org/couchdb/Replication#Named_Document_Replication

Note that you should install the filter on the source. You can do this by putting it in a .js file in the Nunaliit atlas site/filters folder and running a nunaliit update.

So for example, if all your public docs have a boolean attribute named “public”, you could have a filter named “public_docs.js” that contains the following code:

    function(doc, req) {
        if (doc.public) {
            return true;
        } else {
            return false;
        }
    }

You put it in your upstream (authorization only) atlas in the <atlas-dir>/site/filters folder and run a nunaliit update to push it into the DB.

Then you POST something like this to the private side /_replicate destination.
{“source”:”http://example.org/private-database”,”target”:”http://admin:password@example.org/public-database", "filter":"site/public_docs"}

And if you want it to replicate continuously, add “continuous”: true to that object before you post it. Otherwise it is a one-off replication.

There are some gotchas that I can think of (but I encourage you to read the docs). For example, when using filtered replication you should not use the DELETE method to remove documents, but instead use PUT and add a “_deleted”:true field to the document, preserving the fields required for the filter. That way the quasi-delete would propagate to the public side.