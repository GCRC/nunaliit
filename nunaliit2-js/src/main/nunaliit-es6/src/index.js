import N2CouchDbSource from './n2es6/n2mapModule/N2CouchDbSource'
import N2CustomPointStyle from './n2es6/n2mapModule/N2CustomPointStyle'
import N2LayerInfo from './n2es6/n2mapModule/N2LayerInfo'
import N2LinkSource from './n2es6/n2mapModule/N2LinkSource'
import N2MapCanvas from './n2es6/n2mapModule/N2MapCanvas'
import N2MapStyles from './n2es6/n2mapModule/N2MapStyles'
import N2ModelSource from './n2es6/n2mapModule/N2ModelSource'
import N2Select from './n2es6/n2mapModule/N2Select'
import N2SourceWithN2Intent from './n2es6/n2mapModule/N2SourceWithN2Intent'
import N2StackingHistory from './n2es6/n2mapModule/N2StackingHistory'
import SettingsControl from './n2es6/n2mapModule/SettingsControl'

import N2DonutCluster from './n2es6/ol5support/N2DonutCluster'

import N2FilterableLegendWidget from './n2es6/N2FilterableLegendWidget'
import CinemapToGeoJSON from './n2es6/CinemapToGeoJSON'

const n2es6 = {};
n2es6.n2mapModule = {};
n2es6.openlayersSupport = {};
n2es6.widgets = {};

n2es6.n2mapModule.N2CouchDbSource = N2CouchDbSource;
n2es6.n2mapModule.N2CustomPointStyle = N2CustomPointStyle;
n2es6.n2mapModule.N2LayerInfo = N2LayerInfo;
n2es6.n2mapModule.N2LinkSource = N2LinkSource;
n2es6.n2mapModule.N2MapCanvas = N2MapCanvas;
n2es6.n2mapModule.N2MapStyles = N2MapStyles;
n2es6.n2mapModule.N2ModelSource = N2ModelSource;
n2es6.n2mapModule.N2Select = N2Select;
n2es6.n2mapModule.N2SourceWithN2Intent = N2SourceWithN2Intent;
n2es6.n2mapModule.N2StackingHistory = N2StackingHistory;
n2es6.n2mapModule.SettingsControl = SettingsControl;

n2es6.openlayersSupport.N2DonutCluster = N2DonutCluster;

n2es6.widgets.N2FilterableLegendWidget = N2FilterableLegendWidget;
n2es6.widgets.CinemapToGeoJSON = CinemapToGeoJSON;

export default n2es6;