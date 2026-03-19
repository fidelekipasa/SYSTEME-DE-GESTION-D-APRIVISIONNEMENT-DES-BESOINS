'use client'

import React, { useEffect, useState } from 'react'
import { User, UserPlus, DollarSign, X, Mail, Lock, CreditCard, Building, AlertCircle, CheckCircle, MapPin, Phone, Activity, Search, Plus, ChartBar, Edit2, Trash, Shield, Save } from 'lucide-react'

interface User {
  id: number
  username: string
  email: string
  fullName: string
  role: string
  address: string
  phone: string
}

interface NewUser {
  username: string
  password: string
  email: string
  fullName: string
  role: string
  address: string
  phone: string
}

interface NewAccount {
  accountNumber: string
  balance: number
  userId: string
}

interface Agency {
  id: number;
  code: string;
  name: string;
  address: string;
  phone: string;
  email: string;
  director?: User;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
  details?: string;
  id: number;
  show: boolean;
}

const showNotification = (setNotifications: any, type: string, message: string) => {
  setNotifications([{ type, message, id: Date.now() }]);
  setTimeout(() => setNotifications([]), 3000);
};

export default function AdminDashboard() {
  const [users, setUsers] = useState<User[]>([])
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [showCreateAccountForm, setShowCreateAccountForm] = useState(false)
  const [newUser, setNewUser] = useState<NewUser>({
    username: '',
    password: '',
    email: '',
    fullName: '',
    role: 'USER',
    address: '',
    phone: ''
  })
  const [newAccount, setNewAccount] = useState<NewAccount>({
    accountNumber: '',
    balance: 0,
    userId: ''
  })
  const [showAgencyForm, setShowAgencyForm] = useState(false);
  const [agencies, setAgencies] = useState<Agency[]>([]);
  const [newAgency, setNewAgency] = useState<Omit<Agency, 'id'>>({
    code: '',
    name: '',
    address: '',
    phone: '',
    email: '',
  });
  const [selectedDirectorId, setSelectedDirectorId] = useState<string>('');
  const [activeTab, setActiveTab] = useState('overview');
  const [searchTerm, setSearchTerm] = useState('');
  const [notifications, setNotifications] = useState<Array<{type: string, message: string, id: number}>>([]);
  const [showEditForm, setShowEditForm] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [showEditAgencyForm, setShowEditAgencyForm] = useState(false);
  const [editingAgency, setEditingAgency] = useState<Agency | null>(null);

  useEffect(() => {
    fetchUsers()
    fetchAgencies()
  }, [])

  const getStoredCredentials = () => {
    return localStorage.getItem('credentials') || ''
  }

  const fetchUsers = async () => {
    try {
      const credentials = getStoredCredentials()
      const response = await fetch('http://localhost:8080/api/admin/users', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      })

      if (response.ok) {
        const data = await response.json()
        setUsers(data)
      } else {
        setError('Échec de la récupération des utilisateurs')
      }
    } catch (error) {
      setError('Erreur lors de la récupération des utilisateurs')
    }
  }

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const credentials = getStoredCredentials()
      const response = await fetch('http://localhost:8080/api/admin/users', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        credentials: 'include',
        body: JSON.stringify(newUser)
      })

      if (response.ok) {
        setShowCreateForm(false)
        fetchUsers()
        setNewUser({
          username: '',
          password: '',
          email: '',
          fullName: '',
          role: 'USER',
          address: '',
          phone: ''
        })
        setSuccess('Utilisateur créé avec succès')
      } else {
        setError('Échec de la création de l\'utilisateur')
      }
    } catch (error) {
      setError('Erreur lors de la création de l\'utilisateur')
    }
  }

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const credentials = getStoredCredentials()
      const accountData = {
        accountNumber: newAccount.accountNumber,
        balance: newAccount.balance,
        user: {
          id: parseInt(newAccount.userId)
        }
      }

      const response = await fetch('http://localhost:8080/api/accounts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        credentials: 'include',
        body: JSON.stringify(accountData)
      })

      if (response.ok) {
        setShowCreateAccountForm(false)
        setNewAccount({
          accountNumber: '',
          balance: 0,
          userId: ''
        })
        setSuccess('Compte créé avec succès')
      } else {
        setError('Échec de la création du compte')
      }
    } catch (error) {
      setError('Erreur lors de la création du compte')
    }
  }

  const handleCreateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/admin/agencies', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({
          ...newAgency,
          directorId: selectedDirectorId
        })
      });

      if (response.ok) {
        setShowAgencyForm(false);
        fetchAgencies();
        setSuccess('Agence créée avec succès');
      } else {
        const error = await response.text();
        setError(error);
      }
    } catch (error) {
      setError('Erreur lors de la création de l\'agence');
    }
  };

  const fetchAgencies = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/admin/agencies', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAgencies(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des agences:', error);
    }
  };

  const handleDeleteAgency = async (agencyId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cette agence ?')) {
      return;
    }

    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(`http://localhost:8080/api/admin/agencies/${agencyId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showNotification(setNotifications, 'success', 'Agence supprimée avec succès');
        fetchAgencies(); // Rafraîchir la liste des agences
      } else {
        const error = await response.text();
        showNotification(setNotifications, 'error', error);
      }
    } catch (error) {
      showNotification(setNotifications, 'error', 'Erreur lors de la suppression de l\'agence');
    }
  };

  const handleDeleteUser = async (userId: number) => {
    if (!window.confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur ?')) {
      return;
    }

    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(`http://localhost:8080/api/admin/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showNotification(setNotifications, 'success', 'Utilisateur supprimé avec succès');
        fetchUsers(); // Rafraîchir la liste des utilisateurs
      } else {
        const error = await response.text();
        showNotification(setNotifications, 'error', error);
      }
    } catch (error) {
      showNotification(setNotifications, 'error', 'Erreur lors de la suppression de l\'utilisateur');
    }
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingUser) return;

    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(`http://localhost:8080/api/admin/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify(editingUser)
      });

      if (response.ok) {
        showNotification(setNotifications, 'success', 'Utilisateur modifié avec succès');
        setShowEditForm(false);
        setEditingUser(null);
        fetchUsers();
      } else {
        const error = await response.json();
        showNotification(setNotifications, 'error', error.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      showNotification(setNotifications, 'error', 'Erreur lors de la modification de l\'utilisateur');
    }
  };

  const handleUpdateAgency = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingAgency) return;

    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(`http://localhost:8080/api/admin/agencies/${editingAgency.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({
          ...editingAgency,
          directorId: selectedDirectorId
        })
      });

      if (response.ok) {
        showNotification(setNotifications, 'success', 'Agence modifiée avec succès');
        setShowEditAgencyForm(false);
        setEditingAgency(null);
        fetchAgencies();
      } else {
        const error = await response.json();
        showNotification(setNotifications, 'error', error.message || 'Erreur lors de la modification');
      }
    } catch (error) {
      showNotification(setNotifications, 'error', 'Erreur lors de la modification de l\'agence');
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'overview':
  return (
          <div className="space-y-6">
            {/* Cartes de statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Utilisateurs</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
        </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <User className="h-6 w-6 text-blue-600" />
        </div>
      </div>
              </div>
              
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Agences</p>
                    <p className="text-2xl font-bold text-green-600">{agencies.length}</p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Building className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                  </div>
                  
              {/* Ajoutez d'autres cartes de statistiques selon vos besoins */}
                  </div>
                  
            {/* Actions rapides */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button
                onClick={() => setShowCreateForm(true)}
                className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-blue-100 rounded-lg">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Nouvel Utilisateur</h4>
                    <p className="text-sm text-gray-500">Créer un nouveau compte utilisateur</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setShowCreateAccountForm(true)}
                className="p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-green-100 rounded-lg">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Nouveau Compte</h4>
                    <p className="text-sm text-gray-500">Créer un compte bancaire</p>
                  </div>
                </div>
                  </button>

                  <button
                onClick={() => setShowAgencyForm(true)}
                className="p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:shadow-md transition-all duration-200"
              >
                <div className="flex items-center space-x-3">
                  <div className="p-3 bg-purple-100 rounded-lg">
                    <Building className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="text-left">
                    <h4 className="font-medium text-gray-900">Nouvelle Agence</h4>
                    <p className="text-sm text-gray-500">Créer une nouvelle agence</p>
                  </div>
                </div>
              </button>
            </div>

            {/* Activités récentes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Activités Récentes</h3>
                <Activity className="h-5 w-5 text-gray-400" />
              </div>
              {/* Liste des dernières activités */}
            </div>
          </div>
        );

      case 'users':
        return (
          <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Utilisateurs</p>
                    <p className="text-2xl font-bold text-blue-600">{users.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <User className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Caissiers</p>
                    <p className="text-2xl font-bold text-green-600">
                      {users.filter(u => u.role === 'ROLE_CASHIER').length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Directeurs</p>
                    <p className="text-2xl font-bold text-purple-600">
                      {users.filter(u => u.role === 'ROLE_DIRECTOR').length}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Building className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Barre d'actions */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Barre de recherche */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher un utilisateur par nom, email ou rôle..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => setShowCreateForm(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
                  >
                    <UserPlus size={20} className="mr-2" />
                    Nouvel Utilisateur
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des utilisateurs */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-100 bg-gray-50">
                <div className="grid grid-cols-12 text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <div className="col-span-5">Utilisateur</div>
                  <div className="col-span-3">Contact</div>
                  <div className="col-span-2">Rôle</div>
                  <div className="col-span-2 text-right">Actions</div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {users
                  .filter(user => 
                    user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
                    user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
                  )
                  .map(user => (
                    <div key={user.id} className="px-6 py-4 hover:bg-gray-50 transition-colors">
                      <div className="grid grid-cols-12 items-center gap-4">
                        <div className="col-span-5 flex items-center gap-4 min-w-0">
                          <div className="h-11 w-11 rounded-full bg-gradient-to-br from-blue-100 to-blue-200 flex items-center justify-center text-blue-700 font-semibold">
                            {user.fullName?.charAt(0)?.toUpperCase() || 'U'}
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="font-semibold text-gray-900 truncate">{user.fullName}</p>
                              <span className="text-xs text-gray-500">#{user.id}</span>
                            </div>
                            <p className="text-sm text-gray-500 truncate">@{user.username}</p>
                          </div>
                        </div>

                        <div className="col-span-3 text-sm text-gray-600 space-y-1">
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4 text-gray-400" />
                            <span className="truncate">{user.email}</span>
                          </div>
                          {user.phone && (
                            <div className="flex items-center gap-2">
                              <Phone className="h-4 w-4 text-gray-400" />
                              <span className="truncate">{user.phone}</span>
                            </div>
                          )}
                        </div>

                        <div className="col-span-2">
                          <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                            user.role === 'ROLE_ADMIN' ? 'bg-red-100 text-red-700' :
                            user.role === 'ROLE_CASHIER' ? 'bg-green-100 text-green-700' :
                            user.role === 'ROLE_DIRECTOR' ? 'bg-purple-100 text-purple-700' :
                            'bg-blue-100 text-blue-700'
                          }`}>
                            {user.role.replace('ROLE_', '')}
                          </span>
                        </div>

                        <div className="col-span-2 flex justify-end gap-2">
                          <button
                            onClick={() => {
                              setEditingUser(user);
                              setShowEditForm(true);
                            }}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors"
                          >
                            <Edit2 size={16} />
                            Modifier
                          </button>
                          <button
                            onClick={() => handleDeleteUser(user.id)}
                            className="inline-flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 bg-red-50 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <Trash size={16} />
                            Supprimer
                          </button>
                        </div>
                      </div>

                      {user.address && (
                        <div className="mt-3 flex items-center gap-2 text-sm text-gray-500">
                          <MapPin className="h-4 w-4 text-gray-400" />
                          <span className="truncate">{user.address}</span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            </div>

            {/* Message si aucun utilisateur trouvé */}
            {users.filter(user => 
              user.username.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
              user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucun utilisateur trouvé</p>
              </div>
            )}
          </div>
        );

      case 'agencies':
        return (
          <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total Agences</p>
                    <p className="text-2xl font-bold text-blue-600">{agencies.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Building className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Directeurs Assignés</p>
                    <p className="text-2xl font-bold text-green-600">
                      {agencies.filter(a => a.director).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <User className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Agences Actives</p>
                    <p className="text-2xl font-bold text-purple-600">{agencies.length}</p>
                  </div>
                  <div className="p-3 bg-purple-50 rounded-xl">
                    <Activity className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Barre d'actions */}
            <div className="bg-white rounded-xl shadow-sm p-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                {/* Barre de recherche */}
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher une agence par nom, code ou adresse..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>

                {/* Boutons d'action */}
                <div className="flex items-center space-x-3">
                  <button
                onClick={() => setShowAgencyForm(true)}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-all duration-200 shadow-sm hover:shadow-md"
              >
                    <Plus size={20} className="mr-2" />
                    Nouvelle Agence
                  </button>
                </div>
              </div>
                </div>

            {/* Liste des agences */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {agencies
                .filter(agency => 
                  agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  agency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                  agency.address.toLowerCase().includes(searchTerm.toLowerCase())
                )
                .map(agency => (
                  <div key={agency.id} className="bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-gray-100">
                    <div className="p-6">
                      {/* En-tête de la carte */}
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Building className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{agency.name}</h3>
                            <p className="text-sm text-gray-500">Code: {agency.code}</p>
                          </div>
                        </div>
                      </div>

                      {/* Informations de l'agence */}
                      <div className="space-y-3">
                        <div className="flex items-center text-sm text-gray-600">
                          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
                          {agency.address}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Phone className="h-4 w-4 mr-2 text-gray-400" />
                          {agency.phone}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <Mail className="h-4 w-4 mr-2 text-gray-400" />
                          {agency.email}
                        </div>
                        <div className="flex items-center text-sm text-gray-600">
                          <User className="h-4 w-4 mr-2 text-gray-400" />
                          {agency.director ? agency.director.fullName : 'Aucun directeur assigné'}
                        </div>
                      </div>

                      {/* Actions */}
                      <div className="mt-6 flex items-center justify-end space-x-3 pt-4 border-t border-gray-100">
                        <button
                          onClick={() => {
                            setEditingAgency(agency);
                            setSelectedDirectorId(agency.director?.id.toString() || '');
                            setShowEditAgencyForm(true);
                          }}
                          className="flex items-center px-3 py-1.5 text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors"
                        >
                          <Edit2 size={16} className="mr-1" />
                          Modifier
                        </button>
                        <button
                          onClick={() => handleDeleteAgency(agency.id)}
                          className="flex items-center px-3 py-1.5 text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <Trash size={16} className="mr-1" />
                          Supprimer
                        </button>
                      </div>
                    </div>
                  </div>
                  ))}
            </div>

            {/* Message si aucune agence trouvée */}
            {agencies.filter(agency => 
              agency.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
              agency.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
              agency.address.toLowerCase().includes(searchTerm.toLowerCase())
            ).length === 0 && (
              <div className="text-center py-12 bg-white rounded-xl shadow-sm">
                <Building className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500">Aucune agence trouvée</p>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed top-16 left-0 bottom-0 w-80 bg-white shadow-lg border-r border-gray-100">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Administration</h2>
            <p className="text-sm text-gray-500">Gestion du système</p>
        </div>

          <nav className="flex-1 p-4">
            <div className="space-y-2">
              <button
                onClick={() => setActiveTab('overview')}
                className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all ${
                  activeTab === 'overview' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5 mr-3" />
                Vue d'ensemble
              </button>

                <button
                onClick={() => setActiveTab('users')}
                className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all ${
                  activeTab === 'users' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <User className="h-5 w-5 mr-3" />
                Utilisateurs
                </button>

                <button
                onClick={() => setActiveTab('agencies')}
                className={`flex items-center w-full px-4 py-2.5 rounded-lg transition-all ${
                  activeTab === 'agencies' ? 'bg-blue-50 text-blue-600' : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                <Building className="h-5 w-5 mr-3" />
                Agences
                </button>
              </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-80 p-8 pt-20">
        {renderContent()}
      </div>

      {/* Vos modals existants */}
      {showCreateForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Créer un nouvel utilisateur</h3>
              <button onClick={() => setShowCreateForm(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateUser} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="password"
                    placeholder="Mot de passe"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={newUser.fullName}
                    onChange={(e) => setNewUser({...newUser, fullName: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <select
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="USER">Utilisateur</option>
                    <option value="CASHIER">Caissier</option>
                    <option value="DIRECTOR">Directeur</option>
                    <option value="ADMIN">Administrateur</option>
                  </select>
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={newUser.address}
                    onChange={(e) => setNewUser({...newUser, address: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Téléphone"
                    value={newUser.phone}
                    onChange={(e) => setNewUser({...newUser, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Cration Compte */}
      {showCreateAccountForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Créer un nouveau compte</h3>
              <button onClick={() => setShowCreateAccountForm(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <CreditCard className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Numéro de compte"
                    value={newAccount.accountNumber}
                    onChange={(e) => setNewAccount({...newAccount, accountNumber: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <DollarSign className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="number"
                    step="0.001"
                    placeholder="Solde initial"
                    value={newAccount.balance}
                    onChange={(e) => setNewAccount({...newAccount, balance: Number(e.target.value)})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <select
                    value={newAccount.userId}
                    onChange={(e) => setNewAccount({...newAccount, userId: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un utilisateur</option>
                    {users.filter(user => user.role === 'ROLE_USER').map(user => (
                      <option key={user.id} value={user.id}>
                        {user.fullName} ({user.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowCreateAccountForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Création Agence */}
      {showAgencyForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Créer une nouvelle agence</h3>
              <button onClick={() => setShowAgencyForm(false)}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleCreateAgency} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Building className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Code de l'agence"
                    value={newAgency.code}
                    onChange={(e) => setNewAgency({...newAgency, code: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Building className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Nom de l'agence"
                    value={newAgency.name}
                    onChange={(e) => setNewAgency({...newAgency, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={newAgency.address}
                    onChange={(e) => setNewAgency({...newAgency, address: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Téléphone"
                    value={newAgency.phone}
                    onChange={(e) => setNewAgency({...newAgency, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newAgency.email}
                    onChange={(e) => setNewAgency({...newAgency, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <select
                    value={selectedDirectorId}
                    onChange={(e) => setSelectedDirectorId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un directeur</option>
                    {users.filter(user => user.role === 'ROLE_DIRECTOR').map(director => (
                      <option key={director.id} value={director.id}>
                        {director.fullName} ({director.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAgencyForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Créer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditForm && editingUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Modifier l'utilisateur</h3>
              <button onClick={() => {
                setShowEditForm(false);
                setEditingUser(null);
              }}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateUser} className="space-y-4">
              <div className="space-y-4">
                {/* Nom d'utilisateur */}
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Nom d'utilisateur"
                    value={editingUser.username}
                    onChange={(e) => setEditingUser({...editingUser, username: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Nom complet */}
                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Nom complet"
                    value={editingUser.fullName}
                    onChange={(e) => setEditingUser({...editingUser, fullName: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Email */}
                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="Email"
                    value={editingUser.email}
                    onChange={(e) => setEditingUser({...editingUser, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                {/* Téléphone */}
                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="tel"
                    placeholder="Numéro de téléphone"
                    value={editingUser.phone}
                    onChange={(e) => setEditingUser({...editingUser, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Adresse */}
                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={editingUser.address}
                    onChange={(e) => setEditingUser({...editingUser, address: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                {/* Rôle */}
                <div className="relative">
                  <Shield className="absolute left-3 top-3 text-gray-400" size={20} />
                  <select
                    value={editingUser.role}
                    onChange={(e) => setEditingUser({...editingUser, role: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="ROLE_USER">Utilisateur</option>
                    <option value="ROLE_CASHIER">Caissier</option>
                    <option value="ROLE_DIRECTOR">Directeur</option>
                    <option value="ROLE_ADMIN">Administrateur</option>
                  </select>
                </div>

                {/* Nouveau mot de passe (optionnel) */}
                <div className="relative">
                  <Lock className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="password"
                    placeholder="Nouveau mot de passe (optionnel)"
                    onChange={(e) => setEditingUser({...editingUser, password: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditForm(false);
                    setEditingUser(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center"
                >
                  <Save className="h-5 w-5 mr-2" />
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showEditAgencyForm && editingAgency && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold">Modifier l'agence</h3>
              <button onClick={() => {
                setShowEditAgencyForm(false);
                setEditingAgency(null);
              }}>
                <X className="h-6 w-6 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleUpdateAgency} className="space-y-4">
              <div className="space-y-4">
                <div className="relative">
                  <Building className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Code de l'agence"
                    value={editingAgency.code}
                    onChange={(e) => setEditingAgency({...editingAgency, code: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Building className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Nom de l'agence"
                    value={editingAgency.name}
                    onChange={(e) => setEditingAgency({...editingAgency, name: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <MapPin className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Adresse"
                    value={editingAgency.address}
                    onChange={(e) => setEditingAgency({...editingAgency, address: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Phone className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Téléphone"
                    value={editingAgency.phone}
                    onChange={(e) => setEditingAgency({...editingAgency, phone: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <Mail className="absolute left-3 top-3 text-gray-400" size={20} />
                  <input
                    type="email"
                    placeholder="Email"
                    value={editingAgency.email}
                    onChange={(e) => setEditingAgency({...editingAgency, email: e.target.value})}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>

                <div className="relative">
                  <User className="absolute left-3 top-3 text-gray-400" size={20} />
                  <select
                    value={selectedDirectorId}
                    onChange={(e) => setSelectedDirectorId(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="">Sélectionner un directeur</option>
                    {users.filter(user => user.role === 'ROLE_DIRECTOR').map(director => (
                      <option key={director.id} value={director.id}>
                        {director.fullName} ({director.username})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditAgencyForm(false);
                    setEditingAgency(null);
                  }}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Enregistrer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
