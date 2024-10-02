import React from 'react';
import { Routes, Route } from 'react-router-dom';

import { TransitionProvider } from '../context/TransitionContext'; 
import TransitionComponent from '../components/Transition';

import Layers from '../views/Layers';
import Metano from '../views/01_metano';
import CowID from '../views/02_cowID';
import Counter from '../views/03_counter';
import Locomocion from '../views/04_locomocion';
import Team from '../views/05_team';

const Router = () => {
  return (
    <TransitionProvider>
      <Routes>

        <Route
          index
          element={
            <TransitionComponent>
              <Layers />
            </TransitionComponent>
          }
        />
        <Route
          path="/dispositivo_metano"
          element={
            <TransitionComponent>
              <Metano />
            </TransitionComponent>
          }
        />

      <Route
          path="/cowID"
          element={
            <TransitionComponent>
              <CowID />
            </TransitionComponent>
          }
        />
      
      <Route
          path="/contador"
          element={
            <TransitionComponent>
              <Counter /> 
            </TransitionComponent>
          }
        />
      
      <Route
          path="/locomocion"
          element={
            <TransitionComponent>
              <Locomocion /> 
            </TransitionComponent>
          }
        />
      
        <Route
          path="/team"
          element={
            <TransitionComponent>
              <Team /> 
            </TransitionComponent>
          }
        />
      
      </Routes>
    </TransitionProvider>
  );
};

export default Router;
