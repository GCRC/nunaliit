//
//  CouchDBAttachmentUploader.h
//
//  Created by Andrew on 19/02/2011.
//  Copyright 2011 Red Robot Studios Ltd. All rights reserved.
//


#import "CouchDBAttachmentUploader.h"

@implementation CouchDBAttachmentUploadDelegate

@synthesize successCallback, failureCallback, progressCallback, responseData, uploader;

- (id)init {
    self = [super init];
    if(self) {
        responseData = [[NSMutableData data] retain];
    }
    return self;
}

- (void)connectionDidFinishLoading:(NSURLConnection *)connection {
    // When uploading an attachment, the server answers a JSON structure
    // that looks like: { ok:true, id:"12345", rev:"2-abcdef" }
    // In the response, pass back to the script this JSON object so that it can
    // be examined by client.
    NSString *response = [[NSString alloc] initWithData:self.responseData 
                                               encoding:NSUTF8StringEncoding];
    NSString *js = [NSString stringWithFormat:@"%@(%@);",self.successCallback, response];
    [uploader writeJavascript:js];
    [response release];
}

- (void)connection:(NSURLConnection *)connection didFailWithError:(NSError *)error {
    [uploader writeJavascript:[NSString stringWithFormat:@"%@(\"%@\");", 
                              self.failureCallback, 
                              [[error localizedDescription] 
                               stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]]];
}

- (void)connection:(NSURLConnection*)connection didReceiveData:(NSData *)data {
    [responseData appendData:data];
}

- (void)connection:(NSURLConnection*)connection didSendBodyData:(NSInteger)bytesWritten totalBytesWritten:(NSInteger)totalBytesWritten totalBytesExpectedToWrite:(NSInteger)totalBytesExpectedToWrite {
    if( self.progressCallback ) {
        [uploader writeJavascript:[NSString stringWithFormat:@"%@(%d,%d);",self.progressCallback,totalBytesWritten,totalBytesExpectedToWrite]];
    }
}

- (void)dealloc {
    [successCallback release];
    [failureCallback release];
    [progressCallback release];
    [responseData release];
    [uploader release];
    [super dealloc];
}


@end;


@implementation CouchDBAttachmentUploader

- (void)upload:(NSMutableArray*)arguments withDict:(NSMutableDictionary*)options 
{
    NSUInteger argc = [arguments count];
    
	if(argc < 6) {
        NSLog(@"CouchDBAttachmentUploader called with invalid number of arguments: %d",argc);
        return; 
    }

    NSURL *filepath = [NSURL URLWithString:[arguments objectAtIndex:0]];
    NSString *couchURI = [arguments objectAtIndex:1];
    NSString *docID = [arguments objectAtIndex:2];
    NSString *docRevision = [arguments objectAtIndex:3];
    NSString *successCallback = [arguments objectAtIndex:4];
    NSString *failureCallback = [arguments objectAtIndex:5];
    NSString *progressCallback = [arguments objectAtIndex:6];
    NSString *contentType = [options valueForKey:@"contentType"];
    NSString *httpMethod = [[options valueForKey:@"method"] uppercaseString];
    NSString *attachmentName = [options valueForKey:@"attachmentName"];

    if(contentType == nil)
        contentType = @"image/jpeg";
    
    if(httpMethod == nil)
        httpMethod = @"PUT";
    
    if(attachmentName == nil)
        attachmentName = @"attachment";
    
    if (![filepath isFileURL]) {
        [self writeJavascript:[NSString stringWithFormat:@"%@(\"Invalid file\");", failureCallback]];
        return;
    }
    
    NSString *couchPath = [[NSString pathWithComponents:
                            [NSArray arrayWithObjects:couchURI, 
                             docID, attachmentName, nil]] stringByStandardizingPath];
    
    NSURL *url = [NSURL URLWithString:[NSString stringWithFormat:@"%@?rev=%@", couchPath, docRevision]];
    
    NSMutableURLRequest *req = [NSMutableURLRequest requestWithURL:url];
    [req setHTTPMethod:httpMethod];
    [req setValue:contentType forHTTPHeaderField:@"Content-Type"];
    
    if( 0 ){
        // Legacy code, kept for comparison
        NSError *error;
        NSData *data = [NSData dataWithContentsOfURL:filepath options:0 error:&error];
        if(data == nil) {
            [self writeJavascript:[NSString stringWithFormat:@"%@(\"%@\");", 
                               failureCallback, 
                               [[error localizedDescription] 
                                stringByAddingPercentEscapesUsingEncoding:NSUTF8StringEncoding]]];
        return;
        }
        [req setHTTPBody:data];
    } else {
        // Use instance of NSInputStream to read file while uploading
        
        // Get path from URL
        NSString* path = [filepath path];
        
        // Must send length or iOS-Couchbase is not able to handle
        // chunked transfer
        int fileSize = [[[NSFileManager defaultManager] attributesOfItemAtPath:path error:nil] fileSize];
        [req setValue:[NSString stringWithFormat:@"%d",fileSize] forHTTPHeaderField:@"Content-Length"];
        
        // Create stream
        NSInputStream* bodyStream = [[NSInputStream alloc] initWithFileAtPath:path];
        if( nil == bodyStream ) {
            [self writeJavascript:[NSString stringWithFormat:@"%@(\"Unable to access file path\");", 
                                failureCallback]
            ];
            return;
        }
        
        // Set stream as source for HTTP request content
        [req setHTTPBodyStream:bodyStream];
    }
    
    CouchDBAttachmentUploadDelegate *delegate = [[CouchDBAttachmentUploadDelegate alloc] init];
    delegate.uploader = self;
    delegate.successCallback = successCallback;
    delegate.failureCallback = failureCallback;
    delegate.progressCallback = progressCallback;
    
    NSURLConnection * conn = [NSURLConnection connectionWithRequest:req delegate:delegate];
    if( nil == conn ) {
        // Catch error creating a connection
        [self writeJavascript:[NSString stringWithFormat:@"%@(\"Unable to create connection\");", 
                            failureCallback]
        ];
        return;        
    }
    [delegate release];
}

@end
