/**
 * @module n2es6/N2StadiaMapsFactory
 */

import XYZ from 'ol/source/XYZ';

const STADIA_MAPS_URL_TEMPLATE = (layer, pixelRatio, extension) => {
	return `https://tiles.stadiamaps.com/tiles/${layer}/{z}/{x}/{y}${pixelRatio > 1 ? "@"+pixelRatio+"x" : ""}.${extension}`
}

const N2StadiaMapsFactory = (layerName) => {
    if (layerName === "alidade_smooth") {
        return new XYZ({
            url: STADIA_MAPS_URL_TEMPLATE(layerName, 2, "png"),
            attributions: [
                '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
                '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
                '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>'
              ],
              tilePixelRatio: 2,
              maxZoom: 20
        })
    }
    else if (layerName === "alidade_smooth_dark") {
        return new XYZ({
            url: STADIA_MAPS_URL_TEMPLATE(layerName, 2, "png"),
            attributions: [
                '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
                '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
                '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>'
              ],
              tilePixelRatio: 2,
              maxZoom: 20
        })
    }
    else if (layerName === "outdoors") {
        return new XYZ({
            url: STADIA_MAPS_URL_TEMPLATE(layerName, 2, "png"),
            attributions: [
                '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
                '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
                '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>'
              ],
              tilePixelRatio: 2,
              maxZoom: 20
        })
    }
    else if (layerName === "stamen_toner") {
        return new XYZ({
            url: STADIA_MAPS_URL_TEMPLATE(layerName, 2, "png"),
            attributions: [
                '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
                '&copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>',
                '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
                '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>'
              ],
              tilePixelRatio: 2,
              maxZoom: 20
        })
    }
    else if (layerName === "stamen_terrain") {
        return new XYZ({
            url: STADIA_MAPS_URL_TEMPLATE(layerName, 2, "png"),
            attributions: [
                '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
                '&copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>',
                '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
                '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>'
              ],
              tilePixelRatio: 2,
              maxZoom: 20
        })
    }
    else if (layerName === "stamen_watercolor") {
        return new XYZ({
            url: STADIA_MAPS_URL_TEMPLATE(layerName, 1, "jpg"),
            attributions: [
                '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
                '&copy; <a href="https://stamen.com/" target="_blank">Stamen Design</a>',
                '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
                '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>'
              ],
              tilePixelRatio: 1,
              maxZoom: 16
        })
    }
    else if (layerName === "osm_bright") {
        return new XYZ({
            url: STADIA_MAPS_URL_TEMPLATE(layerName, 2, "png"),
            attributions: [
                '&copy; <a href="https://www.stadiamaps.com/" target="_blank">Stadia Maps</a>',
                '&copy; <a href="https://openmaptiles.org/" target="_blank">OpenMapTiles</a>',
                '&copy; <a href="https://www.openstreetmap.org/about/" target="_blank">OpenStreetMap contributors</a>'
            ],
            tilePixelRatio: 2,
            maxZoom: 20
        })
    }
    else {
        $n2.reportErrorForced(`${layerName} is not an accepted/implemented layer name for Stadia backgrounds.`)
    }
}

export default N2StadiaMapsFactory;