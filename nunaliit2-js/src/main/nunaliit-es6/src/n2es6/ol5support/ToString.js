/**
 * @module n2es6/ol5support/ToString
 */

import ol_geom_Geometry from 'ol/geom/Geometry';
import ol_format_WKT from 'ol/format/WKT';
import ol_proj_Projection from 'ol/proj/Projection';


//var toString;
(function(){
var WKT = new ol_format_WKT();
var toString = function (geom, srtProjCode, dstProjCode) {
		if ( typeof srtProjCode === 'undefined' 
			|| typeof srtProjCode === 'undefined'){
			return WKT.writeGeometry(geom,{});
		}
		var proj_data = new ol_proj_Projection({code: dstProjCode });
		var proj_feature = new ol_proj_Projection({code: srtProjCode});
		
		return WKT.writeGeometry(geom, {
			dataProjection: proj_data,
			featureProjection: proj_feature
		})
};
ol_geom_Geometry.prototype.toString = function(srtProjCode, dstProjCode){
	var s_code = srtProjCode; 
	var d_code = dstProjCode;
	if (typeof s_code === 'undefined'
		&& typeof d_code === 'undefined'){
		return toString(this);
	} else {
		s_code = s_code || 'EPSG:3857'
		d_code = d_code || 'EPSG:4326'
		return toString (this, s_code, d_code);
	}
	return;
	
}
})();
export default toString;
//export {to_string}