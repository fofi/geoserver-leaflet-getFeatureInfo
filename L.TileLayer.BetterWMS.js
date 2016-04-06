// Plugin start
L.TileLayer.BetterWMS = L.TileLayer.WMS.extend({
  
  onAdd: function (map) {
    // Triggered when the layer is added to a map.
    //   Register a click listener, then do all the upstream WMS things
    L.TileLayer.WMS.prototype.onAdd.call(this, map);
    map.on('click', this.getFeatureInfo, this);
  },
  
  onRemove: function (map) {
    // Triggered when the layer is removed from a map.
    //   Unregister a click listener, then do all the upstream WMS things
    L.TileLayer.WMS.prototype.onRemove.call(this, map);
    map.off('click', this.getFeatureInfo, this);
  },
  
  getFeatureInfo: function (evt) {
    // Make an AJAX request to the server and hope for the best
    var url = this.getFeatureInfoUrl(evt.latlng),
        showResults = L.Util.bind(this.showGetFeatureInfo, this);
    $.ajax({
      url: url,
      success: function (data, status, xhr) {
        var err = typeof data === 'string' ? null : data;

        // geoserver json comes as string
        data = JSON.parse(data);

        //parse url to get the requested style
        var url_data = JSON.parse('{"' + this.url.replace(/&/g, '","').replace(/=/g,'":"') + '"}');
        var style = url_data.STYLES;

        // define your html popup
        var html = 
        '<div class="tiles-popup-arrow"> <i class="fa fa-caret-down fa-2x"></i></div>' +
        '<div class="tiles-popup">'+
            '<div class="content">' +    
                '<h1>' + names[style] + '</h1>' +
                '<h2>' + filter_value(data[style],style) + '</h2>' +
            '</div>' +
        '</div>';

        showResults(err, evt.latlng, html);
      },
      error: function (xhr, status, error) {
        showResults(error);  
      }
    });
  },
  
  getFeatureInfoUrl: function (latlng) {
    // Construct a GetFeatureInfo request URL given a point
    var point = this._map.latLngToContainerPoint(latlng, this._map.getZoom()),
        size = this._map.getSize(),
        
        params = {
          request: 'GetFeatureInfo',
          service: 'WMS',
          srs: 'EPSG:4326',
          styles: this.wmsParams.styles,
          transparent: this.wmsParams.transparent,
          version: this.wmsParams.version,      
          format: this.wmsParams.format,
          bbox: this._map.getBounds().toBBoxString(),
          height: size.y,
          width: size.x,
          layers: this.wmsParams.layers,
          query_layers: this.wmsParams.layers,
          info_format: 'text/html'
        };
    
    params[params.version === '1.3.0' ? 'i' : 'x'] = point.x;
    params[params.version === '1.3.0' ? 'j' : 'y'] = point.y;
    
    return this._url + L.Util.getParamString(params, this._url, true);
  },
  
  showGetFeatureInfo: function (err, latlng, content) {
    if (err) { console.log(err); return; } // do nothing if there's an error
    
    // Otherwise show the content in a popup, or something.
    L.popup({ maxWidth: 800,className:'tiles-popup-mega'})
      .setLatLng(latlng)
      .setContent(content)
      .openOn(this._map);
  }
});

L.tileLayer.betterWms = function (url, options) {
  return new L.TileLayer.BetterWMS(url, options);  
};

// names to display instead of layer column name (translation)
// future, use angularjs $compile inside function
var names = {
  pob_total: 'Total population',
  kids_h: 'Male kids 0-9',
  teen_h: 'Male teenagers 10-19',
  young_h: 'Male youths 20-34',
  adults_h: 'Male adults 35-49',
  mature_h: 'Male mature 50-65',
  elderly_h: 'Male elderly >65',
  kids_m:  'Female kids 0-9',
  teen_m: 'Female teenagers 10-19',
  young_m: 'Female youths 20-34',
  adults_m: 'Female adults 35-49',
  mature_m: 'Female mature 50-65',
  elderly_m: 'Female elderly >65',
  kids_t: 'Total kids 0-9',
  teen_t: 'Total teenagers 10-19',
  young_t: 'Total youths 20-34',
  adults_t: 'Total adults 35-49',
  mature_t: 'Total mature 50-65',
  elderly_t: 'Total elderly >65',
  age_rate: 'Aging index',
  dep_rate: 'Dependency rate',
  young_rate: 'Youth dependency rate',
  elder_rate: 'Elderly dependency rate',
  density_po: 'Population density',
  foreigner: 'Foreigners rate',
  wealth: 'Wealth',
  unemploy: 'Unemployment',
  num_comer: 'Number of commercial premises',
  met_comer: 'Commercial area per inhabitant',
  comer_act: 'Active commercial'
};

// wealth filter
var wealth_range = function(wealth) {
  var rounded = 0;
  if(wealth>0){
      var wealth_length = 100;
      rounded = Math.round(wealth/wealth_length)*wealth_length;
  }
  return rounded +'€';
};

// filter value in order to adapt it (eg: add %,..)
var filter_value =  function(number,variable_name) {
  var percent_vars = ['unemploy', 'age_rate', 'dep_rate', 'foreigner','young_rate','elder_rate']; // vars that need * 100
  var with_percent = ['unemploy','foreigner'];
  var people_vars = ['pob_total', 'kids_h ', 'teen_h ', 'young_h ', 'adults_h ', 'mature_h ', 'elderly_h', 'kids_m', 'teen_m ', 'young_m ', 'adults_m ', 'mature_m ', 'elderly_m', 'kids_t ', 'teen_t ', 'young_t ', 'adults_t ', 'mature_t ', 'elderly_t']; // vars related to population to add the word people after the number
  var result = parseInt(number);
  if (percent_vars.indexOf(variable_name) !== -1 ){
    result = (number*100);
    if (with_percent.indexOf(variable_name) !== -1 ){
      result = result.toFixed(1);
      result = result + '%';  
    } else {
      result = result.toFixed(0);
    }
  } else if (people_vars.indexOf(variable_name) !== -1 ){ // If variable_name is one of the population variables
    result = result.toFixed(0);
    result = result + '<small> people</small>';
  } else if ( variable_name === 'density_po' ){
    result = result.toFixed(0);
    result = result + '<small> pop/km²</small>';
  } else if ( variable_name === 'wealth' ){
    result = '<small>'+wealth_range(result)+' </small>';
  } else if (number<10){
    result = result.toFixed(1);
  } else {
    result = result.toFixed(0);
  }
  return result;
};
