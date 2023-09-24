"use client";

import React, { useEffect, useRef } from "react";

import Map from "ol/Map";
import View from "ol/View";
import TileLayer from "ol/layer/Tile";
import OSM from "ol/source/OSM";
import { getBottomLeft, getTopRight } from "ol/extent";
import { fromLonLat, toLonLat } from "ol/proj";

import proj4 from "proj4";
import { register } from "ol/proj/proj4";

function registerAndInitializeCustomProjections() {
  proj4.defs(
    "EPSG:32719",
    "+proj=utm +zone=19 +south +ellps=WGS84 +datum=WGS84 +units=m +no_defs"
  );
  register(proj4);
}

registerAndInitializeCustomProjections();

const OLMap = () => {
  const mapRef = useRef<HTMLDivElement>(null);
  const map = useRef<Map>(null);

  useEffect(() => {
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

      console.log({ bounds });
    };

    if (!map.current) {
      const osmLayer = new TileLayer({
        source: new OSM(),
      });

      const newMap = new Map({
        target: mapRef.current || undefined,
        layers: [osmLayer],
        view: new View({
          center: fromLonLat([-70.673676, -33.448993]),
          zoom: 9,
          projection: "EPSG:3857",
        }),
      });
      // @ts-ignore
      map.current = newMap;
    }

    map.current.on("moveend", updateBounds);

    return () => {
      map.current?.un("moveend", updateBounds);
    };
  }, []);

  return (
    <div className="h-screen">
      <div ref={mapRef} className={`w-full h-full`} />
    </div>
  );
};

export default OLMap;
