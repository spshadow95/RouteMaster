import React from 'react'
import { NavLink } from 'react-router-dom'
import "./style.css"
import LogoutButton from './logoutButton'
import { useAuth0 } from '@auth0/auth0-react'
import LoginButton from './loginButton'

const Navbar = () => {
  const {isAuthenticated} = useAuth0();
  return (
    <div>
      
      <nav >
          <div className='logo'>Logo</div>
          <ul>
            <NavLink to="/">Home</NavLink>
            <NavLink to="/search">Find Route</NavLink>
            <NavLink to='/Profile' >Profile</NavLink>
            {isAuthenticated ? (<LogoutButton/>): (<LoginButton/>)}
          </ul>  
      </nav>
    </div>
    
  )
}

export default Navbar