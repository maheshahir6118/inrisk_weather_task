'use client'; // This directive tells Next.js that this component runs in the browser, not the server.

// Import React hooks. 
// - useState: lets us store variables inside our component that can change (and update the UI when they do).
// - useEffect: lets us run functions automatically (like fetching data when the page first loads).
import { useState, useEffect } from 'react';
import WeatherChart from './WeatherChart';
import WeatherTable from './WeatherTable';

export default function Dashboard() {
    // === STATE VARIABLES ===
    // Loading states so we can show Spinners to the user when waiting for data
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [isFilesLoading, setIsFilesLoading] = useState(false);
    const [isDataLoading, setIsDataLoading] = useState(false);

    // Storing downloaded data
    const [errorMessage, setErrorMessage] = useState<string | null>(null);
    const [storedFilesList, setStoredFilesList] = useState<any[]>([]); // Array of our S3 files
    const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
    const [visualizedData, setVisualizedData] = useState<any>(null); // The actual JSON of the clicked file

    // Form Inputs (with default placeholder values)
    const [lat, setLat] = useState('40.7128');
    const [lon, setLon] = useState('-74.0060');
    const [locationName, setLocationName] = useState('New York');

    // Calculate a default Start Date 14 days ago for the input field
    const [startDate, setStartDate] = useState(() => {
        const pastDate = new Date();
        pastDate.setDate(pastDate.getDate() - 14);
        return pastDate.toISOString().split('T')[0]; // Format it to YYYY-MM-DD
    });

    // Default End Date is today
    const [endDate, setEndDate] = useState(() => {
        return new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    });

    // === ON PAGE LOAD ===
    // useEffect with an empty array [] means "Run this code exactly once when the Dashboard first appears"
    useEffect(() => {
        fetchAllStoredFiles();
    }, []);

    // === FUNCTIONS ===

    // 1. Fetch the list of files stored in S3
    const fetchAllStoredFiles = async () => {
        setIsFilesLoading(true); // Turn on the loading text
        try {
            // Ask our backend API for the list of files
            const response = await fetch('/api/list-weather-files');
            const data = await response.json();

            if (!response.ok) {
                // If something went wrong, throw an Error so it jumps down to 'catch'
                throw new Error(data.error || 'Failed to load files');
            }

            // Update our state with the successful file list
            setStoredFilesList(data.files || []);
        } catch (error: any) {
            console.error(error);
            setErrorMessage(error.message); // Show the error to the user
        }
        setIsFilesLoading(false); // Turn off the loading text
    };

    // 2. Submit the form to fetch new data and save it to S3
    const handleFetchAndStore = async (e: React.FormEvent) => {
        e.preventDefault(); // Stop the webpage from refreshing when the user clicks submit

        setIsSubmitting(true);
        setErrorMessage(null); // Clear any old errors

        try {
            // Package the user's inputs into a nice neat javascript object
            const requestBody = {
                lat: parseFloat(lat), // turn string into number
                lon: parseFloat(lon),
                startDate: startDate,
                endDate: endDate,
                locationName: locationName
            };

            // Send a POST request to our customized backend route
            const response = await fetch('/api/store-weather-data', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(requestBody) // Send the variables as JSON text
            });

            const responseData = await response.json();

            // If the backend threw an error (like "Date range over 31 days"), throw an error
            if (!response.ok) {
                throw new Error(responseData.error || 'Failed to fetch and store data');
            }

            // If successful, instantly re-fetch the file list so the new file appears in the sidebar!
            await fetchAllStoredFiles();
            alert(`Success! Saved as: ${responseData.fileName}`);

        } catch (err: any) {
            setErrorMessage(err.message); // Display error in red box
        }
        setIsSubmitting(false); // Stop the spinner on the button
    };

    // 3. Select and Download a Specific File to Visualize
    const handleSelectFileClick = async (fileKey: string) => {
        setSelectedFileName(fileKey); // Highlight the button the user clicked
        setIsDataLoading(true);       // Show the analytics spinner
        setErrorMessage(null);
        setVisualizedData(null);      // Clear out the old chart

        try {
            // Use encodeURIComponent to safely put the filename into the URL parameters 
            // (in case it has weird characters or spaces)
            const encodedFilename = encodeURIComponent(fileKey);
            const url = `/api/weather-file-content?file=${encodedFilename}`;

            const response = await fetch(url);
            const data = await response.json();

            if (!response.ok) {
                throw new Error(data.error || 'Failed to load this file');
            }

            // SUCCESS! Store the raw JSON data inside the 'visualizedData' variable.
            // This will automatically pass the data down to the Chart and Table components.
            setVisualizedData(data);

        } catch (err: any) {
            setErrorMessage(err.message);
        }
        setIsDataLoading(false);
    };

    // === RENDER HTML UI ===
    return (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">

            {/* ---------------- SIDEBAR (LEFT) ---------------- */}
            <div className="lg:col-span-1 space-y-6">

                {/* Error Banner */}
                {errorMessage && (
                    <div className="p-4 bg-red-50 text-red-700 border-l-4 border-red-500 rounded">
                        {errorMessage}
                    </div>
                )}

                {/* Form Box */}
                <div className="bg-white p-5 rounded-xl shadow-sm border">
                    <h2 className="font-semibold text-lg mb-4 text-gray-800">Fetch New Data</h2>

                    <form onSubmit={handleFetchAndStore} className="space-y-4">
                        {/* Location */}
                        <div>
                            <label className="block text-sm text-gray-600 mb-1">Location Name</label>
                            <input required type="text" className="w-full border rounded p-2 text-sm"
                                value={locationName} onChange={e => setLocationName(e.target.value)} />
                        </div>

                        {/* Lat/Lon */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Latitude</label>
                                <input required type="number" step="any" className="w-full border rounded p-2 text-sm"
                                    value={lat} onChange={e => setLat(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Longitude</label>
                                <input required type="number" step="any" className="w-full border rounded p-2 text-sm"
                                    value={lon} onChange={e => setLon(e.target.value)} />
                            </div>
                        </div>

                        {/* Dates */}
                        <div className="grid grid-cols-2 gap-2">
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">Start Date</label>
                                <input required type="date" className="w-full border rounded p-2 text-sm"
                                    value={startDate} onChange={e => setStartDate(e.target.value)} />
                            </div>
                            <div>
                                <label className="block text-sm text-gray-600 mb-1">End Date</label>
                                <input required type="date" className="w-full border rounded p-2 text-sm"
                                    value={endDate} onChange={e => setEndDate(e.target.value)} />
                            </div>
                        </div>

                        {/* Submit Button */}
                        <button
                            type="submit"
                            disabled={isSubmitting} // Disable clicking while it's processing
                            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-lg flex items-center justify-center disabled:opacity-50"
                        >
                            {/* Show rotating spinner logic based on State */}
                            {isSubmitting ? <div className="spinner w-4 h-4 mr-2" /> : null}
                            {isSubmitting ? 'Processing...' : 'Fetch & Store'}
                        </button>
                    </form>
                </div>

                {/* Stored Files Box */}
                <div className="bg-white p-5 rounded-xl shadow-sm border max-h-[500px] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="font-semibold text-lg text-gray-800">Stored Files</h2>
                        <button onClick={fetchAllStoredFiles} disabled={isFilesLoading} className="text-gray-500 hover:text-blue-600">
                            Refresh
                        </button>
                    </div>

                    <div className="overflow-y-auto flex-1 space-y-2 pr-2">
                        {/* Conditional Rendering logic to show correct state */}
                        {isFilesLoading ? (
                            <div className="text-sm text-gray-500 text-center py-4">Loading files...</div>
                        ) : storedFilesList.length === 0 ? (
                            <div className="text-sm text-gray-500 text-center py-4">No data stored yet.</div>
                        ) : (
                            // Map over the files array and create a button for every single file inside S3!
                            storedFilesList.map((file) => (
                                <button
                                    key={file.key}
                                    onClick={() => handleSelectFileClick(file.key)} // Clicking triggers fetch logic
                                    className={`w-full text-left p-3 rounded-lg border transition-all 
                             ${selectedFileName === file.key ? 'border-blue-500 bg-blue-50' : 'hover:border-gray-300 hover:bg-gray-50'}`}
                                >
                                    {/* File display name cleanup (Removes "weather/" and ".json") */}
                                    <div className="font-medium text-sm truncate text-gray-800" title={file.key}>
                                        {file.key.split('/').pop()?.replace('.json', '')}
                                    </div>
                                    {/* File Metadata (Date and Size) */}
                                    <div className="text-xs text-gray-500 mt-1 flex justify-between">
                                        <span>{new Date(file.lastModified).toLocaleDateString()}</span>
                                        <span>{(file.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </button>
                            ))
                        )}
                    </div>
                </div>
            </div>

            {/* ---------------- MAIN VISUALIZATION AREA (RIGHT) ---------------- */}
            <div className="lg:col-span-3">
                <div className="bg-white p-6 rounded-xl shadow-sm border min-h-[600px] flex flex-col">

                    {/* Conditional Rendering for Analytics Area */}
                    {isDataLoading ? (
                        <div className="flex-1 flex flex-col items-center justify-center text-gray-500">
                            <div className="spinner mb-4 border-blue-500" />
                            <p>Loading analytics...</p>
                        </div>

                    ) : visualizedData ? ( // If we have data, show the Chart and Table!
                        <div className="flex-1">
                            {/* Header Title with Location extracted from JSON metadata */}
                            <div className="mb-6 pb-4 border-b">
                                <h2 className="text-xl font-bold text-gray-800">
                                    Analytics: {visualizedData.metadata.locationName}
                                </h2>
                                <div className="flex text-sm text-gray-500 mt-1 space-x-4">
                                    <span>Lat: {visualizedData.metadata.lat}, Lon: {visualizedData.metadata.lon}</span>
                                    <span>Range: {visualizedData.metadata.startDate} to {visualizedData.metadata.endDate}</span>
                                </div>
                            </div>

                            {/* We pass the visualizedData JSON down to our custom components as a "prop" named "data" */}
                            <WeatherChart data={visualizedData} />
                            <WeatherTable data={visualizedData} />
                        </div>

                    ) : ( // Default state: Nothing has been clicked yet
                        <div className="flex-1 flex items-center justify-center text-gray-400">
                            <p>Select a stored dataset from the sidebar to visualize climatic conditions.</p>
                        </div>
                    )}

                </div>
            </div>

        </div>
    );
}
