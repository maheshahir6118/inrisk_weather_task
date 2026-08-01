'use client';
import { Line } from 'react-chartjs-2';
// We import exactly all the modular pieces we need from Chart.js to build a standard Line chart
import {
    Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend
} from 'chart.js';

// Setup Chart.js universally for Next.js
ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

// This component receives the S3 JSON response from Dashboard.tsx
export default function WeatherChart({ data }: { data: any }) {
    // If the data is weird or absent, stop running so we don't crash
    if (!data || !data.data || !data.data.daily) return null;

    // Grab the array holding exactly the things we want to plot (Time and Temps)
    const daily = data.data.daily;

    // === CHART JS CONFIGURATION STRUCT ===
    // Chart.js requires a specific JSON format layout
    const chartData = {
        labels: daily.time, // The X-Axis of the chart (Our Dates)
        datasets: [
            {
                label: 'Max Temp (°C)', // The Red Line
                data: daily.temperature_2m_max, // Map the actual array of max temperatures to this line
                borderColor: 'rgb(239, 68, 68)',
                backgroundColor: 'rgba(239, 68, 68, 0.5)',
            },
            {
                label: 'Min Temp (°C)', // The Blue Line
                data: daily.temperature_2m_min, // Map the actual array of min temperatures to this line
                borderColor: 'rgb(59, 130, 246)',
                backgroundColor: 'rgba(59, 130, 246, 0.5)',
            },
        ],
    };

    // Aesthetic settings for the Chart 
    const options = {
        responsive: true,
        maintainAspectRatio: false, // Ensures it can stretch responsively
        plugins: {
            legend: { position: 'top' as const },
            title: { display: true, text: 'Temperature Trends' },
        },
    };

    return (
        <div className="h-[400px] w-full">
            {/* We pass our custom configuration into the official 'Line' tool */}
            <Line options={options} data={chartData} />
        </div>
    );
}
