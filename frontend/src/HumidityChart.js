import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

function HumidityChart({ measurements }) {
    const data = {
        labels: measurements.map((_, index) => index + 1), // Utiliser les indices comme labels
        datasets: [
            {
                label: 'Humidity',
                data: measurements.map(m => m.humidity),
                borderColor: 'rgba(54, 162, 235, 1)',
                backgroundColor: 'rgba(54, 162, 235, 0.2)',
                fill: false,
                tension: 0.1,
            },
        ],
    };

    const options = {
        responsive: true,
        plugins: {
            legend: {
                display: true,
                position: 'top',
            },
            title: {
                display: true,
                text: 'Humidity over time',
            },
        },
        scales: {
            x: {
                title: {
                    display: true,
                    text: 'Time',
                },
                ticks: {
                    display: false, // Hide the x-axis labels
                },
            },
            y: {
                title: {
                    display: true,
                    text: 'Humidity (%)',
                },
            },
        },
    };

    return <Line data={data} options={options} />;
}

export default HumidityChart;
