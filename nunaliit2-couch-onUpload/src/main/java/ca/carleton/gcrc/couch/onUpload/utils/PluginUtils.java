package ca.carleton.gcrc.couch.onUpload.utils;

import ca.carleton.gcrc.couch.onUpload.UploadConstants;
import ca.carleton.gcrc.couch.onUpload.conversion.AttachmentDescriptor;
import ca.carleton.gcrc.couch.onUpload.conversion.WorkDescriptor;
import ca.carleton.gcrc.couch.onUpload.parser.FileConverterFactory;
import ca.carleton.gcrc.couch.onUpload.plugin.FileConversionPlugin;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

public final class PluginUtils {

    public static boolean applyPlugin(final String workType,
                                      final AttachmentDescriptor attachmentDescriptor,
                                      final FileConverterFactory fileConverterFactory) throws Exception {

        final Logger logger = LoggerFactory.getLogger(PluginUtils.class);
        WorkDescriptor workDescription = attachmentDescriptor.getWorkDescription();
        boolean pluginFound = false;
        String fileClass = attachmentDescriptor.getFileClass();

        FileConversionPlugin plugin = fileConverterFactory.getFileConversionPlugin(fileClass);
        if (plugin != null && plugin.handlesFileClass(fileClass, workType)) {
            pluginFound = true;
            plugin.performWork(workType, attachmentDescriptor);
            logger.info("Plugin work complete: " + workType);
        }

        if (pluginFound == false) {
            workDescription.setStringAttribute(UploadConstants.UPLOAD_WORK_UPLOAD_ORIGINAL_IMAGE,
                    String.format("No plugin found for thumbnail creation, file class: %s", fileClass));
        }

        return pluginFound;
    }

}
