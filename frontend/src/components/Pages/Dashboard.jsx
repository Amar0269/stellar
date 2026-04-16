import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import SensorCard from '../Dashboard/SensorCard';

function Dashboard() {
  const [loggedInUser, setLoggedInUser] = useState('');

  // State placeholders — plug in API calls here when backend is ready
  const [temperatureData, setTemperatureData] = useState(null);
  const [gasLevel, setGasLevel] = useState(null);
  const [lightStatus, setLightStatus] = useState(null);
  const [garbageLevel, setGarbageLevel] = useState(null);

  useEffect(() => {
    setLoggedInUser(localStorage.getItem('loggedInUser'));

    // TODO: Fetch latest sensor readings from MongoDB/ESP32 backend
    // Example:
    // const data = await fetch('/api/sensors/latest');
    // const json = await data.json();
    // setTemperatureData(json.temperature);
    // setGasLevel(json.gas);
    // setLightStatus(json.light);
    // setGarbageLevel(json.garbage);
  }, []);

  const sensorCards = [
    {
      title: 'Temperature',
      icon: '🌡',
      value: temperatureData,
      unit: '°C',
      description: 'Ambient room temperature',
      link: '/dashboard/temperature',
    },
    {
      title: 'Gas Level',
      icon: '💨',
      value: gasLevel,
      unit: 'ppm',
      description: 'Air quality & gas concentration',
      link: '/dashboard/gas',
    },
    {
      title: 'Light Status',
      icon: '💡',
      value: lightStatus,
      unit: 'lux',
      description: 'Ambient light intensity',
      link: '/dashboard/light',
    },
    {
      title: 'Garbage Level',
      icon: '🗑',
      value: garbageLevel,
      unit: '%',
      description: 'Bin fill percentage',
      link: '/dashboard/garbage',
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-800">
          Welcome, <span className="text-orange-500">{loggedInUser || '...'}</span>
        </h1>
        <p className="text-sm text-gray-400 mt-1">Here's a live overview of your IoT sensors.</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-5">
        {sensorCards.map(({ title, icon, value, unit, description, link }) => (
          <Link to={link} key={title} className="group">
            <div className="transition-transform duration-200 group-hover:-translate-y-1">
              <SensorCard
                title={title}
                icon={icon}
                value={value}
                unit={unit}
                description={description}
              />
            </div>
          </Link>
        ))}
      </div>

      <ToastContainer />
    </div>
  );
}

export default Dashboard;