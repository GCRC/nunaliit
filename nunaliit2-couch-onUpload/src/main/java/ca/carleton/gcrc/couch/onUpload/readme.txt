Multimedia conversion
---------------------

1. Files are first submitted via the upload service. The UplaodListener accepts 
the file in the media directory and adds an attachment description structure having the 
status: "submitted".

"submitted" is a status understood to be recalling the robot.

Other information that UploadListener capture in the attachment description:
- attachmentName : name of attachment (internal name)
- originalName : name of the original file when uploaded (client name)
- submitter: name of user that uploaded file
- data : a structure with all the request parameters when file was uploaded
- original : a structure with information about the file in media directory. It has:
  - mediaFile : actual file name in media directory

If a file is uploaded directly to the database, then the file is already attached to the
document. This happens in the instance of a file that was uploaded in the iPad application
and that the database are replicated afterwards. In that case, the status is marked
as "submitted_inline". When this happens, the robot downloads the file to the media
directory, updates the status to "submitted" and removes the file from the database. This
basically restarts the first step.


2. Robot performs "submitted" work. It calls each processing plugin [getFileMetaData()] to 
find out more details about the file. If a plugin can process the file, then the robot 
updates the following fields in the attachment description:
- fileClass : string which selects the processing plugin such as "image", "audio" or "video"
- original
  - size : size of file
  - mimeType : string which is the mime type, such as "image/jpeg"
  - mimeEncoding : string which is the mime encoding, if available

At this point, the status is updated to "analyzed".


3.  Robot performs "analyzed" work. It find the appropriate plugin to perform the work and
call the plugin with performWork("analyze").

In the case of the multimedia plugin, the following work is performed:
a. file is converted according to conversion settings

b. a thumbnail is created (image and video)

c. the following attributes are added to the attachment description:
- height : integer which is height, in pixels, of image or video
- width : interger which is width, in pixels, of image or video
- conversionPerformed : boolean set to true if a conversion was required
- mediaFile : file name of converted file (or original) in the media directory
- size : size of converted file
- mimeType : mime type of converted file
- mimeEncoding : mime encoding of converted file
- thumbnail : attachment name of thumbnail, if one is created
- original
  - height
  - width

 d. a new attachment description is created for the thumbnail, if present:
 - status : "approved" or "waiting for approval"
 - fileClass : "image"
 - attachmentName : name of thumbnail
 - originalName : copy of original name
 - mediaFile : file name of thumbnail in media directory
 - source : attachment name of original image or video
 - size : size of thumbnail file
 - height : height, in pixels, of thumbnail image
 - width : width, in pixels, of thumbnail image
 - mimeType : mime type of thumbnail
 - mimeEncoding : mime encoding of thumbnail
 
 e. if the original file is to be uploaded, a new attachment description is created for it:
 - status : "approved" or "waiting for approval"
 - fileClass : copied from main attachment description
 - attachmentName : name of original attachment
 - originalName : copy of original name
 - mediaFile : file name of original file in media directory
 - source : attachment name of original file
 - size : size of original file
 - height : height, in pixels, of original image or video
 - width : width, in pixels, of original image or video
 - mimeType : mime type of original file
 - mimeEncoding : mime encoding of original file
 
 