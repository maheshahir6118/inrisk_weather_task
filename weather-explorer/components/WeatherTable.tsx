'use client';
import { useState } from 'react';

// This component receives the AWS JSON via a Prop called 'data'
export default function WeatherTable({ data }: { data: any }) {

    // === STATE VARIABLES FOR PAGINATION ===
    const [pageSize, setPageSize] = useState(10); // How many rows to show per page (defaults to 10)
    const [currentPage, setCurrentPage] = useState(1); // What page are we currently looking at

    // If we don't have valid data, return null so it doesn't crash the website
    if (!data || !data.data || !data.data.daily) return null;

    // Extract variables for easier reading
    const daily = data.data.daily;

    // === PAGINATION MATH ===
    // E.g. If there are 30 total rows...
    const totalRows = daily.time.length;
    // totalPages = 30 / 10 = 3 total pages
    const totalPages = Math.ceil(totalRows / pageSize);

    // If we are on Page 2, (2-1) * 10 = 10. Start Index is row #10.
    const startIndex = (currentPage - 1) * pageSize;
    // End Index is row 10 + 10 = 20. But make sure it doesn't exceed totalRows.
    const endIndex = Math.min(startIndex + pageSize, totalRows);

    // Use the javascript .slice() function to "cut out" just the piece of the array we need for this current page
    const paginatedTime = daily.time.slice(startIndex, endIndex);
    const paginatedMax = daily.temperature_2m_max.slice(startIndex, endIndex);
    const paginatedMin = daily.temperature_2m_min.slice(startIndex, endIndex);
    const paginatedPrecip = daily.precipitation_sum.slice(startIndex, endIndex);

    // === RENDER HTML TABLE ===
    return (
        <div className="mt-6">

            {/* Controls Container */}
            <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Daily Data</h3>

                {/* Dropdown to change how many rows display */}
                <select
                    value={pageSize}
                    onChange={(e) => {
                        setPageSize(Number(e.target.value));
                        setCurrentPage(1); // Always reset back to page 1 when the user changes row counts
                    }}
                    className="border rounded p-1 text-sm bg-white"
                >
                    <option value={10}>10 rows</option>
                    <option value={20}>20 rows</option>
                    <option value={50}>50 rows</option>
                </select>
            </div>

            {/* The actual Table */}
            <div className="overflow-x-auto border rounded-lg">
                <table className="min-w-full divide-y divide-gray-200">

                    <thead className="bg-gray-50">
                        <tr>
                            {/* Table Headers */}
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Max Temp (°C)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Min Temp (°C)</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Precip (mm)</th>
                        </tr>
                    </thead>

                    <tbody className="bg-white divide-y divide-gray-200">
                        {/* 
               We loop (map) over exactly just the sliced array of dates to render the rows.
               The variable 'i' is the current index of the loop (0, 1, 2, 3...)
            */}
                        {paginatedTime.map((date: string, i: number) => (
                            <tr key={date} className={i % 2 === 0 ? 'bg-white' : 'bg-gray-50' /* Gives overlapping row colors */}>

                                {/* We use [i] to grab the exact matching temperature for that specific date in the arrays */}
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{date}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-red-600">{paginatedMax[i]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-blue-600">{paginatedMin[i]}</td>
                                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{paginatedPrecip[i]}</td>

                            </tr>
                        ))}
                    </tbody>

                </table>
            </div>

            {/* 
          Bottom Pagination Navigation
          Don't show this if everything fits completely on page 1 
      */}
            {totalPages > 1 && (
                <div className="flex justify-between items-center mt-4">

                    {/* Previous Button (Disabled if we are on Page 1) */}
                    <button
                        disabled={currentPage === 1}
                        onClick={() => setCurrentPage((prev) => prev - 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                        Previous
                    </button>

                    {/* Middle Text display */}
                    <span className="text-sm text-gray-600">Page {currentPage} of {totalPages}</span>

                    {/* Next Button (Disabled if we reach the absolute last page) */}
                    <button
                        disabled={currentPage === totalPages}
                        onClick={() => setCurrentPage((prev) => prev + 1)}
                        className="px-3 py-1 border rounded disabled:opacity-50 hover:bg-gray-50"
                    >
                        Next
                    </button>

                </div>
            )}

        </div>
    );
}
