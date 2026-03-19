import React, { useState, useEffect } from 'react';
import { 
  Users, Building2, Activity, TrendingUp, Calendar, 
  ArrowUpRight, ArrowDownRight, Filter, RefreshCcw
} from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

interface AgencyStats {
  transactionCount: number;
  deposits: number;
  withdrawals: number;
  transfersIn: number;
  transfersOut: number;
  totalAmount: number;
}

export default function DirectorAgencyStats() {
  const [timeRange, setTimeRange] = useState<'day' | 'week' | 'month'>('day');
  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [stats, setStats] = useState<AgencyStats | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchStats = async () => {
    setLoading(true);
    try {
      const credentials = localStorage.getItem('credentials');
      
      // Calculer les dates de début et fin
      const startDate = new Date(selectedDate);
      const endDate = new Date(selectedDate);
      
      if (timeRange === 'week') {
        startDate.setDate(startDate.getDate() - startDate.getDay());
        endDate.setDate(endDate.getDate() + (6 - endDate.getDay()));
      } else if (timeRange === 'month') {
        startDate.setDate(1);
        endDate.setMonth(endDate.getMonth() + 1);
        endDate.setDate(0);
      }
      
      // Ajuster les heures pour couvrir toute la journée
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Formater les dates sans le 'Z' à la fin
      const formatDate = (date: Date) => {
        return date.toISOString().slice(0, -1);
      };

      console.log('Fetching stats for period:', {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      });

      const response = await fetch('http://localhost:8080/api/director/statistics/filtered', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          startDate: formatDate(startDate),
          endDate: formatDate(endDate)
        })
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Received stats:', data);
        setStats(data);
      } else {
        const errorData = await response.text();
        console.error('Error response:', errorData);
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, [timeRange, selectedDate]);

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3
    }).format(amount);
  };

  return (
    <div className="space-y-6">
      {/* Contrôles de période - Version moderne */}
      <div className="bg-white rounded-xl shadow-sm p-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center space-x-4">
            {/* Sélecteur de période moderne */}
            <div className="flex bg-gray-50 rounded-lg p-1">
              <button
                onClick={() => setTimeRange('day')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'day'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Jour
              </button>
              <button
                onClick={() => setTimeRange('week')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'week'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Semaine
              </button>
              <button
                onClick={() => setTimeRange('month')}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  timeRange === 'month'
                    ? 'bg-white text-blue-600 shadow-sm'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                Mois
              </button>
            </div>
            
            {/* Sélecteur de date moderne */}
            <div className="relative">
              <div className="flex items-center space-x-2 bg-gray-50 px-4 py-2 rounded-lg cursor-pointer hover:bg-gray-100 transition-colors">
                <Calendar className="h-5 w-5 text-blue-600" />
                <input
                  type="date"
                  value={selectedDate.toISOString().split('T')[0]}
                  onChange={(e) => setSelectedDate(new Date(e.target.value))}
                  className="bg-transparent border-0 text-sm font-medium text-gray-600 focus:ring-0 cursor-pointer"
                />
              </div>
            </div>
          </div>

          {/* Bouton d'actualisation */}
          <button
            onClick={fetchStats}
            className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
          >
            <RefreshCcw className="h-4 w-4" />
            <span>Actualiser</span>
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <>
          {/* Statistiques principales */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Transactions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Transactions</p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats?.transactionCount || 0}
                  </p>
                </div>
                <div className="p-3 bg-blue-50 rounded-xl">
                  <Activity className="h-6 w-6 text-blue-600" />
                </div>
              </div>
            </div>

            {/* Dépôts */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Dépôts</p>
                  <p className="text-2xl font-bold text-green-600">
                    {formatAmount(stats?.deposits || 0)}
                  </p>
                </div>
                <div className="p-3 bg-green-50 rounded-xl">
                  <ArrowDownRight className="h-6 w-6 text-green-600" />
                </div>
              </div>
            </div>

            {/* Retraits */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Total Retraits</p>
                  <p className="text-2xl font-bold text-red-600">
                    {formatAmount(stats?.withdrawals || 0)}
                  </p>
                </div>
                <div className="p-3 bg-red-50 rounded-xl">
                  <ArrowUpRight className="h-6 w-6 text-red-600" />
                </div>
              </div>
            </div>

            {/* Balance */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Balance Totale</p>
                  <p className="text-2xl font-bold text-purple-600">
                    {formatAmount(stats?.totalAmount || 0)}
                  </p>
                </div>
                <div className="p-3 bg-purple-50 rounded-xl">
                  <TrendingUp className="h-6 w-6 text-purple-600" />
                </div>
              </div>
            </div>
          </div>

          {/* Graphiques */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Graphique des transactions */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Répartition des opérations
              </h3>
              <div className="h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={[
                    { name: 'Dépôts', montant: stats?.deposits || 0 },
                    { name: 'Retraits', montant: stats?.withdrawals || 0 },
                    { name: 'Virements reçus', montant: stats?.transfersIn || 0 },
                    { name: 'Virements émis', montant: stats?.transfersOut || 0 }
                  ]}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip formatter={(value) => formatAmount(value as number)} />
                    <Legend />
                    <Bar dataKey="montant" fill="#4F46E5" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Détails des opérations */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <h3 className="text-lg font-semibold text-gray-800 mb-4">
                Détails des opérations
              </h3>
              <div className="space-y-4">
                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Dépôts</p>
                      <p className="text-lg font-semibold text-green-600">
                        {formatAmount(stats?.deposits || 0)}
                      </p>
                    </div>
                    <ArrowDownRight className="h-5 w-5 text-green-600" />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Retraits</p>
                      <p className="text-lg font-semibold text-red-600">
                        {formatAmount(stats?.withdrawals || 0)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-red-600" />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Virements reçus</p>
                      <p className="text-lg font-semibold text-blue-600">
                        {formatAmount(stats?.transfersIn || 0)}
                      </p>
                    </div>
                    <ArrowDownRight className="h-5 w-5 text-blue-600" />
                  </div>
                </div>

                <div className="p-4 bg-gray-50 rounded-lg">
                  <div className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium text-gray-600">Virements émis</p>
                      <p className="text-lg font-semibold text-orange-600">
                        {formatAmount(stats?.transfersOut || 0)}
                      </p>
                    </div>
                    <ArrowUpRight className="h-5 w-5 text-orange-600" />
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
} 