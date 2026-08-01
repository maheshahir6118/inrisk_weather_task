export async function fetchHistoricalWeather(lat: number, lon: number, startDate: string, endDate: string) {
    const url = `https://archive-api.open-meteo.com/v1/archive?latitude=${lat}&longitude=${lon}&start_date=${startDate}&end_date=${endDate}&daily=temperature_2m_max,temperature_2m_min,precipitation_sum&timezone=auto`;

    const response = await fetch(url);
    if (!response.ok) {
        throw new Error('Failed to fetch data from Open-Meteo API');
    }

    return response.json();
}
