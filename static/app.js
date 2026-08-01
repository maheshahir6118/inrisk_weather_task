const { useState, useEffect, useRef } = React;

function WeatherChart({ data }) {
    const chartRef = useRef(null);
    const chartInstance = useRef(null);
    useEffect(() => {
        if (!data || !data.data || !chartRef.current) return;
        if (chartInstance.current) {
            chartInstance.current.destroy();
        }
        const daily = data.data.daily;
        const ctx = chartRef.current.getContext('2d');
        chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
                labels: daily.time,
                datasets: [
                    {
                        label: 'Max Temp (°C)',
                        data: daily.temperature_2m_max,
                        borderColor: 'rgb(239, 68, 68)',
                        backgroundColor: 'rgba(239, 68, 68, 0.5)',
                        tension: 0.3
                    },
                    {
                        label: 'Min Temp (°C)',
                        data: daily.temperature_2m_min,
                        borderColor: 'rgb(59, 130, 246)',
                        backgroundColor: 'rgba(59, 130, 246, 0.5)',
                        tension: 0.3
                    }
                ]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false
            }
        });
    }, [data]);

    return (
        <div className="h-80 w-full mb-8">
            <canvas ref={chartRef}></canvas>
        </div>
    );
}

function WeatherTable({ data }) {
    const [pageSize, setPageSize] = useState(10);
    const [currentPage, setCurrentPage] = useState(1);

    if (!data || !data.data) return null;
    const daily = data.data.daily;

    // Pagination Math
    const totalRows = daily.time.length;
    const totalPages = Math.ceil(totalRows / pageSize);
    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalRows);

    // Slice the arrays
    const times = daily.time.slice(startIndex, endIndex);
    const maxTemps = daily.temperature_2m_max.slice(startIndex, endIndex);
    const minTemps = daily.temperature_2m_min.slice(startIndex, endIndex);
    const precips = daily.precipitation_sum.slice(startIndex, endIndex);

    return (
        <div className="bg-white rounded-xl shadow-sm border p-6">
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-bold text-slate-800">Daily Variables</h3>
                <select
                    className="border rounded p-2 text-sm outline-none focus:border-blue-500"
                    value={pageSize}
                    onChange={e => { setPageSize(Number(e.target.value)); setCurrentPage(1); }}
                >
                    <option value={10}>10 records per page</option>
                    <option value={20}>20 records per page</option>
                    <option value={50}>50 records per page</option>
                </select>
            </div>

            <div className="overflow-x-auto border rounded-xl">
                <table className="min-w-full divide-y divide-slate-200">
                    <thead className="bg-slate-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Max Temp (°C)</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Min Temp (°C)</th>
                            <th className="px-6 py-3 text-left text-xs font-semibold text-slate-500 uppercase">Precip (mm)</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                        {times.map((date, i) => (
                            <tr key={date} className={i % 2 === 0 ? "bg-white" : "bg-slate-50"}>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-800 font-medium">{date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-red-600 font-bold">{maxTemps[i]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-blue-600 font-bold">{minTemps[i]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">{precips[i]}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Pagination Controls */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-6">
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage(p => p - 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50 font-medium"
                    >
                        Previous
                    </button>
                    <span className="text-sm font-medium text-slate-600">Page {currentPage} of {totalPages}</span>
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage(p => p + 1)}
                        className="px-4 py-2 border rounded-lg disabled:opacity-50 hover:bg-slate-50 font-medium"
                    >
                        Next
                    </button>
                </div>
            )}
        </div>
    );
}

// ==========================================
// COMPONENT 3: Main Dashboard (Parent)
// ==========================================
function App() {
    // Application States
    const [files, setFiles] = useState([]);
    const [selectedData, setSelectedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);

    // Form inputs state
    const [lat, setLat] = useState('40.7128');
    const [lon, setLon] = useState('-74.0060');
    const [locationName, setLocationName] = useState('New York');
    const [startDate, setStartDate] = useState(() => {
        let d = new Date(); d.setDate(d.getDate() - 14); return d.toISOString().split('T')[0];
    });
    const [endDate, setEndDate] = useState(() => new Date().toISOString().split('T')[0]);

    // Load available files automatically on page load
    useEffect(() => {
        fetchFiles();
    }, []);

    // API Call to Python Backend: GET /api/weather-files
    const fetchFiles = async () => {
        try {
            const res = await fetch('/api/weather-files');
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Failed to load files");
            setFiles(data.files || []);
        } catch (err) {
            setError(err.message);
        }
    };

    // API Call to Python Backend: POST /api/weather-fetch
    const handleFetchStore = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        // Date validation: Limit <= 31 days natively exactly like in the backend
        const diffDays = Math.ceil(Math.abs(new Date(endDate) - new Date(startDate)) / (1000 * 60 * 60 * 24));
        if (diffDays > 31) {
            setError("Date range cannot exceed 31 days.");
            setLoading(false);
            return;
        }

        try {
            const res = await fetch('/api/weather-fetch', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    latitude: parseFloat(lat),
                    longitude: parseFloat(lon),
                    start_date: startDate,
                    end_date: endDate,
                    location_name: locationName
                })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.detail || "Fetch failed");

            fetchFiles(); // Refresh side menu
            alert("Data stored in Cloud successfully!");
        } catch (err) {
            setError(err.message);
        }
        setLoading(false);
    };

    // API Call to Python Backend: GET /api/weather-file
    const handleSelectFile = async (key) => {
        try {
            const res = await fetch(`/api/weather-file?key=${encodeURIComponent(key)}`);
            if (!res.ok) throw new Error("Failed to load file contents");

            const data = await res.json();
            setSelectedData(data); // Opens chart!
        } catch (err) {
            alert(err.message);
        }
    };

    return (
        <div className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <header className="mb-8 border-b pb-6">
                <h1 className="text-3xl font-extrabold tracking-tight text-slate-900">Python + React Weather Explorer</h1>
                <p className="text-slate-500 mt-2 font-medium">InRisk Labs Hybrid Deployment</p>
            </header>

            <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
                {/* ---------- SIDEBAR MENU ---------- */}
                <div className="lg:col-span-1 space-y-6">

                    {error && (
                        <div className="bg-red-50 text-red-700 p-4 rounded-xl border border-red-200 shadow-sm text-sm font-medium">
                            {error}
                        </div>
                    )}

                    {/* FORM BOX */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <h2 className="font-bold text-lg text-slate-800 mb-4">Input Panel</h2>
                        <form onSubmit={handleFetchStore} className="space-y-4">
                            <div>
                                <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Location</label>
                                <input required type="text" className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 outline-none focus:border-blue-500 focus:bg-white transition-colors" value={locationName} onChange={e => setLocationName(e.target.value)} />
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Lat</label>
                                    <input required type="number" step="any" className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 outline-none focus:border-blue-500 focus:bg-white" value={lat} onChange={e => setLat(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Lon</label>
                                    <input required type="number" step="any" className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 outline-none focus:border-blue-500 focus:bg-white" value={lon} onChange={e => setLon(e.target.value)} />
                                </div>
                            </div>
                            <div className="grid grid-cols-2 gap-3">
                                <div>
                                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">Start</label>
                                    <input required type="date" className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 outline-none focus:border-blue-500 focus:bg-white" value={startDate} onChange={e => setStartDate(e.target.value)} />
                                </div>
                                <div>
                                    <label className="block text-xs uppercase tracking-wider font-semibold text-slate-500 mb-1">End</label>
                                    <input required type="date" className="w-full border rounded-lg p-2.5 text-sm bg-slate-50 outline-none focus:border-blue-500 focus:bg-white" value={endDate} onChange={e => setEndDate(e.target.value)} />
                                </div>
                            </div>
                            <button disabled={loading} className="w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-4 rounded-lg mt-2 transition-all disabled:opacity-50">
                                {loading ? 'Fetching...' : 'Fetch & Store Data'}
                            </button>
                        </form>
                    </div>

                    {/* S3 FILES COMPONENT */}
                    <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="font-bold text-lg text-slate-800">Stored Files</h2>
                            <button onClick={fetchFiles} className="text-xs uppercase font-bold text-blue-600 hover:text-blue-800 tracking-wider">Refresh</button>
                        </div>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                            {files.length === 0 ? <p className="text-slate-500 text-sm text-center py-4">No data files stored</p> : null}
                            {files.map(f => (
                                <button key={f.key} onClick={() => handleSelectFile(f.key)} className="w-full text-left p-3 rounded-lg border hover:border-blue-300 hover:bg-blue-50 transition-colors">
                                    <div className="font-semibold text-sm truncate text-slate-800">{f.key.split('/').pop().replace('.json', '')}</div>
                                    <div className="text-xs text-slate-500 mt-1 flex justify-between">
                                        <span>{new Date(f.last_modified).toLocaleDateString()}</span>
                                        <span>{(f.size / 1024).toFixed(1)} KB</span>
                                    </div>
                                </button>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ---------- MAIN DASHBOARD AREA ---------- */}
                <div className="lg:col-span-3">
                    {selectedData ? (
                        <div>
                            <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200 mb-6">
                                <h2 className="text-xl font-bold text-slate-800">Analytics: {selectedData.metadata.location_name}</h2>
                                <p className="text-sm font-medium text-slate-500 mt-1">Coordinates: {selectedData.metadata.latitude}, {selectedData.metadata.longitude} &nbsp;•&nbsp; Range: {selectedData.metadata.start_date} to {selectedData.metadata.end_date}</p>
                                <hr className="my-6" />
                                <WeatherChart data={selectedData} />
                            </div>
                            <WeatherTable data={selectedData} />
                        </div>
                    ) : (
                        <div className="bg-white p-12 rounded-xl shadow-sm border border-slate-200 text-center flex flex-col items-center justify-center min-h-[400px]">
                            <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 002-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"></path></svg>
                            <p className="text-slate-500 font-medium">Select a dataset from the sidebar to analyze climatic variables.</p>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(<App />);
