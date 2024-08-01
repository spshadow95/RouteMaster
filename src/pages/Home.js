import React from 'react'
import { useAuth0 } from '@auth0/auth0-react'


const Home = () => {
    const {user , isAuthenticated}= useAuth0();
  return (
    <div className="App">
        Home Page
    </div>
  )
}

export default Home