package ca.carleton.gcrc.couch.export;

import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Calendar;
import java.util.HashSet;
import java.util.Set;

import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

import org.json.JSONObject;

import org.apache.commons.compress.archivers.tar.TarArchiveEntry;
import org.apache.commons.compress.archivers.tar.TarArchiveOutputStream;
import org.apache.commons.compress.compressors.gzip.GzipCompressorOutputStream;
import org.apache.commons.io.FileUtils;
import org.apache.commons.io.IOUtils;

import ca.carleton.gcrc.couch.client.CouchDb;
import ca.carleton.gcrc.couch.client.CouchDesignDocument;
import ca.carleton.gcrc.couch.client.CouchQuery;
import ca.carleton.gcrc.couch.client.CouchQueryResults;
import ca.carleton.gcrc.couch.export.impl.DocumentRetrievalSchema;
import ca.carleton.gcrc.couch.export.impl.ExportFormatGeoJson;
import ca.carleton.gcrc.couch.export.impl.SchemaCacheCouchDb;

public class ExportFullAtlas {
	final protected Logger logger = LoggerFactory.getLogger(this.getClass());
	private CouchDesignDocument dd;
	private String atlasRootPath;
	private CouchDb couchDb;

	public ExportFullAtlas(String realRootPath, CouchDb couchDb) throws Exception {
		this.couchDb = couchDb;
		dd = couchDb.getDesignDocument("atlas");
		atlasRootPath = realRootPath;
	}

	public void createExport() {
		File exportDir = getExportDir();
		exportData(exportDir);
		exportMedia(exportDir);

		try {
			compress(exportDir.getAbsolutePath() + ".tar.gz", exportDir);
		} catch (IOException e) {
			logger.error("Error writing export tar.gz", e);
		}
		try {
			FileUtils.deleteDirectory(exportDir);
		} catch (IOException e) {
			logger.error("Error deleting export directory " + exportDir.getAbsolutePath() + " after compressing", e);
		}
	}

	private File getExportDir() {
		File exportDir = null;
		{
			Calendar calendar = Calendar.getInstance();
			String name = String.format(
					"export_%04d-%02d-%02d-%02d_%02d-%02d", calendar.get(Calendar.YEAR),
					(calendar.get(Calendar.MONTH) + 1), calendar.get(Calendar.DAY_OF_MONTH),
					calendar.get(Calendar.HOUR_OF_DAY), calendar.get(Calendar.MINUTE), calendar.get(Calendar.SECOND));
			exportDir = new File(atlasRootPath, "dump/" + name);
			exportDir.mkdirs();
		}
		logger.debug("Writing export " + exportDir.getAbsolutePath());
		return exportDir;
	}

	private void exportData(File exportDir) {
		// Find schemas that need to be exported
		CouchQuery query = new CouchQuery();
		query.setViewName("schemas");
		CouchQueryResults results;
		try {
			query.setIncludeDocs(false);
			results = dd.performQuery(query);
		} catch (Exception e) {
			logger.error("Error querying DB for schemas", e);
			return;
		}

		Set<String> schemas = new HashSet<String>();
		for (JSONObject row : results.getRows()) {
			String docId = row.optString("id");
			String key = row.optString("key");
			if (null != docId && !docId.startsWith("org.nunaliit")) {
				schemas.add(key);
			}
		}

		logger.debug("Fetching data for schemas: ", schemas);

		// Loop over schemas and export docs to GeoJSON
		try {
			for (String schemaName : schemas) {
				// CouchQuery queryBySchema = new CouchQuery();
				// queryBySchema.setViewName("nunaliit-schema");
				// queryBySchema.setStartKey(schemaName);
				// queryBySchema.setEndKey(schemaName);
				// queryBySchema.setIncludeDocs(false);

				// CouchQueryResults resultBySchema = dd.performQuery(queryBySchema);

				// Set<String> ids = new HashSet<String>();
				// for(JSONObject row : resultBySchema.getRows()){
				// String docId = row.optString("id");
				// if( null != docId ) {
				// ids.add(docId);
				// }
				// }

				// Build doc retrieval based on method
				DocumentRetrieval docRetrieval = null;
				docRetrieval = DocumentRetrievalSchema.create(couchDb, schemaName);

				ExportFormat outputFormat;
				SchemaCache schemaCache = new SchemaCacheCouchDb(couchDb);
				outputFormat = new ExportFormatGeoJson(schemaCache, docRetrieval);

				File outputFile = new File(exportDir, schemaName + ".geojson");
				outputFile.createNewFile();
				FileOutputStream fos = new FileOutputStream(outputFile);
				outputFormat.outputExport(fos);
				fos.close();
			}
		} catch (Exception e) {
			logger.error("Error fetching schema docs and writing results", e);
			return;
		}
	}

	private void exportMedia(File exportDir) {
		String mediaDir = new File(atlasRootPath, "media").getAbsolutePath();
		String exportDirPath = exportDir.getAbsolutePath() + "/media";
		try {
			Files.walk(Paths.get(mediaDir)).forEach(source -> {
				Path destination = Paths.get(exportDirPath, source.toString()
						.substring(mediaDir.length()));
				try {
					Files.copy(source, destination);
				} catch (IOException e) {
					logger.error("Error copying file: " + source + " to dest: " + destination, e);
				}

			});
		} catch (IOException e) {
			logger.error("Error copying media directoy for export", e);
		}
	}

	private void compress(String name, File... files) throws IOException {
		try (TarArchiveOutputStream out = getTarArchiveOutputStream(name)) {
			for (File file : files) {
				addToArchiveCompression(out, file, ".");
			}
		}
	}

	private TarArchiveOutputStream getTarArchiveOutputStream(String name) throws IOException {
		TarArchiveOutputStream taos = new TarArchiveOutputStream(
				new GzipCompressorOutputStream(new FileOutputStream(name)));
		// TAR has an 8 gig file limit by default, this gets around that
		taos.setBigNumberMode(TarArchiveOutputStream.BIGNUMBER_STAR);
		// TAR originally didn't support long file names, so enable the support for it
		taos.setLongFileMode(TarArchiveOutputStream.LONGFILE_GNU);
		taos.setAddPaxHeadersForNonAsciiNames(true);
		return taos;
	}

	private void addToArchiveCompression(TarArchiveOutputStream out, File file, String dir) throws IOException {
		String entry = dir + File.separator + file.getName();
		if (file.isFile()) {
			out.putArchiveEntry(new TarArchiveEntry(file, entry));
			try (FileInputStream in = new FileInputStream(file)) {
				IOUtils.copy(in, out);
			}
			out.closeArchiveEntry();
		} else if (file.isDirectory()) {
			File[] children = file.listFiles();
			if (children != null) {
				for (File child : children) {
					addToArchiveCompression(out, child, entry);
				}
			}
		} else {
			System.out.println(file.getName() + " is not supported");
		}
	}
}
