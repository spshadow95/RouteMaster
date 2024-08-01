import React, { useRef, useEffect, useState, useContext } from "react";
import "./Map.scss";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import MapboxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import { FaArrowsAltV } from "react-icons/fa";
import { MdLocationOn } from "react-icons/md";
import { AiFillHome } from "react-icons/ai";

mapboxgl.accessToken = process.env.REACT_APP_MAPBOX_KEY || "";

const MapContainer = () => {
  const mapContainer = useRef(null);
  const [lng, setLng] = useState(79.08491000);
  const [lat, setLat] = useState(21.14631000);
  const [zoom, setZoom] = useState(5);
  
  useEffect(() => {
    // if (map.current) return; // initialize map only once
     const map = new mapboxgl.Map({
      container: mapContainer.current || '',
      style: 'mapbox://styles/mapbox/streets-v10',
      center: [lng, lat],
      zoom: zoom
    });
  });
  return (
    <div>
      <div ref={mapContainer} className="map-container" />
    </div>
  );
}

export default MapContainer