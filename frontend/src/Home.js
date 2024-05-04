import React, { useState, useEffect } from 'react';

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
            // Fetch measurements for each place after fetching places
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
            // Récupérer seulement la dernière mesure
            const lastMeasurement = data[data.length - 1]; // Supposant que les mesures sont triées par date
            return lastMeasurement ? [lastMeasurement] : []; // Retourne un tableau avec la dernière mesure ou un tableau vide si aucune mesure n'est disponible
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

    const [newPlaceData, setNewPlaceData] = useState({
    });

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
                body: JSON.stringify(newPlaceData) // Utilisez newPlaceData au lieu des variables non définies
            });
            if (!response.ok) {
                throw new Error('Error adding place');
            }
            // Ajouter une alerte ou une notification pour indiquer que la place a été ajoutée avec succès
            alert('Place added successfully');

            // Rafraîchir la liste des lieux après l'ajout
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
                        Name: {place.name}, Description: {place.description}, Owner: {place.owner}
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
                {/* Ajoutez les autres champs du formulaire ici */}
                <button type="submit">Add Place</button>
            </form>
        </div>
    );
}

export default Home;
