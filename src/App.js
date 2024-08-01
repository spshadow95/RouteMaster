import React from 'react';
import logo from './logo.svg';
import './App.css';
import LoginButton from './components/loginButton';
import LogoutButton from './components/logoutButton';
import Profile from './components/profile';
import { useAuth0 } from "@auth0/auth0-react";
import { BrowserRouter, Routes,Route } from 'react-router-dom';
import Home from './pages/Home';
import Navbar from './components/Navbar';
// import Mapbox from './components/Map';
import MapContainer from './components/MapContainer';
import Direction from './components/Directions';
import MapWithGeocoder from './components/Searchbox';


function App() {
  const {user, isAuthenticated}= useAuth0();
  return (
    <BrowserRouter>
    <Navbar/>
    <Routes>
      <Route path='/' element={<Home/>}/>
      <Route path='/search' element={<MapWithGeocoder/>}/>
      <Route path='/map' element={<MapContainer/>}/>
      <Route path='/directions' element={<Direction/>}/>
      <Route path='/Profile' element={<Profile/>}/>
    </Routes>
      
    </BrowserRouter>
  );
}

export default App;
