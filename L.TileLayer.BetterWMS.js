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
                '<h1>{{"'+style+'"| variableDescription}}</h1>' +
                '<h2>{{'+data[style]+'| variableValue:"'+style+'"}} <small>{{"'+style+ '"| variableUnit}}</small></h2>' +
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

      // compile angular html code
      angular.element(document).injector().invoke(function($compile,$timeout) {
        var $div = document.getElementsByClassName("tiles-popup-mega");
        var scope = angular.element($div).scope();

        // wait for popup
        $timeout(function() {
          $compile($div)(scope);
        }, 0);
      });

  }
});

L.tileLayer.betterWms = function (url, options) {
  return new L.TileLayer.BetterWMS(url, options);  
};
