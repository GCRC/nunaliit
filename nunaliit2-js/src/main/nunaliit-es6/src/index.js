import N2CouchDbSource from './n2es6/n2mapModule/N2CouchDbSource'
import N2CustomLineStyle from './n2es6/n2mapModule/N2CustomLineStyle'
import N2CustomPointStyle from './n2es6/n2mapModule/N2CustomPointStyle'
import N2LayerInfo from './n2es6/n2mapModule/N2LayerInfo'
import N2MapCanvas from './n2es6/n2mapModule/N2MapCanvas'
import N2MapScale from './n2es6/n2mapModule/N2MapScale'
import N2MapSpy from './n2es6/n2mapModule/N2MapSpy'
import N2MapStyles from './n2es6/n2mapModule/N2MapStyles'
import N2ModelSource from './n2es6/n2mapModule/N2ModelSource'
import N2Select from './n2es6/n2mapModule/N2Select'
import N2SourceWithN2Intent from './n2es6/n2mapModule/N2SourceWithN2Intent'
import N2StackingHistory from './n2es6/n2mapModule/N2StackingHistory'

import N2DonutCluster from './n2es6/ol5support/N2DonutCluster'

import N2FilterableLegendWidget from './n2es6/widgets/N2FilterableLegendWidget'
import N2ModelExportWidget from './n2es6/widgets/N2ModelExportWidget'

const n2es6 = {};
n2es6.n2mapModule = {};
n2es6.ol5support = {};
n2es6.widgets = {};

n2es6.n2mapModule.N2CouchDbSource = N2CouchDbSource;
n2es6.n2mapModule.N2CustomLineStyle = N2CustomLineStyle;
n2es6.n2mapModule.N2CustomPointStyle = N2CustomPointStyle;
n2es6.n2mapModule.N2LayerInfo = N2LayerInfo;
n2es6.n2mapModule.N2MapCanvas = N2MapCanvas;
n2es6.n2mapModule.N2MapScale = N2MapScale;
n2es6.n2mapModule.N2MapSpy = N2MapSpy;
n2es6.n2mapModule.N2MapStyles = N2MapStyles;
n2es6.n2mapModule.N2ModelSource = N2ModelSource;
n2es6.n2mapModule.N2Select = N2Select;
n2es6.n2mapModule.N2SourceWithN2Intent = N2SourceWithN2Intent;
n2es6.n2mapModule.N2StackingHistory = N2StackingHistory;
n2es6.ol5support.N2DonutCluster = N2DonutCluster;
n2es6.widgets.N2FilterableLegendWidget = N2FilterableLegendWidget;
n2es6.widgets.N2ModelExportWidget = N2ModelExportWidget;

export default n2es6;