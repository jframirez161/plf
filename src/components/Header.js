import React from 'react';
import { Link } from 'react-router-dom';

export default function Header() {
  return (
    <header className="header">
      <a
        className="brand"
        target="_blank"
        rel="noreferrer"
      >
        <img
          className="greensock-icon"
          width="100"
        />
      </a>
      <nav>
        <ul>
          <li>
            <Link to="/">INICIO</Link>
          </li>
        </ul>
      </nav>
    </header>
  );
}
