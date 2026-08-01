import Dashboard from '@/components/Dashboard';

export default function Home() {
    return (
        <div className="space-y-6">
            <header className="border-b pb-4">
                <h1 className="text-3xl font-bold text-gray-900">Weather Explorer Dashboard</h1>
                <p className="text-gray-500 mt-2">InRisk Labs Climate Data Platform</p>
            </header>
            <Dashboard />
        </div>
    )
}
