/**
* @module n2es6/models/N2EndpointModel
*/

/**
 * @classdesc
 * A model that obtains data from the Nunaliit endpoint servlet,
 * which applies custom transformation functions to the data
 * on the server before it is sent to the client.
 * @api
 */
class N2EndpointModel {
    constructor(options) {
        this.DH = "N2EndpointModel"
        this.URL = "./servlet/endpoint"
        this.dispatchService = options.dispatchService
        if (!this.dispatchService) {
            throw new Error("dispatchService must be provided")
        }
        this.modelId = options.modelId
        if (!this.modelId) {
            throw new Error("modelId must be provided")
        }

        this.schemas = options.schemas
        this.layers = options.layers
        this.siteViews = options.siteViews
        this.transformName = options.transformName
        if (this.schemas?.length === 0 && this.layers?.length === 0 && this.siteViews?.length === 0) {
            throw new Error("At least one schema, layer, or site view must be provided")
        }

        if (!this.transformName) {
            throw new Error("A name of a transform script must be provided")
        }
        if (this.transformName.trim() === '') {
            throw new Error("The name of the transform script must not be empty")
        }

        this.cacheByDocId = new Map()
        this.loadingCount = 0

        this._performDispatcherSetup()

        this.load()
    }

    _performDispatcherSetup() {
        this.dispatchHandler = (message, addr, dispatcher) => {
            this._handle(message, addr, dispatcher)
        }

        this.dispatchService.register(this.DH, "modelStateUpdated", this.dispatchHandler)
        this.dispatchService.register(this.DH, 'documentContentCreated', this.dispatchHandler)
        this.dispatchService.register(this.DH, 'documentContentUpdated', this.dispatchHandler)
        this.dispatchService.register(this.DH, 'documentDeleted', this.dispatchHandler)
        this.dispatchService.register(this.DH, 'documentVersion', this.dispatchHandler)
        this.dispatchService.register(this.DH, 'cacheRetrieveDocument', this.dispatchHandler)
        this.dispatchService.register(this.DH, 'modelGetInfo', this.dispatchHandler)
        this.dispatchService.register(this.DH, 'modelGetState', this.dispatchHandler)
    }

    isLoading() {
        return (this.loadingCount > 0)
    }

    _handle(m, addr, dispatcher) {
        const docId = m.docId
        if ('documentContentCreated' === m.type
            || 'documentContentUpdated' === m.type) {
            if (m.doc) {
                if (this.cacheByDocId.has(docId)) {
                    this.cacheByDocId.set(docId)
                }
                this.load()
            }
        } else if ('documentDeleted' === m.type) {
            if (this.cacheByDocId.has(docId)) {
                const docToBeDeleted = this.cacheByDocId.get(docId)
                this.cacheByDocId.delete(docId)
                this._reportStateUpdate([], [][docToBeDeleted])
            }
        } else if ('documentVersion' === m.type) {
            const cachedDoc = this.cacheByDocId.get(docId)
            if (cachedDoc
                && cachedDoc._rev !== m.rev) {
                this.cacheByDocId.delete(docId)
            }
        } else if ('cacheRetrieveDocument' === m.type) {
            const cachedDoc = this.cacheByDocId.get(docId)
            if (cachedDoc) {
                m.doc = cachedDoc
            }
        } else if ('modelGetInfo' === m.type) {
            if (m.modelId === this.modelId) {
                m.modelInfo = {
                    modelId: this.modelId
                    , modelType: 'endpointSource'
                    , parameters: {}
                    , _instance: this
                }
            }
        } else if ('modelGetState' === m.type) {
            if (m.modelId === this.modelId) {
                m.state = {
                    added: Array.from(this.cacheByDocId.values())
                    , updated: []
                    , removed: []
                    , loading: this.isLoading()
                }
            }
        }
    }

    load() {
        ++this.loadingCount
        const queryParams = new URLSearchParams()

        if (this?.schemas?.length) {
            this.schemas.forEach(schema => {
                queryParams.append('schema', schema)
            })
        }
        if (this?.layers?.length) {
            this.layers.forEach(layer => {
                queryParams.append('layer', layer)
            })
        }
        if (this?.siteViews?.length) {
            this.siteViews.forEach(siteView => {
                queryParams.append('siteView', siteView)
            })
        }
        queryParams.append('transform', this.transformName)

        $.ajax({
            url: this.URL
            , type: 'GET'
            , async: true
            , data: queryParams.toString()
            , dataType: 'json'
            , success: (res) => {
                --this.loadingCount
                this.evaluateDocumentDifferences(res)
            }
            , error: (XMLHttpRequest, textStatus, errorThrown) => {
                $n2.logError(JSON.parse(XMLHttpRequest.responseText).message)
                --this.loadingCount
                this._reportStateUpdate([], [], [])
            }
        })
    }

    evaluateDocumentDifferences(res) {
        const added = []
        const updated = []
        const removed = []
        if (res.data) {
            const data = res.data
            data.forEach(incomingDoc => {
                const incomingDocId = incomingDoc._id
                if (this.cacheByDocId.has(incomingDocId)) {
                    const cachedDoc = this.cacheByDocId.get(incomingDocId)
                    // The revisions do not match. Take the incoming one
                    if (cachedDoc._rev !== incomingDoc._rev) {
                        this.cacheByDocId.set(incomingDocId, incomingDoc)
                        updated.push(incomingDoc)
                    }
                    // If they do match, then nothing changed and do nothing
                }
                else {
                    // Never seen the document before. Add it.
                    this.cacheByDocId.set(incomingDocId, incomingDoc)
                    added.push(incomingDoc)
                }
            })
        }
        this._reportStateUpdate(added, updated, removed)
    }

    _reportStateUpdate(added, updated, removed) {
        this.dispatchService.send(this.DH, {
            type: 'modelStateUpdated'
            , modelId: this.modelId
            , state: {
                added: added
                , updated: updated
                , removed: removed
                , loading: this.isLoading()
            }
        })
    }
}

export function modelCreate(m) {
    if ('endpointSource' === m.modelType) {
        let options = {}
        options.modelId = m.modelId
        if (m.modelOptions) {
            options = { ...m.modelOptions }
        }

        if (m?.config?.directory) {
            options.dispatchService = m.config.directory.dispatchService
        }

        m.model = new N2EndpointModel(options)
        m.created = true
    }
}

nunaliit2.endpointModel = {
    N2EndpointModel: N2EndpointModel,
    modelCreate: modelCreate
};

export default N2EndpointModel;
