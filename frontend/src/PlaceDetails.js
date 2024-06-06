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

    // Get today's date in YYYY-MM-DD format
    const getTodayDate = () => {
        const today = new Date();
        const yyyy = today.getFullYear();
        const mm = String(today.getMonth() + 1).padStart(2, '0');
        const dd = String(today.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    // Get tomorrow's date in YYYY-MM-DD format
    const getTomorrowDate = () => {
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const yyyy = tomorrow.getFullYear();
        const mm = String(tomorrow.getMonth() + 1).padStart(2, '0');
        const dd = String(tomorrow.getDate()).padStart(2, '0');
        return `${yyyy}-${mm}-${dd}`;
    };

    const [startDate, setStartDate] = useState(getTodayDate());
    const [endDate, setEndDate] = useState(getTomorrowDate());

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
            setMeasurements(data);
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
            <h2>Measurements</h2>
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
