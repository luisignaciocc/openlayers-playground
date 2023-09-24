"use client";

import React from "react";

import { useMap } from "@/hooks/use-map";

const OLMap = () => {
  const mapRef = useMap();

  return (
    <div className="h-screen">
      <div ref={mapRef} className={`w-full h-full`} />
    </div>
  );
};

export default OLMap;
