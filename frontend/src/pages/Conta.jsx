import React from "react";
import { Button } from '@tremor/react';
import Navbar from "./Navbar";
import { useNavigate } from "react-router-dom";


function Conta () {

const navigate = useNavigate();

const handleLogout = () => {
    localStorage.removeItem("utilizador");
    navigate("/");
  };

    return(
        <>
        <Navbar/>
        <div className="pl-6 pt-24">
        <Button color="red" onClick={handleLogout}>
        Logout
      </Button>
      </div>
    </>

    );
}

export default Conta;