import { NextResponse } from "next/server";
import { DOMParser } from "xmldom";

export async function GET() {
  const url =
    "https://geowebservices.stanford.edu/geoserver/ows?service=WFS&version=1.0.0&request=GetCapabilities";
  const res = await fetch(url, {
    headers: {
      "Content-Type": "application/json",
    },
  });
  const xmlString = await res.text();

  const parser = new DOMParser();

  const xmlDoc = parser.parseFromString(xmlString, "text/xml");

  const layers = xmlDoc.getElementsByTagName("FeatureType");

  for (let i = 0; i < layers.length; i++) {
    const layer = layers[i];
    const layerNameElement = layer.getElementsByTagName("Name")[0];
    const layerName = layerNameElement.textContent;

    if (layerName === "druid:mz047dz0617") {
      const nameElement = layer.getElementsByTagName("Name")[0];
      const name = nameElement.textContent;
      const titleElement = layer.getElementsByTagName("Title")[0];
      const title = titleElement.textContent;
      const abstractElement = layer.getElementsByTagName("Abstract")[0];
      const abstract = abstractElement.textContent;
      const keywordsElement = layer.getElementsByTagName("Keywords")[0];
      const keywords = keywordsElement.textContent;
      const srsElement = layer.getElementsByTagName("SRS")[0];
      const srs = srsElement.textContent;
      const latLongBoundingBoxElement =
        layer.getElementsByTagName("LatLongBoundingBox")[0];
      const latLongBoundingBox = latLongBoundingBoxElement.textContent;
      return NextResponse.json({
        name,
        title,
        abstract,
        keywords,
        srs,
        latLongBoundingBox,
      });
    }
  }

  return NextResponse.json({
    status: false,
  });
}
