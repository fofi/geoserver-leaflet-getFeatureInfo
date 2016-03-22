# geoserver-leaflet-getFeatureInfo
Plugin for leaflet based in https://gist.github.com/rclark/6908938 for personal use

Changes in GeoServer:
update in /data_dir/workspaces/ files:
  - content.ftl
  - footer.ftl (must be empty)
  - header.ftl (must be empty)


Cross-origin problem can be solved with nginx, with one of the following solutions:
  - cross origin * in headers
  - proxy pass to call geoserver throw the app site
