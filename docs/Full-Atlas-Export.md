# Full Atlas Export

The Nunaliit backend can export a tarball package that a user can download. This is BETA functionality currently as we gather feedback on how well it works.

Exporting requires the following steps:
1. Create export.json for ALL schemas. Make sure media files are in export
```{
        "select": "nunaliit_attachments.files",
        "type": "json"
   }
```
2. Setup install.properties adding `export.complete.user=<username>` and sensitive.properties `export.complete.password=<password>`
3. Create an export by using curl or other tool that can send a POST request:  `curl -X POST https://<username>:<password><server URL>/servlet/export/complete/export`
4. List files: `curl https://<server URL>/servlet/export/complete`
5. Save a file to disk: `curl -O http://<server URL>/servlet/export/complete/<export package file>`
