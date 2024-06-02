import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

function LuminosityChart({ measurements }) {
    const data = {
        labels: measurements.map((_, index) => index + 1), // Utiliser les indices comme labels
        datasets: [
            {
                label: 'Luminosity',
                data: measurements.map(m => m.luminosity),
                borderColor: 'rgba(255, 206, 86, 1)',
                backgroundColor: 'rgba(255, 206, 86, 0.2)',
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
                text: 'Luminosity over time',
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
                    text: 'Luminosity (lux)',
                },
            },
        },
    };

    return <Line data={data} options={options} />;
}

export default LuminosityChart;
