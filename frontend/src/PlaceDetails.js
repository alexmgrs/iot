import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import TemperatureChart from './TemperatureChart';
import HumidityChart from './HumidityChart';
import LuminosityChart from './LuminosityChart';
import PressureChart from './PressureChart';
import './PlaceDetails.css';

function PlaceDetails() {
    const { id } = useParams();
    const [place, setPlace] = useState(null);
    const [measurements, setMeasurements] = useState([]);
    const [loading, setLoading] = useState(true);
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');

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

            let url = `http://localhost:3001/measurements/${id}`;
            if (startDate && endDate) {
                url += `?startDate=${startDate}&endDate=${endDate}`;
            }

            const response = await fetch(url, {
                method: 'GET',
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });
            if (!response.ok) {
                throw new Error('Error fetching measurements');
            }
            const data = await response.json();
            const last20Measurements = data.sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 20);
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
    }, [id, startDate, endDate]);

    const handleDateChange = () => {
        fetchMeasurements();
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!place) {
        return <p>Place not found</p>;
    }

    return (
        <div className="place-details">
            <h1>{place.name}</h1>
            <p>Description: {place.description}</p>
            <p>Owner: {place.owner}</p>
            <div className="date-filters">
                <label>
                    Start Date:
                    <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
                </label>
                <label>
                    End Date:
                    <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
                </label>
                <button onClick={handleDateChange}>Filter</button>
            </div>
            <h2>Last Measurements</h2>
            <div className="charts-container">
                <div className="chart top-left">
                    <TemperatureChart measurements={measurements} />
                </div>
                <div className="chart top-right">
                    <HumidityChart measurements={measurements} />
                </div>
                <div className="chart bottom-left">
                    <LuminosityChart measurements={measurements} />
                </div>
                <div className="chart bottom-right">
                    <PressureChart measurements={measurements} />
                </div>
            </div>
        </div>
    );
}

export default PlaceDetails;
