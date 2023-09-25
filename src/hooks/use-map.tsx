"use client";

import { getBottomLeft, getTopRight } from "ol/extent";
import { GeoJSON } from "ol/format";
import Draw from "ol/interaction/Draw";
import TileLayer from "ol/layer/Tile";
import VectorLayer from "ol/layer/Vector";
import { bbox } from "ol/loadingstrategy";
import Map from "ol/Map";
import { fromLonLat, toLonLat } from "ol/proj";
import { register } from "ol/proj/proj4";
import OSM from "ol/source/OSM";
import TileWMS from "ol/source/TileWMS";
import VectorSource from "ol/source/Vector";
import { Stroke, Style } from "ol/style";
import View from "ol/View";
import proj4 from "proj4";
import { useEffect, useRef } from "react";

function registerAndInitializeCustomProjections() {
  proj4.defs(
    "EPSG:32719",
    "+proj=utm +zone=19 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs"
  );
  register(proj4);
}

export const useMap = () => {
  registerAndInitializeCustomProjections();

  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<Map>(null);

  useEffect(() => {
    if (!map.current) {
      const newMap = new Map({
        target: mapRef.current || undefined,
        view: new View({
          center: fromLonLat([-70.673676, -33.448993]),
          zoom: 9,
          projection: "EPSG:3857",
        }),
      });

      const raster = new TileLayer({
        source: new OSM(),
      });
      newMap.addLayer(raster);

      const geoServerUrl = "https://geowebservices.stanford.edu/geoserver/ows";
      const geoServerLayer = "druid:vc995kj1553";
      const wmsLayer = new TileLayer({
        source: new TileWMS({
          url: geoServerUrl,
          params: {
            LAYERS: geoServerLayer,
            TILED: true,
          },
          serverType: "geoserver",
        }),
      });
      newMap.addLayer(wmsLayer);

      const wfsLayer = new VectorLayer({
        source: new VectorSource({
          format: new GeoJSON(),
          url: function (extent) {
            return (
              "	https://geowebservices.stanford.edu/geoserver/wfs?service=WFS&" +
              "version=1.1.0&request=GetFeature&typename=druid:mz047dz0617&" +
              "outputFormat=application/json&srsname=EPSG:3857&" +
              "bbox=" +
              extent.join(",") +
              ",EPSG:3857"
            );
          },
          strategy: bbox,
        }),
        style: new Style({
          stroke: new Stroke({
            color: "rgba(0, 0, 255, 1.0)",
            width: 2,
          }),
        }),
      });
      newMap.addLayer(wfsLayer);

      const drawSource = new VectorSource({ wrapX: false });
      const drawLayer = new VectorLayer({
        source: drawSource,
      });
      newMap.addLayer(drawLayer);
      const draw = new Draw({
        source: drawSource,
        type: "Polygon",
      });
      newMap.addInteraction(draw);
      draw.on("drawend", function (event) {
        newMap.removeInteraction(draw);
        const createdProjectFeature = event.feature;
        const drawnPolygonGeometry = createdProjectFeature.getGeometry();
        if (!drawnPolygonGeometry) return;
        const geojsonFormat = new GeoJSON();
        const drawnPolygonGeoJSON = geojsonFormat.writeGeometryObject(
          drawnPolygonGeometry,
          {
            featureProjection: "EPSG:3857",
          }
        );
        const coordinates = drawnPolygonGeoJSON.coordinates[0]
          .map((coordinate: number[]) => coordinate.reverse().join(" "))
          .join(", ");
        const cqlFilter = `WITHIN(geom, POLYGON((${coordinates})))`;

        const wfsSourceNew = new VectorSource({
          format: new GeoJSON({
            dataProjection: "EPSG:3857",
            featureProjection: "EPSG:3857",
          }),
          url:
            "https://geowebservices.stanford.edu/geoserver/wfs?service=WFS&" +
            "version=1.1.0&request=GetFeature&typename=druid:mz047dz0617&" +
            "outputFormat=application/json" +
            `&CQL_FILTER=${cqlFilter}`,
        });
        const wfsLayerNew = new VectorLayer({
          source: wfsSourceNew,
          style: wfsLayer.getStyle(),
        });
        newMap.addLayer(wfsLayerNew);
        newMap.removeLayer(wfsLayer);
      });

      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore
      map.current = newMap;
    }

    const updateBounds = () => {
      const currentMap = map.current;
      if (!currentMap) return;
      const extent = currentMap.getView().calculateExtent(currentMap.getSize());
      const bottomLeft = toLonLat(getBottomLeft(extent));
      const topRight = toLonLat(getTopRight(extent));

      const bounds = {
        southWest: { lat: bottomLeft[1], lng: bottomLeft[0] },
        northEast: { lat: topRight[1], lng: topRight[0] },
      };

      // eslint-disable-next-line no-console
      console.log({ bounds });
    };

    map.current.on("moveend", updateBounds);

    return () => {
      map.current?.un("moveend", updateBounds);
    };
  }, []);

  return mapRef;
};
