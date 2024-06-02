import React from 'react';
import { Line } from 'react-chartjs-2';
import { Chart as ChartJS, LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(LineElement, CategoryScale, LinearScale, PointElement, Title, Tooltip, Legend);

function PressureChart({ measurements }) {
    const data = {
        labels: measurements.map((_, index) => index + 1), // Utiliser les indices comme labels
        datasets: [
            {
                label: 'Pressure',
                data: measurements.map(m => m.pressure),
                borderColor: 'rgba(153, 102, 255, 1)',
                backgroundColor: 'rgba(153, 102, 255, 0.2)',
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
                text: 'Pressure over time',
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
                    text: 'Pressure (hPa)',
                },
            },
        },
    };

    return <Line data={data} options={options} />;
}

export default PressureChart;
