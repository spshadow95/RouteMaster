import React, { useRef, useEffect, useState, useContext } from "react";
import "./Map.scss";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import MapboxGeocoding from "@mapbox/mapbox-sdk/services/geocoding";
import { FaArrowsAltV } from "react-icons/fa";
import { GiWideArrowDunk } from "react-icons/gi";
import { MdLocationOn } from "react-icons/md";
import { AiFillHome } from "react-icons/ai";


const Direction = () => {
    const mapContainerRef = useRef(null);
    let map=useRef(null);
    const [mapStyle, setMapStyle] = useState("mapbox://styles/mapbox/streets-v11");
    const [isFocused, setIsFocused] = useState(false);
    const [origin, setOrigin] = useState("");
    const destination = [88.3639, 22.5726];
    const [routeGeometry, setRouteGeometry] = useState(null);
    const [originCord, setOriginCord] = useState([74.76990000,17.11202000]);
    let originCoordinates = [];
    const [routeInfo, setRouteInfo] = useState([]);
    const [suggestions, setSuggestions] = useState([]);
    const [expand, setExpand] = useState(false);
    const [lati, setLat] = useState(21.14631000);
    const [lng, setLng] = useState(79.08491000);
    const initialItemCount = 4;
    const geocodingClient = MapboxGeocoding({
      accessToken: process.env.REACT_APP_MAPBOX_KEY,
    });
    useEffect(()=> {
        localStorage.setItem('mode','Driving');
    },[]);

    useEffect(() => {
        mapboxgl.accessToken=process.env.REACT_APP_MAPBOX_KEY;
        map = new mapboxgl.Map({
            container: mapContainerRef.current,
            style:mapStyle,
            center:{lon:lng, lat:lati},
            zoom: 6,
            attributionControl:false,
        });

        map.on('style.load', () => {
            const marker = new mapboxgl.Marker({
                element: document.getElementById('custom-marker')
            }).setLngLat([lng,lati]).addTo(map);
            const startMarker = new mapboxgl.Marker().setLngLat(originCord).addTo(map);
            if(routeGeometry){
                map.addSource('route',{
                    type: 'geojson',
                    data: {
                        type: 'Feature',
                        geometry: routeGeometry,
                    }
                })

                map.addLayer({
                    id:'route',
                    type:'line',
                    source:'route',
                    layout:{
                        'line-join': 'round',
                        'line-cap': 'round',
        
                    },
                    paint:{
                        'line-color': '#3b9ddd',
                        'line-width': 6,
                    }
                });
            }
            const bounds = routeGeometry.coordinates.reduce(
                (bounds,coord) => bounds.extend(coord),
                new mapboxgl.LngLatBounds()
            )
            map.fitBounds(bounds, {
                padding:50,
            })
        })
    },[mapStyle,routeGeometry])

    const handleInputChange= (event) => {
        console.log(event.target.value)
        const {value} = event.target;
        setOrigin(value);

        axios.get(`https://api.mapbox.com/geocoding/v5/mapbox.places/${value}.json`,{
            params: {
                access_token:mapboxgl.accessToken,
                autocomplete: true,
                types: ['place'],
                limit: 5,
            }
        }).then((response) =>{
            const {features} = response.data;
            setSuggestions(features);
        }).catch((error) => {
            console.log('error fetcheng autocomplete suggestions:', error);
        })
    };

    const handleSelectSuggestion = (suggestion) => {
        setOrigin(suggestion.place_name);
        setOriginCord(suggestion.center);
        setSuggestions([]);
    }
    const calcRouteDirection = async () => {
        if (origin.length > 2) {
          try {
            const origin = document.getElementById("fromAddress").value;
            if (origin.length > 2) {
              try {
                const response = await geocodingClient
                  .forwardGeocode({
                    query: origin,
                    types: ["place"],
                    limit: 1,
                  })
                  .send();
    
                const destinationCoordinates = response.body.features[0].center;
                originCoordinates = destinationCoordinates;
                setOriginCord(destinationCoordinates);
              } catch (error) {
                console.log("Error calculating directions:", error);
                throw error;
              }
            }
            console.log(originCord[0],originCord[1],destination[0],destination[1])
            const query = await fetch(
                `https://api.mapbox.com/directions/v5/mapbox/cycling/,${originCord[1]};${originCord[0]},${destination[0]},${destination[1]}?steps=true&geometries=geojson&access_token=${mapboxgl.accessToken}`,
                { method: 'GET' }
              );
    
              const json = await query.json();
              const data = json.routes[0];
              const route = data.geometry.coordinates;
              const geojson = {
                type: 'Feature',
                properties: {},
                geometry: {
                  type: 'LineString',
                  coordinates: route
                }
              };
            //setRouteInfo(routes);
            // Check if any routes are returned
            if (map.getSource('route')) {
                map.getSource('route').setData(geojson);
            //   const { distance, duration, geometry } = routes[0];
    
            //   // Valid directions, use the distance and duration for further processing
            //   const directions = {
            //     distance,
            //     duration,
            //   };
            //   localStorage.setItem("fromLocation", origin);
            //   setRouteGeometry(geometry); // Set the route geometry
            //   return directions;
            } else {
                map.addLayer({
                    id: 'route',
                    type: 'line',
                    source: {
                      type: 'geojson',
                      data: geojson
                    },
                    layout: {
                      'line-join': 'round',
                      'line-cap': 'round'
                    },
                    paint: {
                      'line-color': '#3887be',
                      'line-width': 5,
                      'line-opacity': 0.75
                    }
                  });
              // No routes found
            //   throw new Error("Unable to calculate directions");
            }
          } catch (error) {
            // Handle error
            console.log("Error calculating directions:", error);
            throw error;
          }
        }
      };
      const handleInputBlur = () => {
        // Use setTimeout to allow the click event to be registered before clearing suggestions
        setTimeout(() => {
          setIsFocused(false);
          setSuggestions([]);
        }, 200);
    };
    useEffect(() => {
        const loadwiat = async ()=> {
            if (map && routeGeometry) {
                //   map.fitBounds(routeGeometry.bounds, { padding: 20 });
              
                  await map.addLayer({
                    id: "route",
                    type: "line",
                    style:mapStyle,
                    source: {
                      type: "geojson",
                      data: {
                        type: "Feature",
                        properties: {},
                        geometry: routeGeometry,
                      },
                    },
                    layout: {
                      "line-join": "round",
                      "line-cap": "round",
                    },
                    paint: {
                      "line-color": "#00f",
                      "line-width": 4,
                    },
                  });
                }
        }
        loadwiat();

        
      }, [map, routeGeometry]);
    return (
        
        <div>
            <strong style={{ color: "white" }}>From</strong>
            <label htmlFor="fromAddress" style={{ display: "none" }}>
              From label
            </label>
            <input
              type="text"
              className={isFocused ? "input-focused" : ""}
              name="fromAddress"
              id="fromAddress"
              placeholder="Example: Bidhannagar West Bengal, India"
              value={origin}
              onChange={(e) => {
                handleInputChange(e);
              }}
              onFocus={() => setIsFocused(true)}
              //onBlur={handleInputBlur}
              autoComplete="off"
            />
            <div>
                {isFocused && suggestions.length > 0 && (
                    <div className="suggestions mx-auto text-start">
                    {suggestions.map((suggestion) => (
                        <div
                        className="suggestion-item"
                        key={suggestion.id}
                        onClick={() => handleSelectSuggestion(suggestion)}
                        >
                        {suggestion.place_name}
                        </div>
                    ))}
                    </div>
                )}
            </div>
            <div className="book_btn">
                <input
                onClick={() => calcRouteDirection()}
                type="button"
                className="btns btn-grey"
                value="Get Directions"
                />
          </div>
          <div
          ref={mapContainerRef}
          style={{
            width: "100%",
            border: "1px solid",
            marginBottom: "3rem",
            paddingtop:"2vh",
            height: "90vh",
          }}
        />
          
        </div>
    )
}
export default Direction;
