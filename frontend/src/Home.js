import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
    const [places, setPlaces] = useState([]);
    const [measurements, setMeasurements] = useState({});

    const fetchPlaces = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch('http://localhost:3001/places', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error fetching places');
            }
            const data = await response.json();
            setPlaces(data);
            fetchMeasurementsForPlaces(data);
        } catch (error) {
            console.error('Error fetching places:', error);
        }
    };

    useEffect(() => {
        fetchPlaces();
    }, []);

    const fetchMeasurements = async (placeId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch(`http://localhost:3001/measurements/${placeId}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error fetching measurements');
            }
            const data = await response.json();
            const lastMeasurement = data[data.length - 1];
            return lastMeasurement ? [lastMeasurement] : [];
        } catch (error) {
            console.error(`Error fetching measurements for place ${placeId}:`, error);
            return [];
        }
    };

    const fetchMeasurementsForPlaces = async (placesData) => {
        const measurementsData = {};
        await Promise.all(placesData.map(async (place) => {
            const data = await fetchMeasurements(place.id);
            measurementsData[place.id] = data;
        }));
        setMeasurements(measurementsData);
    };

    const [newPlaceData, setNewPlaceData] = useState({});

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setNewPlaceData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleAddPlace = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch('http://localhost:3001/place', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newPlaceData)
            });
            if (!response.ok) {
                throw new Error('Error adding place');
            }
            alert('Place added successfully');
            fetchPlaces();
        } catch (error) {
            console.error('Error adding place:', error);
        }
    };

    return (
        <div>
            <h1>Welcome to Your Dashboard!</h1>
            <h2>Your Places:</h2>
            <ul>
                {places.map((place, index) => (
                    <li key={index}>
                        Name: <Link to={`/places/${place.id}`}>{place.name}</Link>, Description: {place.description}, Owner: {place.owner}
                        {measurements[place.id] && (
                            <div>
                                Last Measurements:
                                <ul>
                                    {measurements[place.id].map((measurement, idx) => (
                                        <li key={idx}>
                                            Temperature: {measurement.temperature}, Humidity: {measurement.humidity}, Luminosity: {measurement.luminosity}, Pressure: {measurement.pressure}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                    </li>
                ))}
            </ul>
            <h2>Add a New Place:</h2>
            <form onSubmit={handleAddPlace}>
                <label>
                    Name:
                    <input type="text" name="name" value={newPlaceData.name} onChange={handleInputChange} />
                </label>
                <br />
                <label>
                    Description:
                    <input type="text" name="description" value={newPlaceData.description} onChange={handleInputChange} />
                </label>
                <br />
                <label>
                    Owner:
                    <input type="text" name="owner" value={newPlaceData.owner} onChange={handleInputChange} />
                </label>
                <br />
                <button type="submit">Add Place</button>
            </form>
        </div>
    );
}

export default Home;
