import React, {useState, useEffect} from 'react';
import {Link} from 'react-router-dom';

function Home() {
    const [places, setPlaces] = useState([]);
    const [measurements, setMeasurements] = useState({});
    const [newMemberData, setNewMemberData] = useState({
        place_id: '',
        username: '',
        notification: false
    });
    const [selectedPlaceId, setSelectedPlaceId] = useState(null);
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

    const handleAddMemberClick = (placeId) => {
        setSelectedPlaceId(placeId); // Set the selected place ID when the button is clicked
    };
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

    const [newPlaceData, setNewPlaceData] = useState({
        id: '',
        name: '',
        description: '',
        threshold_temperature_min: '',
        threshold_temperature_max: '',
        threshold_pressure_min: '',
        threshold_pressure_max: '',
        threshold_humidity_min: '',
        threshold_humidity_max: '',
        threshold_luminosity_min: '',
        threshold_luminosity_max: ''
    });

    const handleInputChange = (e) => {
        const {name, value} = e.target;
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
    const handleAddMember = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch('http://localhost:3001/place/member', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    place_id: selectedPlaceId, // Utiliser l'ID de l'endroit sélectionné
                    username: newMemberData.username,
                    notification: newMemberData.notification
                })
            });
            if (!response.ok) {
                throw new Error('Error adding member to place');
            }
            alert('Member added to place successfully and email notification sent.');
            setSelectedPlaceId(null); // Reset selected place ID
            setNewMemberData({ // Réinitialiser les données du nouveau membre après l'ajout réussi
                username: '',
                notification: false
            });
        } catch (error) {
            console.error('Error adding member to place:', error);
        }
    };


    const handleMemberInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setNewMemberData(prevData => ({
            ...prevData,
            [name]: name === 'notification' ? checked : newValue,
        }));
    };


    return (
        <div>
            <h1>Welcome to Your Dashboard!</h1>
            <h2>Your Places:</h2>
            <ul>
                {places.map((place, index) => (
                    <li key={index}>
                        Name: <Link to={`/places/${place.id}`}>{place.name}</Link>, Description: {place.description},
                        Owner: {place.owner}
                        {measurements[place.id] && (
                            <div>
                                Last Measurements:
                                <ul>
                                    {measurements[place.id].map((measurement, idx) => (
                                        <li key={idx}>
                                            Temperature: {measurement.temperature}, Humidity: {measurement.humidity},
                                            Luminosity: {measurement.luminosity}, Pressure: {measurement.pressure}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        {/* Add button to show add member form */}
                        <button onClick={() => handleAddMemberClick(place.id)}>Add Member</button>
                        {/* Show form if the place ID matches the selected place ID */}
                        {selectedPlaceId === place.id && (
                            <form onSubmit={handleAddMember}>
                                <input type="hidden" name="place_id" value={place.id}/>
                                <label>
                                    Username (Email):
                                    <input type="text" name="username" value={newMemberData.username}
                                           onChange={handleMemberInputChange} required/>
                                </label>
                                <br/>
                                <label>
                                    Notification:
                                    <input type="checkbox" name="notification" checked={newMemberData.notification}
                                           onChange={handleMemberInputChange}/>
                                </label>
                                <br/>
                                <button type="submit">Add Member</button>
                            </form>
                        )}
                    </li>
                ))}
            </ul>
            <h2>Add a New Place:</h2>
            <form onSubmit={handleAddPlace}>
                <label>
                    ID:
                    <input type="text" name="id" value={newPlaceData.id} onChange={handleInputChange} required/>
                </label>
                <br/>
                <label>
                    Name:
                    <input type="text" name="name" value={newPlaceData.name} onChange={handleInputChange} required/>
                </label>
                <br/>
                <label>
                    Description:
                    <input type="text" name="description" value={newPlaceData.description} onChange={handleInputChange}
                           required/>
                </label>
                <br/>
                <label>
                    Threshold Temperature Min:
                    <input type="number" name="threshold_temperature_min" value={newPlaceData.threshold_temperature_min}
                           onChange={handleInputChange} required/>
                </label>
                <br/>
                <label>
                    Threshold Temperature Max:
                    <input type="number" name="threshold_temperature_max" value={newPlaceData.threshold_temperature_max}
                           onChange={handleInputChange} required/>
                </label>
                <br/>
                <label>
                    Threshold Pressure Min:
                    <input type="number" name="threshold_pressure_min" value={newPlaceData.threshold_pressure_min}
                           onChange={handleInputChange} required/>
                </label>
                <br/>
                <label>
                    Threshold Pressure Max:
                    <input type="number" name="threshold_pressure_max" value={newPlaceData.threshold_pressure_max}
                           onChange={handleInputChange} required/>
                </label>
                <br/>
                <label>
                    Threshold Humidity Min:
                    <input type="number" name="threshold_humidity_min" value={newPlaceData.threshold_humidity_min}
                           onChange={handleInputChange} required/>
                </label>
                <br/>
                <label>
                    Threshold Humidity Max:
                    <input type="number" name="threshold_humidity_max" value={newPlaceData.threshold_humidity_max}
                           onChange={handleInputChange} required/>
                </label>
                <br/>
                <label>
                    Threshold Luminosity Min:
                    <input type="number" name="threshold_luminosity_min" value={newPlaceData.threshold_luminosity_min}
                           onChange={handleInputChange} required/>
                </label>
                <br/>
                <label>
                    Threshold Luminosity Max:
                    <input type="number" name="threshold_luminosity_max" value={newPlaceData.threshold_luminosity_max}
                           onChange={handleInputChange} required/>
                </label>
                <br/>
                <button type="submit">Add Place</button>
            </form>
        </div>
    );
}

export default Home;