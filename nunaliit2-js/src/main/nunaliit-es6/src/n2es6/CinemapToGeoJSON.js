/**
* @module n2es6/CinemapToGeoJSON
*/

/**
 * @classdesc
 * Converts an atlascine_cinemap schema to a GeoJSON format.
 * @api
 */
class CinemapToGeoJSON {
    constructor(options) {
        if (!options.dispatch) return;
        if (!options.cinemap) return;
        this.dispatch = options.dispatch;
        this.export = null;
        this.origin = "CinemapToGeoJSONExport";

        this.dispatch.register(this.origin,
            "PlaceUtility--replyPlaceDocIdMap",
            (message) => {
                const places = message.map;
                const fullExport = CinemapToGeoJSON.generateFeatures(
                    this.export,
                    places
                );
                this.saveTemplateAsFile(
                    `${options.cinemap._id}.geojson`,
                    fullExport
                );
            }
        );

        this.export = CinemapToGeoJSON.generateBaseExport(options.cinemap);
        this.dispatch.send(this.origin, {
            type: "PlaceUtility--getPlaceDocIdMap"
        });
    }

    static generateBaseExport(doc) {
        const {
            description
            , title
            , media_doc_ref
            , timeLinks
            , settings: {
                globalDefaultPlaceZoomLevel
                , globalInitialMapExtent
                , globalScaleFactor
                , globalTimeOffset
            }
        } = doc.atlascine_cinemap;

        const baseExport = {
            type: "FeatureCollection"
            , atlas: window.location.origin
            , description
            , globalDefaultPlaceZoomLevel
            , globalInitialMapExtent
            , globalScaleFactor
            , globalTimeOffset
            , id: doc._id
            , media_doc_ref: media_doc_ref.doc
            , timeLinks
            , title
        }
        return baseExport;
    }

    static generateFeatures(baseExport, places) {
        if (!baseExport) return;
        if (!places) return;
        const timeLinks = baseExport.timeLinks;
        const features = [];
        timeLinks.forEach((line, index) => {
            const tags = line.tags.map(tag => {
                delete tag.chipText;
                return tag;
            });
            // decide here if generating multipoint or points
            // need to .trim().toLowerCase() to match in places
            const geometry = {};
            const feature = {
                type: "Feature"
                , id: index
            };
            features.push(feature);
        });
        delete baseExport.timeLinks;
        baseExport.features = features;
        return baseExport;
    }

    // https://stackoverflow.com/a/65939108
    saveTemplateAsFile(filename, dataObjToWrite) {
        const blob = new Blob([JSON.stringify(dataObjToWrite)], { type: "text/json" });
        const link = document.createElement("a");

        link.download = filename;
        link.href = window.URL.createObjectURL(blob);
        link.dataset.downloadurl = ["text/json", link.download, link.href].join(":");

        const evt = new MouseEvent("click", {
            view: window,
            bubbles: true,
            cancelable: true,
        });

        link.dispatchEvent(evt);
        link.remove()
    }
}

nunaliit2.exports = {
    CinemapToGeoJSON: CinemapToGeoJSON
}

export default CinemapToGeoJSON;
