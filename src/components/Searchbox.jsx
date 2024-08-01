import { useRef, useEffect, useState } from "react";
import { Geocoder } from "@mapbox/search-js-react";
import { AddressAutofill } from "@mapbox/search-js-react";
import mapboxgl from "mapbox-gl";
import "mapbox-gl/dist/mapbox-gl.css";
import axios from "axios";
import './style.css';

const accessToken = process.env.REACT_APP_MAPBOX_KEY;

export default function MapWithGeocoder() {
  const mapContainerRef = useRef();
  const mapInstanceRef = useRef();
  const [, setMapLoaded] = useState(false);
  const [destiValue, setDestiValue] = useState("");
  const [startValue, setStartValue] = useState("");
  const [destcoord, setDestcoord] = useState([]);
  const [startcoord, setStartcoord] = useState([]);
  const [place, setPlace] = useState('');
  const [vehicleCount, setVehicleCount] = useState(0);
  const colors = ['#212d4f','#98F5F9','#6EB4E3','#B8A3D5', '#3887be', '#800080', '#FFDAB9','#212d4f','#6084eb']
  const [inputFields, setInputFields] = useState([{
    place: '',
  }]);
  useEffect(() => {
    mapboxgl.accessToken = accessToken;

    mapInstanceRef.current = new mapboxgl.Map({
      style: 'mapbox://styles/mapbox/streets-v10',
      container: mapContainerRef.current, // container ID
      center: [79.08, 21.40], // starting position [lng, lat]
      zoom: 6, // starting zoom
    });

    mapInstanceRef.current.on("load", () => {
      setMapLoaded(true);
    });
  }, []);
  useEffect(() => {
    try {
      if (startValue.length > 3) {
        console.log(startValue);
        axios.get(`https://api.mapbox.com/search/geocode/v6/forward?q=${startValue}&access_token=${accessToken}`)
          .then((response) => setStartcoord(response.data.features[0].geometry.coordinates));
        console.log(startcoord);
      }

    } catch (error) {
      console.log(error);
    }



  }, [startValue]);
  useEffect(() => {
    try {
      if (destiValue.length > 3) {
        console.log(destiValue);
        axios.get(`https://api.mapbox.com/search/geocode/v6/forward?q=${destiValue}&access_token=${accessToken}`)
          .then((response) => setDestcoord(response.data.features[0].geometry.coordinates));
        console.log(destcoord);
      }

    } catch (error) {
      console.log(error);
    }


  }, [destiValue]);



  const addInputField = () => {
    setInputFields([...inputFields, {
      place: "",
    }])

  }
  const removeInputFields = (index) => {
    const rows = [...inputFields];
    rows.splice(index, 1);
    setInputFields(rows);
  }

  const getparent = (i, parent) => {
    //console.log(i,"-");
    if (i == parent[i]) return i;
    return parent[i]=getparent(parent[i], parent);
  }

  const unionBysize = (i, j, size, parent,endpoints) => {
    let pari = getparent(i, parent);
    let parj = getparent(j, parent);
    console.log(i,j,getparent(i, parent),parj);
    if(endpoints[pari][0]!=i && endpoints[pari][1]!=i) return false;
    if(endpoints[parj][0]!=j && endpoints[parj][1]!=j) return false;
    if (pari != parj) {
      if (size[pari] > size[parj]) {
        parent[parj] = pari;
        size[pari] += size[parj];
        size[parj] = 0;
        if(endpoints[pari][0]==i){
          endpoints[pari][0]=j;
        }
        else{
          endpoints[pari][1]=j;
        }
        endpoints[parj][0]=-1;
        endpoints[parj][1]=-1;
      }
      else {
        parent[pari] = parj;
        size[parj] += size[pari];
        size[pari] = 0;
        if(endpoints[parj][0]==j){
          endpoints[parj][0]=i;
        }
        else{
          endpoints[parj][1]=i;
        }
        endpoints[pari][0]=-1;
        endpoints[pari][1]=-1;
      }
      return true;
    }
    return false;
  }
  const getdistancematrix = async () => {
    if (inputFields.length <= 0) return;
    const coordinates = [];

    await axios.get(`https://api.mapbox.com/search/geocode/v6/forward?q=${startValue}&access_token=${accessToken}`)
      .then((response) => coordinates.push(response.data.features[0].geometry.coordinates));

    for (let i = 0; i < inputFields.length; i++) {
      console.log(inputFields[i]);
      await axios.get(`https://api.mapbox.com/search/geocode/v6/forward?q=${inputFields[i]}&access_token=${accessToken}`)
        .then((response) => coordinates.push(response.data.features[0].geometry.coordinates));
      // console.log(coordinates);
    }

    let allcord = "";
    for (let i = 0; i < coordinates.length; i++) {
      let num1 = coordinates[i][0];
      let num2 = coordinates[i][1];
      if (i != coordinates.length - 1) {
        allcord += num1.toString() + "," + num2.toString() + ";";
      }
      else {
        allcord += num1.toString() + "," + num2.toString();
      }
    }
    console.log(allcord)

    const xhr = new XMLHttpRequest();
    xhr.open("GET", `https://api.mapbox.com/directions-matrix/v1/mapbox/driving/${allcord}?annotations=distance&sources=all&destinations=all&access_token=${accessToken}`, false);
    xhr.send();
    var data = JSON.parse(xhr.responseText);
    console.log(data);
    const matrix = data.distances;
    console.log(matrix);
    // calculate Savings -->
    let savings = [];
    for (let i = 1; i < coordinates.length; i++) {
      for (let j = i + 1; j < coordinates.length; j++) {
        let saving = matrix[0][i] + matrix[0][j] - Math.min(matrix[i][j],matrix[j][i]);
       // console.log(i,j,saving);
        savings.push({ saving: saving, i: i, j: j });
      }
    }
    // endpoints creation -->
    const endpoints = Array.from({ length: coordinates.length }, (_,i) => 
      new Array(2).fill(i));
    console.log(endpoints)
    savings.sort((a, b) => b.saving - a.saving);
    const parent = Array.from({ length: coordinates.length }, (_, i) => i);
    const size = Array.from({ length: coordinates.length }, (_, i) => 1);
    let count = 0;
    for (let k = 0; k < savings.length; k++) {
      //console.log(savings[k].saving);
      if (coordinates.length - count-1 <= vehicleCount) break;
      if (getparent(savings[k].i,parent) != getparent(savings[k].j,parent)) {
        console.log(getparent(savings[k].i,parent),getparent(savings[k].j,parent))
        if(!unionBysize(savings[k].i, savings[k].j, size, parent,endpoints)){
          continue;
        }
        console.log(getparent(savings[k].i,parent),getparent(savings[k].j,parent))
        var xhr1 = new XMLHttpRequest();
        const startco = [0, 0];
        startco[0] = coordinates[savings[k].i][0];
        startco[1] = coordinates[savings[k].i][1];
        const destco = [0, 0];
        destco[0] = coordinates[savings[k].j][0];
        destco[1] = coordinates[savings[k].j][1];
        xhr1.open("GET", `https://api.mapbox.com/directions/v5/mapbox/driving/${startco[0]},${startco[1]};${destco[0]},${destco[1]}?steps=true&geometries=geojson&access_token=${accessToken}`, false);
        xhr1.send();
        var data = JSON.parse(xhr1.responseText);
        const route = data.routes[0].geometry.coordinates;
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        };
        if (mapInstanceRef.current.getSource(savings[k].i.toString() + savings[k].j.toString())) {
          mapInstanceRef.current.getSource(savings[k].i.toString() + savings[k].j.toString()).setData(geojson);
        }
        else if (geojson) {
          mapInstanceRef.current.addLayer({
            id: savings[k].i.toString() + savings[k].j.toString(),
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
              'line-color': colors[getparent(savings[k].i,parent)],
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }
        count++;
      }
    }
    for(let k=0;k<endpoints.length;k++){
        if(endpoints[k][0]==-1) continue;
        var xhr1 = new XMLHttpRequest();
        const startco = [0, 0];
        startco[0] = coordinates[0][0];
        startco[1] = coordinates[0][1];
        const destco = [0, 0];
        destco[0] = coordinates[endpoints[k][0]][0];
        destco[1] = coordinates[endpoints[k][0]][1];
        xhr1.open("GET", `https://api.mapbox.com/directions/v5/mapbox/driving/${startco[0]},${startco[1]};${destco[0]},${destco[1]}?steps=true&geometries=geojson&access_token=${accessToken}`, false);
        xhr1.send();
        var data = JSON.parse(xhr1.responseText);
        const route = data.routes[0].geometry.coordinates;
        const geojson = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route
          }
        };
        if (mapInstanceRef.current.getSource(endpoints[k][0].toString())) {
          mapInstanceRef.current.getSource(endpoints[k][0].toString()).setData(geojson);
        }
        else if (geojson) {
          mapInstanceRef.current.addLayer({
            id: endpoints[k][0].toString(),
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
              'line-color': colors[getparent(endpoints[k][0],parent)],
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }
        destco[0] = coordinates[endpoints[k][1]][0];
        destco[1] = coordinates[endpoints[k][1]][1];
        xhr1.open("GET", `https://api.mapbox.com/directions/v5/mapbox/driving/${startco[0]},${startco[1]};${destco[0]},${destco[1]}?steps=true&geometries=geojson&access_token=${accessToken}`, false);
        xhr1.send();
        data = JSON.parse(xhr1.responseText);
        const route2 = data.routes[0].geometry.coordinates;
        const geojson2 = {
          type: 'Feature',
          properties: {},
          geometry: {
            type: 'LineString',
            coordinates: route2
          }
        };
        if (mapInstanceRef.current.getSource(endpoints[k][1].toString())) {
          mapInstanceRef.current.getSource(endpoints[k][1].toString()).setData(geojson);
        }
        else if (geojson2) {
          mapInstanceRef.current.addLayer({
            id: endpoints[k][1].toString(),
            type: 'line',
            source: {
              type: 'geojson',
              data: geojson2
            },
            layout: {
              'line-join': 'round',
              'line-cap': 'round'
            },
            paint: {
              'line-color': colors[getparent(endpoints[k][1],parent)],
              'line-width': 5,
              'line-opacity': 0.75
            }
          });
        }

    }

  }


  return (
    <div style={{
      display: "flex",
      justifyContent: "space-between",
      paddingTop: "1vh",
    }}>

      <form>
        <input type="number"

          placeholder="vehicle count"
          onChange={(e) => {
            setVehicleCount(e.target.value);
          }
          }
          style={{
            marginBottom: "2vh",
            height: "5vh",
            width: "28vw",
            borderRadius: "6px",
          }} />
        <Geocoder
          accessToken={accessToken}
          map={mapInstanceRef.current}
          mapboxgl={mapboxgl}
          value={startValue}
          placeholder="source"
          onChange={(d) => {
            setStartValue(d);
          }}
          marker
        />
        <div
          style={{
            margin: "2vh",
          }}>

        </div>

        {
          inputFields.map((data, index) => {
            return (
              <>
                <Geocoder
                  key={index}
                  accessToken={accessToken}
                  map={mapInstanceRef.current}
                  value={place}
                  placeholder="add delivery place"
                  onChange={(e) => {
                    const list = [...inputFields];
                    list[index] = e;
                    setInputFields(list);
                    console.log(list);
                  }}
                  marker
                />

                <div key={Date.now}
                  style={{
                    margin: "2vh",
                  }}>
                  {(inputFields.length !== 1) ? <button className="btn btn-outline-danger" onClick={removeInputFields}>x</button> : ''}

                </div>

              </>

            )
          })
        }
        <button onClick={addInputField}
          style={{
            margin: "1vh",
          }} type="button">
          Add</button>
        <button type="button"
          onClick={getdistancematrix}>
          getdistancematrix
        </button>
      </form>
      <div id="map-container" ref={mapContainerRef} style={{
        width: "100%",
        border: "1px solid",
        margin: "0.5vh",
        height: "90vh",
      }} />
    </div>
  );
}


