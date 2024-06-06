import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import './Home.css';
import activeImage from './images/check.png'; // Chemin vers l'image active
import resolvedImage from './images/danger.png'; // Chemin vers l'image résolue
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
    const [isAddMemberFormOpen, setAddMemberFormOpen] = useState(false);
    const [isDeleteMemberFormOpen, setDeleteMemberFormOpen] = useState(false);
    const [isUpdatePlaceFormOpen, setUpdatePlaceFormOpen] = useState(false);
    const [isAddPlaceFormOpen, setAddPlaceFormOpen] = useState(false); // Nouvel état pour contrôler l'affichage du formulaire d'ajout de lieu
    const [userEmail, setUserEmail] = useState('');
    const [alerts, setAlerts] = useState([]); // Nouvel état pour stocker les alertes

    const fetchUserEmail = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch('http://localhost:3001/get-email', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error fetching owner email');
            }
            const data = await response.json();
            return data.email;
        } catch (error) {
            console.error('Error fetching owner email:', error);
            return null;
        }
    };

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

    const fetchAlerts = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch('http://localhost:3001/alerts', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error fetching alerts');
            }
            const alertsData = await response.json();

            // Fetch places to map place ids to place names
            const placesResponse = await fetch('http://localhost:3001/places', {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!placesResponse.ok) {
                throw new Error('Error fetching places');
            }
            const placesData = await placesResponse.json();

            // Map place IDs to names
            const placeIdToNameMap = {};
            placesData.forEach(place => {
                placeIdToNameMap[place.id] = place.name;
            });

            // Add place names to alerts
            const alertsWithPlaceNames = alertsData.map(alert => ({
                ...alert,
                place_name: placeIdToNameMap[alert.place_id]
            }));

            setAlerts(alertsWithPlaceNames);
        } catch (error) {
            console.error('Error fetching alerts:', error);
        }
    };

    useEffect(() => {
        fetchPlaces();
        fetchAlerts(); // Appel pour récupérer les alertes
        fetchUserEmail().then(email => setUserEmail(email));
    }, []);

    const handleAddMemberClick = (placeId) => {
        setSelectedPlaceId(placeId);
        setNewMemberData(prevData => ({ ...prevData, place_id: placeId }));
        setAddMemberFormOpen(true);
    };

    const handleDeleteMemberClick = (placeId) => {
        setDeleteMemberData(prevData => ({ ...prevData, place_id: placeId }));
        setDeleteMemberFormOpen(true);
    };

    const handleUpdatePlaceClick = (place) => {
        setUpdatePlaceData(place);
        setUpdatePlaceFormOpen(true);
    };

    const handleAddPlaceClick = () => {
        // Fonction pour ouvrir le formulaire d'ajout de lieu
        setAddPlaceFormOpen(true);
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
            setUpdatePlaceFormOpen(false);
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
            setAddMemberFormOpen(false);
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
            setDeleteMemberFormOpen(false);
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
            setAddPlaceFormOpen(false); // Ajoutez cette ligne pour fermer le formulaire après l'envoi
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
        <div className="Home-container">
            <h1 className="Home-heading">Welcome to Your Dashboard!</h1>
            <h2>Your Places:</h2>
            <div className="Home-places-list">
                {places.map((place, index) => (
                    <div key={index} className="Home-place-card">
                        <div className="Home-place-info">
                            <div>Name: <Link to={`/places/${place.id}`}>{place.name}</Link></div>
                            <div>Description: {place.description}</div>
                            <div>Owner: {place.owner}</div>
                        </div>
                        {measurements[place.id] && (
                            <div className="Home-place-measurements">
                                <div>Last Measurements:</div>
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
                        {userEmail === place.owner && (
                            <div className="Home-place-actions">
                                <button className="Home-button" onClick={() => handleAddMemberClick(place.id)}>Add
                                    Member
                                </button>
                                {isAddMemberFormOpen && selectedPlaceId === place.id && (
                                    <form className="Home-form" onSubmit={handleAddMember}>
                                        <input type="hidden" name="place_id" value={place.id}/>
                                        <label>
                                            Username (Email):
                                            <input type="text" name="username" value={newMemberData.username}
                                                   onChange={handleMemberInputChange} required/>
                                        </label>
                                        <label>
                                            Notification:
                                            <input type="checkbox" name="notification"
                                                   checked={newMemberData.notification}
                                                   onChange={handleMemberInputChange}/>
                                        </label>
                                        <button className="Home-button" type="submit">Add Member</button>
                                    </form>
                                )}
                                <button className="Home-button" onClick={() => handleDeleteMemberClick(place.id)}>Delete
                                    Member
                                </button>
                                {isDeleteMemberFormOpen && deleteMemberData.place_id === place.id && (
                                    <form className="Home-form" onSubmit={handleDeleteMember}>
                                        <input type="hidden" name="place_id" value={place.id}/>
                                        <label>
                                            Username (Email):
                                            <input type="text" name="username" value={deleteMemberData.username}
                                                   onChange={handleDeleteMemberInputChange} required/>
                                        </label>
                                        <button className="Home-button" type="submit">Delete Member</button>
                                    </form>
                                )}
                                <button className="Home-button" onClick={() => handleUpdatePlaceClick(place)}>Update
                                    Place
                                </button>
                                {isUpdatePlaceFormOpen && updatePlaceData && updatePlaceData.id === place.id && (
                                    <form className="Home-form" onSubmit={handleUpdatePlace}>
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
                                                   value={updatePlaceData.threshold_pressure_min}
                                                   onChange={handleInputChange}
                                                   required/>
                                        </label>
                                        <br/>
                                        <label>
                                            Threshold Pressure Max:
                                            <input type="number" name="threshold_pressure_max"
                                                   value={updatePlaceData.threshold_pressure_max}
                                                   onChange={handleInputChange}
                                                   required/>
                                        </label>
                                        <br/>
                                        <label>
                                            Threshold Humidity Min:
                                            <input type="number" name="threshold_humidity_min"
                                                   value={updatePlaceData.threshold_humidity_min}
                                                   onChange={handleInputChange}
                                                   required/>
                                        </label>
                                        <br/>
                                        <label>
                                            Threshold Humidity Max:
                                            <input type="number" name="threshold_humidity_max"
                                                   value={updatePlaceData.threshold_humidity_max}
                                                   onChange={handleInputChange}
                                                   required/>
                                        </label>
                                        <br/>
                                        <label>
                                            Threshold Luminosity Min:
                                            <input type="number" name="threshold_luminosity_min"
                                                   value={updatePlaceData.threshold_luminosity_min}
                                                   onChange={handleInputChange}
                                                   required/>
                                        </label>
                                        <br/>
                                        <label>
                                            Threshold Luminosity Max:
                                            <input type="number" name="threshold_luminosity_max"
                                                   value={updatePlaceData.threshold_luminosity_max}
                                                   onChange={handleInputChange}
                                                   required/>
                                        </label>
                                        <br/>
                                        <button type="submit">Update Place</button>
                                    </form>
                                )}
                                <button className="Home-button" onClick={() => handleDeletePlace(place.id)}>Delete
                                    Place
                                </button>
                            </div>
                        )}
                    </div>
                ))}
            </div>
            <h2>Add a New Place:</h2>
            <button className="Home-button" onClick={handleAddPlaceClick}>Add Place</button>
            {/* Bouton pour ouvrir le formulaire */}
            {isAddPlaceFormOpen && ( // Condition pour afficher le formulaire
                <form className="Home-add-place-form" onSubmit={handleAddPlace}>
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
                        <input type="text" name="description" value={newPlaceData.description}
                               onChange={handleInputChange}
                               required/>
                    </label>
                    <br/>
                    <label>
                        Threshold Temperature Min:
                        <input type="number" name="threshold_temperature_min"
                               value={newPlaceData.threshold_temperature_min}
                               onChange={handleInputChange} required/>
                    </label>
                    <br/>
                    <label>
                        Threshold Temperature Max:
                        <input type="number" name="threshold_temperature_max"
                               value={newPlaceData.threshold_temperature_max}
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
                        <input type="number" name="threshold_luminosity_min"
                               value={newPlaceData.threshold_luminosity_min}
                               onChange={handleInputChange} required/>
                    </label>
                    <br/>
                    <label>
                        Threshold Luminosity Max:
                        <input type="number" name="threshold_luminosity_max"
                               value={newPlaceData.threshold_luminosity_max}
                               onChange={handleInputChange} required/>
                    </label>
                    <br/>
                    <button className="Home-button" type="submit">Add Place</button>
                </form>
            )}

            {/* Section pour afficher les alertes */}
            <h2>Alerts:</h2>
            <div className="Home-alerts-list">
                {alerts.length > 0 ? (
                    <table>
                        <thead>
                        <tr>
                            <th>Status</th>
                            <th>Place Name</th>
                            <th>Alert Start</th>
                            <th>Alert End</th>
                            <th>Measurement Type</th>
                        </tr>
                        </thead>
                        <tbody>
                        {alerts.map((alert, index) => (
                            <tr key={index}>
                                <td className="status-cell">
                                    {alert.alert_end ? (
                                        <img src={activeImage} alt="Resolved"
                                             className="status-image-danger resolved-image"/>
                                    ) : (
                                        <img src={resolvedImage} alt="Active" className="status-image-check active-image"/>
                                    )}
                                </td>
                                <td>{alert.place_name}</td>
                                <td>{alert.alert_start}</td>
                                <td>{alert.alert_end}</td>
                                <td>{alert.measurement_type}</td>
                            </tr>
                        ))}
                        </tbody>
                    </table>
                ) : (
                    <div>No alerts found.</div>
                )}
            </div>
        </div>
    );
}

export default Home;