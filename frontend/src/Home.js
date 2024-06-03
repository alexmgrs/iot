import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

function Home() {
    const [places, setPlaces] = useState([]);
    const [measurements, setMeasurements] = useState({});
    const [selectedPlaceId, setSelectedPlaceId] = useState(null);
    const [newMemberData, setNewMemberData] = useState({
        place_id: '',
        username: '',
        notification: false
    });
    const [deleteMemberData, setDeleteMemberData] = useState({
        place_id: '',
        username: ''
    });
    const [updatePlaceData, setUpdatePlaceData] = useState(null);
    const [newPlaceData, setNewPlaceData] = useState({
        id: '',
        name: '',
        description: '',
        threshold_temperature_min: 0,
        threshold_temperature_max: 0,
        threshold_pressure_min: 0,
        threshold_pressure_max: 0,
        threshold_humidity_min: 0,
        threshold_humidity_max: 0,
        threshold_luminosity_min: 0,
        threshold_luminosity_max: 0
    });

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
        setSelectedPlaceId(placeId);
        setNewMemberData(prevData => ({ ...prevData, place_id: placeId }));
    };

    const handleDeleteMemberClick = (placeId) => {
        setDeleteMemberData(prevData => ({ ...prevData, place_id: placeId }));
    };

    const handleUpdatePlaceClick = (place) => {
        setUpdatePlaceData(place);
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

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdatePlaceData(prevData => ({
            ...prevData,
            [name]: value
        }));
        setNewPlaceData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleUpdatePlace = async (e) => {
        e.preventDefault();

        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch(`http://localhost:3001/updatePlace/${updatePlaceData.id}`, {
                method: 'PUT',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(updatePlaceData)
            });
            if (!response.ok) {
                throw new Error('Error updating place');
            }
            alert('Place updated successfully');
            setUpdatePlaceData(null);
            fetchPlaces();
        } catch (error) {
            console.error('Error updating place:', error);
        }
    };

    const handleMemberInputChange = (e) => {
        const { name, value, type, checked } = e.target;
        const newValue = type === 'checkbox' ? checked : value;
        setNewMemberData(prevData => ({
            ...prevData,
            [name]: newValue,
        }));
    };

    const handleDeleteMemberInputChange = (e) => {
        const { name, value } = e.target;
        setDeleteMemberData(prevData => ({
            ...prevData,
            [name]: value
        }));
    };

    const handleAddMember = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }
            const response = await fetch(`http://localhost:3001/place/member`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(newMemberData)
            });
            if (!response.ok) {
                throw new Error('Error adding member');
            }
            alert('Member added successfully');
            setNewMemberData({
                place_id: '',
                username: '',
                notification: false
            });
        } catch (error) {
            console.error('Error adding member:', error);
        }
    };

    const handleDeleteMember = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }
            const response = await fetch(`http://localhost:3001/place/member`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(deleteMemberData)
            });
            if (!response.ok) {
                throw new Error('Error deleting member');
            }
            alert('Member deleted successfully');
            setDeleteMemberData({
                place_id: '',
                username: ''
            });
        } catch (error) {
            console.error('Error deleting member:', error);
        }
    };

    const handleAddPlace = async (e) => {
        e.preventDefault();
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }
            const response = await fetch(`http://localhost:3001/place`, {
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
            setNewPlaceData({
                id: '',
                name: '',
                description: '',
                threshold_temperature_min: 0,
                threshold_temperature_max: 0,
                threshold_pressure_min: 0,
                threshold_pressure_max: 0,
                threshold_humidity_min: 0,
                threshold_humidity_max: 0,
                threshold_luminosity_min: 0,
                threshold_luminosity_max: 0
            });
            fetchPlaces();
        } catch (error) {
            console.error('Error adding place:', error);
        }
    };

    const handleDeletePlace = async (placeId) => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch(`http://localhost:3001/place/${placeId}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });

            if (!response.ok) {
                throw new Error('Error deleting place');
            }

            setPlaces(places.filter(place => place.id !== placeId));
            console.log('Place deleted successfully');
        } catch (error) {
            console.error('Error deleting place:', error);
        }
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
                                            Temperature: {measurement.temperature}, Humidity : {measurement.humidity},
                                            Luminosity: {measurement.luminosity}, Pressure: {measurement.pressure}
                                        </li>
                                    ))}
                                </ul>
                            </div>
                        )}
                        <button onClick={() => handleAddMemberClick(place.id)}>Add Member</button>
                        {selectedPlaceId === place.id && (
                            <form onSubmit={handleAddMember}>
                                <input type="hidden" name="place_id" value={place.id}/>
                                <label>
                                    Username (Email):
                                    <input type="text" name="username" value={newMemberData.username}
                                           onChange={handleMemberInputChange} required/>
                                </label>
                                <label>
                                    Notification:
                                    <input type="checkbox" name="notification" checked={newMemberData.notification}
                                           onChange={handleMemberInputChange}/>
                                </label>
                                <button type="submit">Add Member</button>
                            </form>
                        )}
                        <button onClick={() => handleDeleteMemberClick(place.id)}>Delete Member</button>
                        {deleteMemberData.place_id === place.id && (
                            <form onSubmit={handleDeleteMember}>
                                <input type="hidden" name="place_id" value={place.id}/>
                                <label>
                                    Username (Email):
                                    <input type="text" name="username" value={deleteMemberData.username}
                                           onChange={handleDeleteMemberInputChange} required/>
                                </label>
                                <button type="submit">Delete Member</button>
                            </form>
                        )}
                        <button onClick={() => handleUpdatePlaceClick(place)}>Update Place</button>
                        {updatePlaceData && updatePlaceData.id === place.id && (
                            <form onSubmit={handleUpdatePlace}>
                                <label>
                                    Name:
                                    <input type="text" name="name" value={updatePlaceData.name}
                                           onChange={handleInputChange} required/>
                                </label>
                                <br/>
                                <label>
                                    Description:
                                    <input type="text" name="description" value={updatePlaceData.description}
                                           onChange={handleInputChange} required/>
                                </label>
                                <br/>
                                <label>
                                    Threshold Temperature Min:
                                    <input type="number" name="threshold_temperature_min"
                                           value={updatePlaceData.threshold_temperature_min}
                                           onChange={handleInputChange} required/>
                                </label>
                                <br/>
                                <label>
                                    Threshold Temperature Max:
                                    <input type="number" name="threshold_temperature_max"
                                           value={updatePlaceData.threshold_temperature_max}
                                           onChange={handleInputChange} required/>
                                </label>
                                <br/>
                                <label>
                                    Threshold Pressure Min:
                                    <input type="number" name="threshold_pressure_min"
                                           value={updatePlaceData.threshold_pressure_min} onChange={handleInputChange}
                                           required/>
                                </label>
                                <br/>
                                <label>
                                    Threshold Pressure Max:
                                    <input type="number" name="threshold_pressure_max"
                                           value={updatePlaceData.threshold_pressure_max} onChange={handleInputChange}
                                           required/>
                                </label>
                                <br/>
                                <label>
                                    Threshold Humidity Min:
                                    <input type="number" name="threshold_humidity_min"
                                           value={updatePlaceData.threshold_humidity_min} onChange={handleInputChange}
                                           required/>
                                </label>
                                <br/>
                                <label>
                                    Threshold Humidity Max:
                                    <input type="number" name="threshold_humidity_max"
                                           value={updatePlaceData.threshold_humidity_max} onChange={handleInputChange}
                                           required/>
                                </label>
                                <br/>
                                <label>
                                    Threshold Luminosity Min:
                                    <input type="number" name="threshold_luminosity_min"
                                           value={updatePlaceData.threshold_luminosity_min} onChange={handleInputChange}
                                           required/>
                                </label>
                                <br/>
                                <label>
                                    Threshold Luminosity Max:
                                    <input type="number" name="threshold_luminosity_max"
                                           value={updatePlaceData.threshold_luminosity_max} onChange={handleInputChange}
                                           required/>
                                </label>
                                <br/>
                                <button type="submit">Update Place</button>
                            </form>
                        )}
                        <button onClick={() => handleDeletePlace(place.id)}>Delete Place</button>
                    </li>
                ))}
            </ul>
            <h2>Add a New Place:</h2>
            <form onSubmit={handleAddPlace}>
                <label>
                    ID:
                    <input type="text" name="id" value={newPlaceData.id} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Name:
                    <input type="text" name="name" value={newPlaceData.name} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Description:
                    <input type="text" name="description" value={newPlaceData.description} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Threshold Temperature Min:
                    <input type="number" name="threshold_temperature_min" value={newPlaceData.threshold_temperature_min} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Threshold Temperature Max:
                    <input type="number" name="threshold_temperature_max" value={newPlaceData.threshold_temperature_max} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Threshold Pressure Min:
                    <input type="number" name="threshold_pressure_min" value={newPlaceData.threshold_pressure_min} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Threshold Pressure Max:
                    <input type="number" name="threshold_pressure_max" value={newPlaceData.threshold_pressure_max} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Threshold Humidity Min:
                    <input type="number" name="threshold_humidity_min" value={newPlaceData.threshold_humidity_min} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Threshold Humidity Max:
                    <input type="number" name="threshold_humidity_max" value={newPlaceData.threshold_humidity_max} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Threshold Luminosity Min:
                    <input type="number" name="threshold_luminosity_min" value={newPlaceData.threshold_luminosity_min} onChange={handleInputChange} required />
                </label>
                <br />
                <label>
                    Threshold Luminosity Max:
                    <input type="number" name="threshold_luminosity_max" value={newPlaceData.threshold_luminosity_max} onChange={handleInputChange} required />
                </label>
                <br />
                <button type="submit">Add Place</button>
            </form>
        </div>
    );
}

export default Home;
