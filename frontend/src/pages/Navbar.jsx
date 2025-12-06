import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

const Navbar = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const loggedInUser = localStorage.getItem('utilizador');
    if (loggedInUser) {
      setIsLoggedIn(true);
    }
  }, []);

  return (
    <nav className=" bg-gray-700 fixed z-50 h-[60px] content-center w-full">
      <div className="mx-12">
        <div className="flex justify-between items-center">
          <div className="flex items-center">
            <a href="/" className="text-white font-bold text-xl">iTask</a>
          </div>

          <div className="hidden md:flex items-center space-x-10">
            {isLoggedIn ? (
              <div className='flex items-center gap-11'>
              <a href="/taskform" className="text-white text-lg transition duration-300 hover:text-gray-300">Criar Tarefa</a>
              <div className="flex items-center ">
                <Link to={'/conta'}> 
                  <img
                    src="./src/images/profile_image.jpg"
                    alt="Conta"
                    className="h-10 w-10 rounded-full"
                  />
                </Link>
              </div>
              </div>
            ) : (
              <>
                <a href="/login" className="text-white text-lg transition duration-300 hover:text-gray-300">Login</a>
                <a href="/register" className="text-white text-lg transition duration-300 hover:text-gray-300">Registo</a>
              </>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;