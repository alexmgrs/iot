import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TemperatureChart from './TemperatureChart';
import HumidityChart from './HumidityChart';
import LuminosityChart from './LuminosityChart';
import PressureChart from './PressureChart';

function PlaceDetails() {
    const { id } = useParams();
    const [place, setPlace] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchPlaceDetails = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch(`http://localhost:3001/places/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error fetching place details');
            }
            const data = await response.json();
            setPlace(data);
        } catch (error) {
            console.error('Error fetching place details:', error);
        }
    };

    const fetchMeasurements = async () => {
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                throw new Error('Token not found');
            }

            const response = await fetch(`http://localhost:3001/measurements/${id}`, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error fetching measurements');
            }
            const data = await response.json();
            // Trier les mesures par timestamp en ordre décroissant et sélectionner les 20 premières
            const last20Measurements = data.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp)).slice(0, 20);
            setMeasurements(last20Measurements);
        } catch (error) {
            console.error('Error fetching measurements:', error);
        }
    };

    useEffect(() => {
        const fetchData = async () => {
            await fetchPlaceDetails();
            await fetchMeasurements();
            setLoading(false);
        };
        fetchData();
    }, [id]);

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!place) {
        return <p>Place not found</p>;
    }

    return (
        <div>
            <h1>{place.name}</h1>
            <p>Description: {place.description}</p>
            <p>Owner: {place.owner}</p>
            <h2>Last 20 Measurements</h2>
            <TemperatureChart measurements={measurements} />
            <HumidityChart measurements={measurements} />
            <LuminosityChart measurements={measurements} />
            <PressureChart measurements={measurements} />
        </div>
    );
}

export default PlaceDetails;
