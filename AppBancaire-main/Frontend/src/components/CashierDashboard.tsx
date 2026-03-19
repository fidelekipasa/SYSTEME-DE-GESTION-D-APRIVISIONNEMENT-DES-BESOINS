'use client'

import React, { useEffect, useState, JSX } from 'react'
import { 
  Search, X, User, CreditCard, DollarSign, RefreshCcw, Plus, 
  Wallet, History, Settings, HelpCircle, Home, Clock, AlertCircle, 
  CheckCircle, ArrowDownRight, ArrowUpRight, Activity, Shield, ArrowRight, Save, Edit2, UserPlus, UserMinus, XCircle, Users, Trash
} from 'lucide-react'

interface Account {
  id: number
  accountNumber: string
  balance: number
  status: string
  user: {
    id: number
    username: string
    fullName: string
    email: string
    phone: string
    address: string
    agency?: {
      id: number
      name: string
    }
  }
}

interface BankCard {
  id?: number;
  cardNumber: string;
  cardType: 'VISA' | 'MASTERCARD';
  accountId: number;
  expirationDate: string;
  cvv: string;
}

interface BankCardDisplay {
  id: number;
  cardNumber: string;
  cardType: string;
  expirationDate: string;
  cvv: string;
}

interface AccountCards {
  [key: number]: BankCardDisplay[];
}

interface Transaction {
  id: number;
  amount: number;
  type: string;
  description: string;
  date: string;
  fromAccount: string;
  toAccount: string;
}

interface NewAccountForm {
  fullName: string;
  email: string;
  phone: string;
  address: string;
  username: string;
  password: string;
  initialBalance: number;
}

interface Notification {
  type: 'success' | 'error';
  message: string;
  details?: string;
  id: number;
  show: boolean;
}

// Ajouter ces interfaces
interface BankOperation {
  type: 'deposit' | 'withdraw' | 'transfer';
  amount: number;
  description?: string;
  toAccountNumber?: string;
}

// Ajouter cette interface pour les logs
interface CashierLog {
  id: number;
  type: 'ACCOUNT_CREATION' | 'ACCOUNT_CLOSURE' | 'DEPOSIT' | 'WITHDRAW' | 'TRANSFER' | 'CARD_CREATION' | 'CARD_DELETION' | 'USER_UPDATE';
  description: string;
  date: string;
  amount?: number;
  accountNumber?: string;
  userName?: string;
  status: 'SUCCESS' | 'FAILED';
  details?: string;
}

// Modifiez l'interface AgencyInfo
interface AgencyInfo {
  id: number;
  name: string;
}

export default function CashierDashboard() {
  const [accounts, setAccounts] = useState<Account[]>([])
  const [filteredAccounts, setFilteredAccounts] = useState<Account[]>([])
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null)
  const [newBalance, setNewBalance] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState<string>('')
  const [error, setError] = useState<string>('')
  const [success, setSuccess] = useState<string>('')
  const [isLoading, setIsLoading] = useState(true)
  const [isPopupOpen, setIsPopupOpen] = useState(false)
  const [showCardForm, setShowCardForm] = useState(false);
  const [newCard, setNewCard] = useState<BankCard>({
    cardNumber: '',
    cardType: 'VISA',
    accountId: 0,
    expirationDate: '',
    cvv: ''
  });
  const [accountCards, setAccountCards] = useState<AccountCards>({});
  const [activeTab, setActiveTab] = useState('home');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [activePopupTab, setActivePopupTab] = useState('account');
  const [editedUser, setEditedUser] = useState<Account['user'] | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [showNewAccountForm, setShowNewAccountForm] = useState(false);
  const [newAccount, setNewAccount] = useState<NewAccountForm>({
      fullName: '',
      email: '',
      phone: '',
    address: '',
    username: '',
    password: '',
    initialBalance: 0
  });
  const [showCloseAccountForm, setShowCloseAccountForm] = useState(false);
  const [selectedAccountToClose, setSelectedAccountToClose] = useState<Account | null>(null);
  const [closeAccountPassword, setCloseAccountPassword] = useState('');
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showOperationForm, setShowOperationForm] = useState(false);
  const [currentOperation, setCurrentOperation] = useState<BankOperation>({
    type: 'deposit',
    amount: 0
  });
  // Ajouter cet état pour la recherche de compte à clôturer
  const [closeAccountSearch, setCloseAccountSearch] = useState('');
  const [filteredAccountsToClose, setFilteredAccountsToClose] = useState<Account[]>([]);
  // Ajouter cet état pour gérer le nombre de transactions affichées
  const [displayCount, setDisplayCount] = useState(10);
  // Dans le composant CashierDashboard, ajouter ces états
  const [logs, setLogs] = useState<CashierLog[]>([]);
  const [logFilter, setLogFilter] = useState<string>('all');
  const [searchLog, setSearchLog] = useState<string>('');
  const [displayedLogs, setDisplayedLogs] = useState<number>(20);
  const [accountTransactions, setAccountTransactions] = useState<Transaction[]>([]);
  // Ajouter un état pour stocker les infos de l'agence
  const [agencyInfo, setAgencyInfo] = useState<AgencyInfo | null>(null);

  // Ajoutez cet useEffect au début pour charger les informations de l'agence
  useEffect(() => {
    const fetchAgencyInfo = async () => {
      try {
        const credentials = localStorage.getItem('credentials');
        const response = await fetch('http://localhost:8080/api/cashier/agency-info', {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Informations de l\'agence reçues:', data);
          setAgencyInfo(data);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des informations de l\'agence:', error);
      }
    };

    fetchAgencyInfo();
  }, []);

  useEffect(() => {
    const fetchData = async () => {
      if (agencyInfo) {
        const fetchedAccounts = await fetchAccounts();
        console.log('Comptes récupérés:', fetchedAccounts);
      }
    };
    
    fetchData();
  }, [agencyInfo]);

  useEffect(() => {
    if (accounts.length > 0) {
      const filtered = accounts.filter(account => 
        account.accountNumber.includes(searchTerm) ||
        account.user.fullName.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredAccounts(filtered);
    }
  }, [searchTerm, accounts]);

  useEffect(() => {
    if (activeTab === 'cards' && accounts.length > 0 && agencyInfo) {
      // Réinitialiser accountCards
      setAccountCards({});
      
      // Charger les cartes pour tous les comptes
      accounts.forEach(account => {
        fetchAccountCards(account.id);
      });
    }
  }, [activeTab, accounts, agencyInfo]);

  useEffect(() => {
    if (selectedAccount) {
      setEditedUser(selectedAccount.user);
    }
  }, [selectedAccount]);

  useEffect(() => {
    if (selectedAccount) {
      fetchAccountTransactions(selectedAccount.id);
    }
  }, [selectedAccount]);

  useEffect(() => {
    const fetchTransactions = async () => {
      try {
        const credentials = localStorage.getItem('credentials');
        const response = await fetch('http://localhost:8080/api/cashier/agency-transactions', {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });

        if (response.ok) {
          const data = await response.json();
          console.log('Transactions reçues:', data); // Pour le débogage
          setTransactions(data);
        } else {
          const error = await response.json();
          console.error('Erreur:', error);
        }
      } catch (error) {
        console.error('Erreur lors du chargement des transactions:', error);
      }
    };

    // Charger les transactions quand on est sur l'onglet home
    if (activeTab === 'home') {
      fetchTransactions();
    }
  }, [activeTab]); // Ajouter activeTab comme dépendance

  useEffect(() => {
    if (activeTab === 'history') {
      fetchLogs();
    }
  }, [activeTab]);

  // Modifiez la fonction fetchAccounts
  const fetchAccounts = async () => {
    setIsLoading(true);
    try {
      const credentials = localStorage.getItem('credentials');
      // Utiliser l'endpoint approprié selon l'onglet actif
      const endpoint = activeTab === 'accounts' ? '/all' : '/agency';
      
      const response = await fetch(`http://localhost:8080/api/cashier/accounts${endpoint}`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Comptes reçus:', data);
        
        const activeAccounts = data.filter((account: Account) => 
          account.status !== 'CLOSED'
        );
        
        setAccounts(activeAccounts);
        setFilteredAccounts(activeAccounts);
        
        return activeAccounts;
      }
      return [];
    } catch (error) {
      console.error('Erreur lors de la récupération des comptes:', error);
      setError('Impossible de charger les comptes. Veuillez réessayer.');
      return [];
    } finally {
      setIsLoading(false);
    }
  };

  // Modifiez l'useEffect pour les comptes
  useEffect(() => {
    if (agencyInfo) {
      console.log('Chargement des comptes avec agencyInfo:', agencyInfo);
      fetchAccounts();
    }
  }, [activeTab, agencyInfo]);

  const handleUpdateBalance = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!selectedAccount) return

    setIsLoading(true)
    try {
      const credentials = localStorage.getItem('credentials')
      const response = await fetch(`http://localhost:8080/api/cashier/accounts/${selectedAccount.id}/balance`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({ balance: parseFloat(newBalance) })
      })

      if (response.ok) {
        setSuccess('Solde mis à jour avec succès')
        fetchAccounts()
        setNewBalance('')
        setSelectedAccount(null)
        setIsPopupOpen(false)
      } else {
        const errorData = await response.text()
        setError(errorData || 'Échec de la mise à jour du solde')
      }
    } catch (error) {
      setError('Erreur lors de la mise à jour du solde')
    } finally {
      setIsLoading(false)
    }
  }

  const generateCardNumber = () => {
    let cardNumber = '';
    for (let i = 0; i < 16; i++) {
      cardNumber += Math.floor(Math.random() * 10).toString();
    }
    return cardNumber.match(/.{1,4}/g)?.join(' ') || '';
  };

  const generateCVV = () => {
    return Math.floor(Math.random() * 900 + 100).toString();
  };

  const formatCardNumber = (value: string) => {
    const v = value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
    const matches = v.match(/\d{4,16}/g);
    const match = (matches && matches[0]) || '';
    const parts = [];

    for (let i = 0, len = match.length; i < len; i += 4) {
      parts.push(match.substring(i, i + 4));
    }

    if (parts.length) {
      return parts.join(' ');
    } else {
      return value;
    }
  };

  const handleCreateCard = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const credentials = localStorage.getItem('credentials');
      
      // Créer l'objet de carte avec le bon format
      const cardData = {
        cardNumber: newCard.cardNumber.replace(/\s/g, ''), // Enlever les espaces
        cardType: newCard.cardType,
        account: {
          id: newCard.accountId
        },
        expirationDate: new Date(newCard.expirationDate + '-01').toISOString().split('T')[0], // Formater la date
        cvv: newCard.cvv
      };

      const response = await fetch('http://localhost:8080/api/cashier/cards', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(cardData)
      });

      if (response.ok) {
        setSuccess('Carte bancaire créée avec succès');
        setShowCardForm(false);
        setNewCard({
          cardNumber: '',
          cardType: 'VISA',
          accountId: 0,
          expirationDate: '',
          cvv: ''
        });
      } else {
        const errorData = await response.text();
        setError(`Erreur lors de la création de la carte: ${errorData}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la création de la carte');
    }
  };

  // Modifiez la fonction fetchAccountCards
  const fetchAccountCards = async (accountId: number) => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(`http://localhost:8080/api/cashier/accounts/${accountId}/cards`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const cards = await response.json();
        if (cards && cards.length > 0) { // Ne mettre à jour que si le compte a des cartes
          setAccountCards(prev => ({
            ...prev,
            [accountId]: cards
          }));
        }
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des cartes:', error);
    }
  };

  // Ajoutez cette fonction helper pour les notifications
  const addNotification = (type: 'success' | 'error', message: string, details?: string) => {
    const newNotification: Notification = {
      type,
      message,
      details,
      id: Date.now(),
      show: true
    };
    setNotifications(prev => [...prev, newNotification]);

    // Retirer la notification après 3 secondes
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotification.id));
    }, 3000);
  };

  // Modifiez la fonction handleDeleteCard
  const handleDeleteCard = async (cardId: number) => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(`http://localhost:8080/api/cashier/cards/${cardId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        // Mettre à jour la liste des cartes
        accounts.forEach(account => {
          fetchAccountCards(account.id);
        });
        addNotification('success', 'Carte supprimée avec succès');
      } else {
        const error = await response.json();
        addNotification('error', 'Erreur lors de la suppression de la carte', error.error);
      }
    } catch (error) {
      console.error('Erreur lors de la suppression de la carte:', error);
      addNotification('error', 'Erreur lors de la suppression de la carte');
    }
  };

  const fetchTransactions = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      // Utiliser le nouvel endpoint pour les transactions de l'agence
      const response = await fetch('http://localhost:8080/api/cashier/agency-transactions', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    }
  };

  const fetchAccountTransactions = async (accountId: number) => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(`http://localhost:8080/api/accounts/${accountId}/transactions`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        const data = await response.json();
        setAccountTransactions(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions du compte:', error);
    }
  };

  const handleAccountClick = (account: Account) => {
    setSelectedAccount(account);
    fetchAccountCards(account.id);
    fetchAccountTransactions(account.id);
    setIsPopupOpen(true);
  };

  const handleUpdateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editedUser || !selectedAccount) return;

    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(`http://localhost:8080/api/cashier/users/${selectedAccount.user.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(editedUser)
      });

      if (response.ok) {
        // Mettre à jour les données localement
        const updatedAccount = {
          ...selectedAccount,
          user: {
            ...selectedAccount.user,
            ...editedUser
          }
        };

        // Mettre à jour l'état des comptes
        setAccounts(prevAccounts => 
          prevAccounts.map(account => 
            account.id === selectedAccount.id ? updatedAccount : account
          )
        );

        // Mettre à jour les comptes filtrés
        setFilteredAccounts(prevAccounts => 
          prevAccounts.map(account => 
            account.id === selectedAccount.id ? updatedAccount : account
          )
        );

        // Mettre à jour le compte sélectionné
        setSelectedAccount(updatedAccount);

        showNotification('success', 'Informations client mises à jour avec succès');
        setIsEditing(false);
      } else {
        showNotification('error', 'Erreur lors de la mise à jour des informations');
      }
    } catch (error) {
      showNotification('error', 'Erreur lors de la mise à jour des informations');
    }
  };

  const handleCreateAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/cashier/accounts/create', {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(newAccount)
      });

      if (response.ok) {
        setSuccess('Compte créé avec succès');
        setShowNewAccountForm(false);
        fetchAccounts();
        setNewAccount({
            fullName: '',
            email: '',
            phone: '',
          address: '',
          username: '',
          password: '',
          initialBalance: 0
        });
      } else {
        const errorData = await response.text();
        setError(`Erreur lors de la création du compte: ${errorData}`);
      }
    } catch (error) {
      console.error('Erreur:', error);
      setError('Erreur lors de la création du compte');
    }
  };

  const handleCloseAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const credentials = localStorage.getItem('credentials');
      const currentTab = activePopupTab; // Sauvegarder l'onglet actif
      
      const response = await fetch(`http://localhost:8080/api/cashier/accounts/${selectedAccountToClose?.id}/close`, {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ password: closeAccountPassword })
      });

      if (response.ok) {
        showNotification('success', 'Compte clôturé avec succès');
        setShowCloseAccountForm(false);
        setSelectedAccountToClose(null);
        setCloseAccountPassword('');
        await fetchAccounts();
        if (selectedAccount) {
          await fetchAccountTransactions(selectedAccount.id);
        }
        setActivePopupTab(currentTab); // Restaurer l'onglet actif
      } else {
        const errorData = await response.json();
        showNotification('error', errorData.message || 'Erreur lors de la clôture du compte');
      }
    } catch (error) {
      showNotification('error', 'Erreur lors de la clôture du compte');
    }
  };

  const showNotification = (type: 'success' | 'error', message: string, details?: string) => {
    const id = Date.now();
    const notification: Notification = { 
      type, 
      message, 
      details, 
      id, 
      show: true 
    };
    
    setNotifications(prev => [...prev, notification]);

    setTimeout(() => {
      setNotifications(prev => 
        prev.map(n => n.id === id ? { ...n, show: false } : n)
      );
      setTimeout(() => {
        setNotifications(prev => prev.filter(n => n.id !== id));
      }, 300);
    }, 3000);
  };

  // Ajouter cette fonction pour gérer les opérations bancaires
  const handleBankOperation = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedAccount) return;

    try {
      const credentials = localStorage.getItem('credentials');
      let endpoint = '';
      let payload: any = {
        amount: currentOperation.amount,
        description: currentOperation.description
      };

      switch (currentOperation.type) {
        case 'deposit':
          endpoint = `/api/cashier/accounts/${selectedAccount.id}/deposit`;
          break;
        case 'withdraw':
          endpoint = `/api/cashier/accounts/${selectedAccount.id}/withdraw`;
          break;
        case 'transfer':
          endpoint = '/api/cashier/accounts/transfer';
          payload = {
            ...payload,
            fromAccountId: selectedAccount.id,
            toAccountNumber: currentOperation.toAccountNumber
          };
          break;
      }

      const response = await fetch(`http://localhost:8080${endpoint}`, {
        method: 'POST',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      const data = await response.json();

      if (response.ok) {
        showNotification('success', data.message);
        const currentTab = activePopupTab;
        
        // Rafraîchir les données
        await fetchAccounts();
        
        // Mettre à jour les transactions
        if (selectedAccount) {
          await fetchAccountTransactions(selectedAccount.id);
        }
        
        // Fermer le formulaire d'opération
        setShowOperationForm(false);
        setCurrentOperation({ type: 'deposit', amount: 0 });
        
        // Restaurer l'onglet actif
        setActivePopupTab(currentTab);

        // Mettre à jour le compte sélectionné
        const updatedAccounts = await fetchAccounts();
        const updatedAccount = updatedAccounts.find((acc: Account) => acc.id === selectedAccount.id);
        if (updatedAccount) {
          setSelectedAccount(updatedAccount);
        }
      } else {
        showNotification('error', data.error);
      }
    } catch (error) {
      showNotification('error', 'Une erreur est survenue lors de l\'opération');
    }
  };

  // Ajouter cette fonction pour filtrer les comptes lors de la recherche
  const handleCloseAccountSearch = (searchValue: string) => {
    setCloseAccountSearch(searchValue);
    
    const filtered = accounts.filter(account => {
      const searchLower = searchValue.toLowerCase();
      return (
        account.accountNumber.toLowerCase().includes(searchLower) ||
        account.user.fullName.toLowerCase().includes(searchLower) ||
        account.user.username.toLowerCase().includes(searchLower)
      );
    });

    setFilteredAccountsToClose(filtered);
  };

  // Ajouter cette fonction pour charger les logs
  const fetchLogs = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/cashier/logs', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setLogs(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des logs:', error);
    }
  };

  const renderContent = () => {
    switch (activeTab) {
      case 'home':
        return (
          <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total des transactions</p>
                    <p className="text-2xl font-bold text-gray-900">{transactions.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Dépôts du jour</p>
                    <p className="text-2xl font-bold text-green-600">
                      {transactions
                        .filter(t => t.type === 'DEPOSIT' && new Date(t.date).toDateString() === new Date().toDateString())
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toFixed(3)} TND
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <ArrowDownRight className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Retraits du jour</p>
                    <p className="text-2xl font-bold text-red-600">
                      {transactions
                        .filter(t => t.type === 'WITHDRAW' && new Date(t.date).toDateString() === new Date().toDateString())
                        .reduce((sum, t) => sum + t.amount, 0)
                        .toFixed(3)} TND
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <ArrowUpRight className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Comptes actifs</p>
                    <p className="text-2xl font-bold text-blue-600">{accounts.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des transactions */}
            <div className="bg-white rounded-xl shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-gray-900">Dernières Transactions</h3>
                  <div className="flex items-center space-x-4">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                      <input
                        type="text"
                        placeholder="Rechercher une transaction..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        className="pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="divide-y divide-gray-100">
                {transactions.map((transaction) => (
                  <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          transaction.type === 'DEPOSIT' ? 'bg-green-100' :
                          transaction.type === 'WITHDRAW' ? 'bg-red-100' :
                          transaction.type === 'TRANSFER' ? 'bg-blue-100' :
                          transaction.type === 'DEBIT' ? 'bg-orange-100' :
                          'bg-purple-100'
                        }`}>
                          {transaction.type === 'DEPOSIT' ? (
                            <ArrowDownRight className="h-5 w-5 text-green-600" />
                          ) : transaction.type === 'WITHDRAW' ? (
                            <ArrowUpRight className="h-5 w-5 text-red-600" />
                          ) : transaction.type === 'TRANSFER' ? (
                            <RefreshCcw className="h-5 w-5 text-blue-600" />
                          ) : transaction.type === 'DEBIT' ? (
                            <ArrowRight className="h-5 w-5 text-orange-600" />
                          ) : (
                            <ArrowRight className="h-5 w-5 text-purple-600" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center space-x-2">
                            <p className="font-medium text-gray-900">
                              {transaction.type === 'DEPOSIT' ? 'Dépôt' :
                               transaction.type === 'WITHDRAW' ? 'Retrait' :
                               transaction.type === 'TRANSFER' ? 'Virement' :
                               transaction.type === 'DEBIT' ? 'Débit' : 'Crédit'}
                            </p>
                            {transaction.type === 'TRANSFER' && (
                              <span className="px-2 py-1 text-xs font-medium rounded-full bg-blue-50 text-blue-600">
                                Virement {transaction.fromAccount === 'CASH' ? 'entrant' : 'sortant'}
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-500">{transaction.description}</p>
                          {(transaction.type === 'TRANSFER' || transaction.type === 'DEBIT' || transaction.type === 'CREDIT') && (
                            <div className="mt-1 text-xs text-gray-500">
                              <p>De: {transaction.fromAccount === 'CASH' ? 'Espèces' : `Compte ${transaction.fromAccount}`}</p>
                              <p>Vers: {transaction.toAccount === 'CASH' ? 'Espèces' : `Compte ${transaction.toAccount}`}</p>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-medium ${
                          transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT' || 
                          (transaction.type === 'TRANSFER' && transaction.fromAccount === 'CASH')
                            ? 'text-green-600' 
                            : 'text-red-600'
                        }`}>
                          {transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT' || 
                           (transaction.type === 'TRANSFER' && transaction.fromAccount === 'CASH') ? '+' : '-'}
                          {transaction.amount.toFixed(3)} TND
                        </p>
                        <p className="text-sm text-gray-500">
                          {new Date(transaction.date).toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: '2-digit',
                            year: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );

      case 'accounts':
        return (
          <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total des comptes</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {accounts.length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Solde total</p>
                    <p className="text-2xl font-bold text-green-600">
                      {accounts.reduce((sum, account) => sum + account.balance, 0).toFixed(2)} €
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Comptes actifs</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {accounts.filter(account => account.balance > 0).length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Barre d'actions */}
            <div className="flex justify-between items-center bg-white rounded-xl shadow-sm p-3 mb-6">
              <div className="relative flex-1 mr-4">
                <div className="relative group">
                  <input
                    type="text"
                    placeholder="Rechercher un compte..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-10 py-2.5 bg-gray-50/50 border border-gray-100 rounded-lg 
                             focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 focus:outline-none
                             placeholder-gray-400 text-gray-600 text-sm
                             transition-all duration-300 ease-in-out
                             group-hover:bg-white group-hover:border-blue-500/20 group-hover:shadow-sm"
                  />
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center">
                    <Search className="h-4 w-4 text-gray-400 group-hover:text-blue-500 
                                   transition-colors duration-300" />
                  </div>
                  {searchTerm && (
                    <button
                      onClick={() => setSearchTerm('')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center"
                    >
                      <div className="p-1 hover:bg-gray-100 rounded-full transition-colors duration-200">
                        <X className="h-3.5 w-3.5 text-gray-400 hover:text-gray-600" />
                      </div>
                    </button>
                  )}
                  
                  {/* Effet de focus */}
                  <div className="absolute inset-0 rounded-lg bg-gradient-to-r from-blue-500/0 via-blue-500/0 to-blue-500/0 
                                   opacity-0 group-hover:opacity-100 transition-opacity duration-300 -z-10 blur-md"></div>
                </div>
              </div>

              <button
                onClick={fetchAccounts}
                className="flex items-center px-4 py-2.5 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] 
                         text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] 
                         transition-all duration-300 shadow-sm hover:shadow-md group text-sm"
              >
                <RefreshCcw className="mr-2 h-4 w-4 group-hover:rotate-180 transition-transform duration-500" />
                <span className="font-medium">Actualiser</span>
              </button>
            </div>

            {/* Liste des comptes */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {isLoading ? (
                Array(6).fill(0).map((_, index) => (
                  <div key={index} className="bg-white rounded-lg shadow-md p-4">
                    <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-2"></div>
                    <div className="h-6 bg-gray-200 rounded w-1/4"></div>
                  </div>
                ))
              ) : (
                filteredAccounts.map((account) => (
                  <div 
                    key={account.id} 
                    onClick={() => handleAccountClick(account)}
                    className="bg-white rounded-xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all duration-300 cursor-pointer group"
                  >
                    {/* En-tête de la carte */}
                    <div className="p-5 border-b border-gray-50">
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg group-hover:bg-blue-100 transition-colors">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{account.user.fullName}</h3>
                            <p className="text-sm text-gray-500">ID: {account.id}</p>
                          </div>
                        </div>
                        <div className="p-1.5 bg-gray-50 rounded-lg group-hover:bg-blue-50 transition-colors">
                          <ArrowRight className="h-4 w-4 text-gray-400 group-hover:text-blue-500" />
                        </div>
                      </div>
                      
                      {/* Numéro de compte */}
                      <div className="flex items-center space-x-2 mb-4 p-2 bg-gray-50 rounded-lg">
                        <CreditCard className="h-4 w-4 text-gray-400" />
                        <span className="text-sm text-gray-600 font-mono">{account.accountNumber}</span>
                      </div>
                    </div>

                    {/* Pied de la carte */}
                    <div className="p-5">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm text-gray-500 mb-1">Solde disponible</p>
                          <p className={`text-lg font-semibold ${
                            account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {account.balance.toFixed(2)} €
                          </p>
                        </div>
                        <div className={`p-2 rounded-lg ${
                          account.balance >= 0 ? 'bg-green-50' : 'bg-red-50'
                        }`}>
                          <DollarSign className={`h-5 w-5 ${
                            account.balance >= 0 ? 'text-green-500' : 'text-red-500'
                          }`} />
                        </div>
                      </div>

                      {/* Informations supplémentaires */}
                      <div className="mt-4 pt-4 border-t border-gray-50">
                        <div className="flex items-center justify-between text-sm">
                          <div className="flex items-center text-gray-500">
                            <CreditCard className="h-4 w-4 mr-1.5" />
                            <span>{accountCards[account.id]?.length || 0} cartes</span>
                          </div>
                          <div className="flex items-center text-gray-500">
                            <Clock className="h-4 w-4 mr-1.5" />
                            <span>Actif</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        );

      case 'cards':
        return (
          <div className="space-y-6">
            {/* En-tête avec barre de recherche */}
            <div className="bg-white rounded-xl shadow-sm p-6">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                  <div>
                    <h2 className="text-xl font-semibold text-gray-800">Gestion des Cartes</h2>
                    <p className="text-sm text-gray-500">
                      {Object.values(accountCards).flat().length} cartes actives
                    </p>
                  </div>
                </div>

                <div className="flex items-center space-x-4">
                  {/* Barre de recherche */}
                  <div className="relative flex-grow max-w-md">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                    <input
                      type="text"
                      placeholder="Rechercher une carte..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>

                  {/* Bouton Nouvelle Carte */}
                  <button
                    onClick={() => {
                      setNewCard({
                        ...newCard,
                        cardNumber: generateCardNumber(),
                        cvv: generateCVV()
                      });
                      setShowCardForm(true);
                    }}
                    className="flex items-center px-4 py-2 bg-gradient-to-r from-blue-600 to-blue-700 
                             text-white rounded-lg hover:from-blue-700 hover:to-blue-800 
                             transition-all duration-300 shadow-md hover:shadow-lg whitespace-nowrap"
                  >
                    <Plus className="mr-2 h-4 w-4" />
                    Nouvelle Carte
                  </button>
                </div>
              </div>
            </div>

            {/* Liste des cartes */}
            <div className="grid grid-cols-1 gap-6">
              {accounts
                .filter(account => accountCards[account.id]?.length > 0)
                .map(account => (
                  <div key={account.id} 
                       className="bg-white rounded-xl shadow-sm overflow-hidden">
                    <div className="p-6">
                      {/* En-tête du compte */}
                      <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
                        <div className="flex items-center space-x-3">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <User className="h-5 w-5 text-blue-600" />
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">{account.user.fullName}</h3>
                            <p className="text-sm text-gray-500">Compte {account.accountNumber}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500">Solde</p>
                          <p className="font-medium text-gray-900">{account.balance.toFixed(3)} TND</p>
                        </div>
                      </div>

                      {/* Liste des cartes du compte */}
                      <div className="space-y-4">
                        {accountCards[account.id]?.map(card => (
                          <div 
                            key={card.id}
                            className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                          >
                            <div className="flex items-center space-x-4">
                              <div className="p-2 bg-white rounded-lg">
                                <CreditCard className="h-5 w-5 text-blue-600" />
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">{card.cardNumber}</p>
                                <p className="text-sm text-gray-500">
                                  {card.cardType} • Expire le {card.expirationDate}
                                </p>
                              </div>
                            </div>
                            
                            <div className="flex items-center space-x-3">
                              <div className="text-right mr-4">
                                <p className="text-xs text-gray-500">CVV</p>
                                <p className="font-medium text-gray-900">{card.cvv}</p>
                              </div>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Message si aucune carte */}
            {Object.values(accountCards).flat().length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 px-4 bg-white rounded-xl shadow-sm">
                <div className="p-4 bg-blue-50 rounded-full mb-4">
                  <CreditCard className="h-12 w-12 text-blue-600" />
                </div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">Aucune carte bancaire</h3>
                <p className="text-gray-500 text-center mb-6">
                  Aucune carte bancaire n'a encore été créée.
                </p>
                <button
                  onClick={() => {
                    setNewCard({
                      ...newCard,
                      cardNumber: generateCardNumber(),
                      cvv: generateCVV()
                    });
                    setShowCardForm(true);
                  }}
                  className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Créer une carte
                </button>
              </div>
            )}
          </div>
        );

      case 'history':
        return (
          <div className="space-y-6">
            {/* En-tête avec statistiques */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Total des opérations</p>
                    <p className="text-2xl font-bold text-gray-900">{logs.length}</p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <Activity className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Opérations du jour</p>
                    <p className="text-2xl font-bold text-green-600">
                      {logs.filter(log => 
                        new Date(log.date).toDateString() === new Date().toDateString()
                      ).length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <Clock className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Comptes créés</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {logs.filter(log => log.type === 'ACCOUNT_CREATION').length}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-50 rounded-xl">
                    <UserPlus className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Comptes clôturés</p>
                    <p className="text-2xl font-bold text-red-600">
                      {logs.filter(log => log.type === 'ACCOUNT_CLOSURE').length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <UserMinus className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Filtres et recherche */}
            <div className="bg-white rounded-xl shadow-sm p-4 space-y-4">
              <div className="flex justify-between items-center">
                <div className="flex space-x-2">
                  <select
                    value={logFilter}
                    onChange={(e) => setLogFilter(e.target.value)}
                    className="px-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="all">Toutes les opérations</option>
                    <option value="ACCOUNT_CREATION">Créations de compte</option>
                    <option value="ACCOUNT_CLOSURE">Clôtures de compte</option>
                    <option value="DEPOSIT">Dépôts</option>
                    <option value="WITHDRAW">Retraits</option>
                    <option value="TRANSFER">Virements</option>
                    <option value="CARD_CREATION">Créations de carte</option>
                    <option value="CARD_DELETION">Suppressions de carte</option>
                    <option value="USER_UPDATE">Modifications client</option>
                  </select>
                </div>

                <div className="relative flex-1 max-w-md ml-4">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                  <input
                    type="text"
                    placeholder="Rechercher dans l'historique..."
                    value={searchLog}
                    onChange={(e) => setSearchLog(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>
            </div>

            {/* Liste des logs */}
            <div className="space-y-4">
              {logs
                .filter(log => logFilter === 'all' || log.type === logFilter)
                .filter(log => 
                  searchLog === '' ||
                  log.description.toLowerCase().includes(searchLog.toLowerCase()) ||
                  (log.accountNumber && log.accountNumber.includes(searchLog)) ||
                  (log.userName && log.userName.toLowerCase().includes(searchLog.toLowerCase()))
                )
                .slice(0, displayedLogs)
                .map((log) => (
                  <div 
                    key={log.id}
                    className="bg-white rounded-xl border border-gray-100 p-4 hover:shadow-md transition-shadow"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          log.type === 'ACCOUNT_CREATION' ? 'bg-green-100' :
                          log.type === 'ACCOUNT_CLOSURE' ? 'bg-red-100' :
                          log.type === 'DEPOSIT' ? 'bg-blue-100' :
                          log.type === 'WITHDRAW' ? 'bg-orange-100' :
                          log.type === 'TRANSFER' ? 'bg-purple-100' :
                          log.type === 'CARD_CREATION' ? 'bg-indigo-100' :
                          log.type === 'CARD_DELETION' ? 'bg-pink-100' :
                          'bg-gray-100'
                        }`}>
                          {log.type === 'ACCOUNT_CREATION' ? <UserPlus className="h-5 w-5 text-green-600" /> :
                           log.type === 'ACCOUNT_CLOSURE' ? <UserMinus className="h-5 w-5 text-red-600" /> :
                           log.type === 'DEPOSIT' ? <ArrowDownRight className="h-5 w-5 text-blue-600" /> :
                           log.type === 'WITHDRAW' ? <ArrowUpRight className="h-5 w-5 text-orange-600" /> :
                           log.type === 'TRANSFER' ? <ArrowRight className="h-5 w-5 text-purple-600" /> :
                           log.type === 'CARD_CREATION' ? <CreditCard className="h-5 w-5 text-indigo-600" /> :
                           log.type === 'CARD_DELETION' ? <X className="h-5 w-5 text-pink-600" /> :
                           <Edit2 className="h-5 w-5 text-gray-600" />}
                        </div>
                        <div>
                          <p className="font-medium text-gray-900">{log.description}</p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <Clock className="h-4 w-4" />
                            <span>{new Date(log.date).toLocaleString('fr-FR')}</span>
                            {log.accountNumber && (
                              <>
                                <span>•</span>
                                <span>Compte {log.accountNumber}</span>
                              </>
                            )}
                            {log.userName && (
                              <>
                                <span>•</span>
                                <span>{log.userName}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        {log.amount && (
                          <p className={`font-medium ${
                            log.type === 'DEPOSIT' ? 'text-green-600' :
                            log.type === 'WITHDRAW' ? 'text-red-600' :
                            'text-gray-900'
                          }`}>
                            {log.type === 'DEPOSIT' ? '+' : '-'} {log.amount.toFixed(3)} TND
                          </p>
                        )}
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          log.status === 'SUCCESS' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {log.status === 'SUCCESS' ? 'Succès' : 'Échec'}
                        </span>
                      </div>
                    </div>
                    {log.details && (
                      <p className="mt-2 text-sm text-gray-500">{log.details}</p>
                    )}
                  </div>
                ))}

              {/* Bouton "Voir plus" */}
              {logs.length > displayedLogs && (
                <div className="text-center">
                  <button
                    onClick={() => setDisplayedLogs(prev => prev + 20)}
                    className="inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700"
                  >
                    Voir plus
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </button>
                </div>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          // Contenu pour les paramètres
          <div className="space-y-6">
            {/* ... Votre code pour les paramètres ... */}
          </div>
        );

      case 'account-management':
        return (
          <div className="space-y-6">
            {/* En-tête */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Comptes ouverts</p>
                    <p className="text-2xl font-bold text-green-600">
                      {accounts.filter(acc => acc.status === 'ACTIVE').length}
                    </p>
                  </div>
                  <div className="p-3 bg-green-50 rounded-xl">
                    <CheckCircle className="h-6 w-6 text-green-600" />
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-500">Comptes clôturés</p>
                    <p className="text-2xl font-bold text-red-600">
                      {accounts.filter(acc => acc.status === 'CLOSED').length}
                    </p>
                  </div>
                  <div className="p-3 bg-red-50 rounded-xl">
                    <XCircle className="h-6 w-6 text-red-600" />
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-semibold text-gray-900">Actions disponibles</h3>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <button
                  onClick={() => setShowNewAccountForm(true)}
                  className="p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-100 rounded-lg">
                      <UserPlus className="h-6 w-6 text-blue-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">Ouvrir un compte</h4>
                      <p className="text-sm text-gray-500">Créer un nouveau compte client</p>
                    </div>
                  </div>
                </button>

                <button
                  onClick={() => setShowCloseAccountForm(true)}
                  className="p-4 bg-gradient-to-r from-red-50 to-red-100 rounded-xl hover:shadow-md transition-all duration-200"
                >
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-100 rounded-lg">
                      <UserMinus className="h-6 w-6 text-red-600" />
                    </div>
                    <div className="text-left">
                      <h4 className="font-medium text-gray-900">Clôturer un compte</h4>
                      <p className="text-sm text-gray-500">Fermer un compte existant</p>
                    </div>
                  </div>
                </button>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-50">
      {/* Sidebar */}
      <div className="fixed top-[67px] left-0 bottom-0 w-80 bg-white shadow-lg border-r border-gray-100">
        <div className="flex flex-col h-full">
          <div className="p-6 border-b border-gray-100">
            <h2 className="text-xl font-semibold text-gray-800">Espace Caissier</h2>
            {agencyInfo && (
              <p className="text-sm text-gray-500">Agence {agencyInfo.name}</p>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 mt-4">
            <div className="space-y-4"> {/* Augmenté l'espacement entre les groupes */}
              {/* Groupe Principal */}
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase">Principal</p>
                {/* Accueil */}
                <button
                  onClick={() => setActiveTab('home')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'home'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Home className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Accueil</span>
                </button>
              </div>

              {/* Groupe Gestion */}
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase">Gestion</p>
                {/* Comptes Clients */}
                <button
                  onClick={() => setActiveTab('accounts')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'accounts'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Comptes Clients</span>
                </button>

                {/* Gestion des Cartes */}
                <button
                  onClick={() => setActiveTab('cards')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'cards'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <CreditCard className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Gestion des Cartes</span>
                </button>

                {/* Ouverture/Clôture */}
                <button
                  onClick={() => setActiveTab('account-management')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'account-management'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Users className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Ouverture/Clôture</span>
                </button>
              </div>

              {/* Groupe Autres */}
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase">Autres</p>
                {/* Historique */}
                <button
                  onClick={() => setActiveTab('history')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <History className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Historique</span>
                </button>

                {/* Paramètres */}
                <button
                  onClick={() => setActiveTab('settings')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'settings'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Settings className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Paramètres</span>
                </button>
              </div>
            </div>
          </nav>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-80 pt-24 p-8">
        {/* En-tête de la page */}
        <div className="w-[95%] mx-auto mb-8">
          <div className="flex items-center">
            <div>
              <h2 className="text-2xl font-bold text-blue-600">
                {activeTab === 'home' ? 'Bienvenue' :
                 activeTab === 'accounts' ? 'Comptes Clients' : 
                 activeTab === 'cards' ? 'Gestion des Cartes' :
                 activeTab === 'history' ? 'Historique' :
                 activeTab === 'account-management' ? 'Ouverture/Clôture' :
                 'Paramètres'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'home' ? 'Espace Caissier' :
                 activeTab === 'accounts' ? 'Gérez les comptes des clients' : 
                 activeTab === 'cards' ? 'Gérez les cartes bancaires' :
                 activeTab === 'history' ? 'Consultez l\'historique des opérations' :
                 activeTab === 'account-management' ? 'Gestion des comptes clients' :
                 'Paramètres'}
              </p>
            </div>
          </div>
        </div>

        {/* Contenu principal basé sur l'onglet actif */}
        <div className="w-[95%] mx-auto">
          {renderContent()}
        </div>
      </div>

      {/* Modal pour la gestion des comptes */}
      {isPopupOpen && selectedAccount && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50">
          <div className="bg-white w-full h-full flex flex-col">
            {/* En-tête du modal */}
            <div className="bg-gradient-to-r from-[#1F53DD] to-[#1941B0] p-6 shadow-lg">
              <div className="flex justify-between items-center max-w-[1400px] mx-auto w-full">
                <div className="flex items-center space-x-4">
                  <div className="p-3 bg-white/10 backdrop-blur-sm rounded-xl">
                    <User className="h-7 w-7 text-white" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold text-white">
                      {selectedAccount.user.fullName}
                    </h2>
                    <p className="text-sm text-white/80 mt-1">
                      Compte N° {selectedAccount.accountNumber}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={() => setIsPopupOpen(false)} 
                  className="p-2 hover:bg-white/10 rounded-xl transition-colors"
                >
                  <X className="h-6 w-6 text-white" />
                </button>
              </div>
            </div>

            {/* Navigation par onglets */}
            <div className="border-b border-gray-100 bg-white shadow-sm">
              <div className="max-w-[1400px] mx-auto w-full flex">
              <button
                onClick={() => setActivePopupTab('account')}
                className={`flex-1 flex items-center justify-center px-6 py-4 border-b-2 font-medium transition-colors ${
                  activePopupTab === 'account'
                    ? 'border-[#1F53DD] text-[#1F53DD] bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Wallet className="mr-2 h-5 w-5" />
                Compte & Solde
              </button>
              <button
                onClick={() => setActivePopupTab('history')}
                className={`flex-1 flex items-center justify-center px-6 py-4 border-b-2 font-medium transition-colors ${
                  activePopupTab === 'history'
                    ? 'border-[#1F53DD] text-[#1F53DD] bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <History className="mr-2 h-5 w-5" />
                Historique
              </button>
              <button
                onClick={() => setActivePopupTab('user')}
                className={`flex-1 flex items-center justify-center px-6 py-4 border-b-2 font-medium transition-colors ${
                  activePopupTab === 'user'
                    ? 'border-[#1F53DD] text-[#1F53DD] bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <User className="mr-2 h-5 w-5" />
                Informations Client
              </button>
              <button
                onClick={() => setActivePopupTab('operations')}
                className={`flex-1 flex items-center justify-center px-6 py-4 border-b-2 font-medium transition-colors ${
                  activePopupTab === 'operations'
                    ? 'border-[#1F53DD] text-[#1F53DD] bg-blue-50'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                }`}
              >
                <Activity className="mr-2 h-5 w-5" />
                Opérations Bancaires
              </button>
              </div>
            </div>

            {/* Contenu des onglets avec scrollbar personnalisée */}
            <div className="flex-1 overflow-y-auto bg-gray-50">
              <div className="max-w-[1400px] mx-auto w-full p-6">
                {activePopupTab === 'account' && (
                  <div className="space-y-6">
                    {/* Stats Cards */}
                    <div className="grid grid-cols-3 gap-4 w-full">
                      <div className="bg-gradient-to-br from-[#1F53DD] to-[#1941B0] rounded-xl p-4 text-white">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <DollarSign className="h-5 w-5" />
                          </div>
                          <h3 className="text-sm font-medium">Solde actuel</h3>
                        </div>
                        <p className="text-2xl font-bold mt-2">{selectedAccount.balance.toFixed(3)} TND</p>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <CreditCard className="h-5 w-5 text-blue-600" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-900">Cartes bancaires</h3>
                        </div>
                        <p className="text-2xl font-bold text-gray-900 mt-2">
                          {accountCards[selectedAccount.id]?.length || 0}
                        </p>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <Activity className="h-5 w-5 text-green-600" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-900">Statut</h3>
                        </div>
                        <p className="text-lg font-semibold text-green-600 mt-2">Compte Actif</p>
                    </div>
                    </div>

                    {/* Actions rapides */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Actions rapides</h3>
                        <div className="grid grid-cols-2 gap-4">
                          {/* Mise à jour du solde */}
                          <form onSubmit={handleUpdateBalance} className="p-4 bg-gray-50 rounded-xl">
                            <div className="space-y-4">
                              <div className="relative">
                                <label className="text-sm font-medium text-gray-700 mb-2 block">
                                  Nouveau solde
                                </label>
                                <input
                                  type="number"
                                  step="0.001"
                                  value={newBalance}
                                  onChange={(e) => setNewBalance(e.target.value)}
                                  className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                                  required
                                />
                                <DollarSign className="absolute left-4 top-[2.4rem] text-gray-400" />
                              </div>
                              <button
                                type="submit"
                                className="w-full bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white py-3 rounded-xl hover:from-[#1941B0] hover:to-[#132F85] transition-colors flex items-center justify-center"
                              >
                                <Save className="mr-2 h-5 w-5" />
                                Mettre à jour
                              </button>
                            </div>
                          </form>

                          {/* Nouvelle carte */}
                          <div className="p-4 bg-gray-50 rounded-xl">
                            <h4 className="text-sm font-medium text-gray-700 mb-4">Ajouter une carte</h4>
                            <button
                              onClick={() => {
                                setNewCard({
                                  ...newCard,
                                  cardNumber: generateCardNumber(),
                                  cvv: generateCVV(),
                                  accountId: selectedAccount.id
                                });
                                setShowCardForm(true);
                              }}
                              className="w-full bg-white border border-blue-200 text-blue-600 py-3 rounded-xl hover:bg-blue-50 transition-colors flex items-center justify-center"
                            >
                              <Plus className="mr-2 h-5 w-5" />
                              Nouvelle carte
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Liste des cartes */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="p-6">
                        <h3 className="text-lg font-semibold text-gray-900 mb-6">Cartes bancaires</h3>
                        <div className="space-y-3">
                          {accountCards[selectedAccount.id]?.map((card) => (
                            <div 
                              key={card.id}
                              className="flex items-center justify-between p-4 bg-gray-50 rounded-xl hover:bg-gray-100 transition-colors"
                            >
                              <div className="flex items-center space-x-4">
                                <div className={`p-2.5 rounded-lg ${
                                  card.cardType === 'VISA' ? 'bg-blue-100' : 'bg-purple-100'
                                }`}>
                                  <CreditCard className={`h-5 w-5 ${
                                    card.cardType === 'VISA' ? 'text-blue-600' : 'text-purple-600'
                                  }`} />
                                </div>
                                <div>
                                  <p className="font-medium text-gray-900">
                                    {card.cardType} •••• {card.cardNumber.slice(-4)}
                                  </p>
                                  <p className="text-sm text-gray-500">
                                    Expire le {new Date(card.expirationDate).toLocaleDateString()}
                                  </p>
                                </div>
                              </div>
                              <button
                                onClick={() => handleDeleteCard(card.id)}
                                className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                              >
                                <Trash size={18} />
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {activePopupTab === 'history' && (
                  <div className="space-y-4">
                    {accountTransactions.slice(0, displayCount).map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between p-4 bg-white rounded-xl border border-gray-100">
                        <div className="flex items-center space-x-4">
                          <div className={`p-2 rounded-lg ${
                            transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT' || transaction.fromAccount === 'CASH' ? 'bg-green-100' :
                            transaction.type === 'WITHDRAW' || transaction.type === 'DEBIT' || transaction.toAccount === 'CASH' ? 'bg-red-100' :
                            transaction.type === 'ACCOUNT_CLOSURE' ? 'bg-gray-100' : 'bg-blue-100'
                          }`}>
                            {transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT' || transaction.fromAccount === 'CASH' ? (
                              <ArrowUpRight className="h-5 w-5 text-green-600" />
                            ) : transaction.type === 'WITHDRAW' || transaction.type === 'DEBIT' || transaction.toAccount === 'CASH' ? (
                              <ArrowDownRight className="h-5 w-5 text-red-600" />
                            ) : transaction.type === 'ACCOUNT_CLOSURE' ? (
                              <XCircle className="h-5 w-5 text-gray-600" />
                            ) : (
                              <ArrowRight className="h-5 w-5 text-blue-600" />
                            )}
                          </div>
                          <div className="space-y-1">
                            <div>
                              <p className="font-medium text-gray-900">
                                {transaction.description}
                              </p>
                              <div className="flex items-center space-x-2 text-xs text-gray-500">
                                <span>{new Date(transaction.date).toLocaleString('fr-FR', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}</span>
                                <span>•</span>
                                <span className="flex items-center">
                                  <Activity className="h-3 w-3 mr-1" />
                                  {transaction.type === 'DEPOSIT' ? 'Dépôt' :
                                   transaction.type === 'WITHDRAW' ? 'Retrait' :
                                   transaction.type === 'CREDIT' ? 'Crédit' :
                                   transaction.type === 'DEBIT' ? 'Débit' :
                                   transaction.type === 'ACCOUNT_CLOSURE' ? 'Clôture de compte' :
                                   transaction.type}
                                </span>
                              </div>
                            </div>
                            <div className="flex items-center space-x-3 text-xs">
                              <span className="flex items-center text-gray-500">
                                <ArrowRight className="h-3 w-3 mr-1" />
                                De: {transaction.fromAccount === 'CASH' ? 'Dépôt en espèces' : 
                                    transaction.fromAccount === selectedAccount?.accountNumber ? 'Ce compte' : 
                                    transaction.fromAccount}
                              </span>
                              <span className="text-gray-400">→</span>
                              <span className="flex items-center text-gray-500">
                                Vers: {transaction.toAccount === 'CASH' ? 'Retrait en espèces' : 
                                      transaction.toAccount === selectedAccount?.accountNumber ? 'Ce compte' : 
                                      transaction.toAccount}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right space-y-1">
                          <span className={`font-medium ${
                            transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT' || transaction.fromAccount === 'CASH' ? 'text-green-600' :
                            transaction.type === 'WITHDRAW' || transaction.type === 'DEBIT' || transaction.toAccount === 'CASH' ? 'text-red-600' :
                            transaction.type === 'ACCOUNT_CLOSURE' ? 'text-gray-600' : 'text-blue-600'
                          }`}>
                            {transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT' || transaction.fromAccount === 'CASH' ? '+' : '-'}
                            {transaction.amount.toFixed(3)} TND
                          </span>
                          <div className="flex items-center justify-end space-x-2">
                            <span className={`px-2 py-0.5 text-xs rounded-full ${
                              transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT' || transaction.fromAccount === 'CASH' 
                                ? 'bg-green-100 text-green-700'
                                : transaction.type === 'WITHDRAW' || transaction.type === 'DEBIT' || transaction.toAccount === 'CASH'
                                ? 'bg-red-100 text-red-700'
                                : transaction.type === 'ACCOUNT_CLOSURE'
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-blue-100 text-blue-700'
                            }`}>
                              {transaction.type === 'DEPOSIT' || transaction.fromAccount === 'CASH' ? 'Dépôt en espèces' :
                               transaction.type === 'WITHDRAW' || transaction.toAccount === 'CASH' ? 'Retrait en espèces' :
                               transaction.type === 'CREDIT' ? 'Virement reçu' :
                               transaction.type === 'DEBIT' ? 'Virement émis' :
                               transaction.type === 'ACCOUNT_CLOSURE' ? 'Solde clôturé' :
                               'Transaction'}
                            </span>
                            <span className="text-xs text-gray-500">
                              {`Il y a ${Math.round((new Date().getTime() - new Date(transaction.date).getTime()) / (1000 * 60))} min`}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}

                    {/* Bouton "Voir plus" */}
                    {accountTransactions.length > displayCount && (
                      <div className="mt-6 text-center">
                        <button
                          onClick={() => setDisplayCount(prev => prev + 10)}
                          className="inline-flex items-center px-4 py-2 text-sm text-blue-600 hover:text-blue-700 font-medium"
                        >
                          Voir plus de transactions
                          <ArrowRight className="ml-2 h-4 w-4" />
                        </button>
                      </div>
                    )}

                    {/* Message si aucune transaction */}
                    {accountTransactions.length === 0 && (
                      <div className="text-center py-12">
                        <History className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <p className="text-gray-500">Aucune transaction à afficher</p>
                      </div>
                    )}
                  </div>
                )}

                {activePopupTab === 'user' && (
                  <div className="space-y-6">
                    {/* En-tte des informations - Version plus compacte */}
                    <div className="grid grid-cols-3 gap-4 w-full">
                      <div className="bg-gradient-to-br from-[#1F53DD] to-[#1941B0] rounded-xl p-4 text-white">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-white/10 rounded-lg">
                            <User className="h-5 w-5" />
                          </div>
                          <h3 className="text-sm font-medium">Client ID</h3>
                        </div>
                        <p className="text-2xl font-bold mt-2">#{selectedAccount.user.id}</p>
                      </div>

                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-green-50 rounded-lg">
                            <Shield className="h-5 w-5 text-green-600" />
                          </div>
                          <h3 className="text-sm font-medium text-gray-900">Statut</h3>
                        </div>
                        <p className="text-lg font-semibold text-green-600 mt-2">Compte Actif</p>
                    </div>

                      <div className="bg-white rounded-xl p-4 border border-gray-100">
                        <div className="flex items-center space-x-3 mb-2">
                          <div className="p-2 bg-blue-50 rounded-lg">
                            <Clock className="h-5 w-5 text-blue-600" />
                        </div>
                          <h3 className="text-sm font-medium text-gray-900">Dernière connexion</h3>
                            </div>
                        <p className="text-sm font-medium text-gray-600 mt-2">
                          {new Date().toLocaleDateString()}
                        </p>
                            </div>
                            </div>

                    {/* Formulaire des informations */}
                    <div className="bg-white rounded-xl border border-gray-100 overflow-hidden">
                      <div className="p-6">
                        <div className="flex justify-between items-center mb-6">
                          <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                            <User className="mr-2 h-5 w-5 text-blue-600" />
                            Informations personnelles
                          </h3>
                          <button
                            onClick={() => {
                              if (!isEditing) {
                                setEditedUser(selectedAccount.user);
                              }
                              setIsEditing(!isEditing);
                            }}
                            className={`flex items-center px-4 py-2 rounded-lg transition-colors ${
                              isEditing 
                                ? 'bg-gray-100 text-gray-700'
                                : 'bg-blue-50 text-blue-600'
                            }`}
                          >
                            {isEditing ? (
                              <>
                                <X className="mr-2 h-4 w-4" />
                                Annuler
                              </>
                            ) : (
                              <>
                                <Edit2 className="mr-2 h-4 w-4" />
                                Modifier
                              </>
                            )}
                          </button>
                            </div>

                        <form onSubmit={handleUpdateUser} className="space-y-6">
                          <div className="grid grid-cols-2 gap-6">
                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Nom complet
                              </label>
                              <input
                                type="text"
                                value={isEditing ? editedUser?.fullName : selectedAccount.user.fullName}
                                onChange={(e) => isEditing && setEditedUser(prev => ({
                                  ...prev!,
                                  fullName: e.target.value
                                }))}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl ${
                                  isEditing 
                                    ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                                    : 'bg-gray-50'
                                }`}
                                readOnly={!isEditing}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Email
                              </label>
                              <input
                                type="email"
                                value={isEditing ? editedUser?.email : selectedAccount.user.email}
                                onChange={(e) => isEditing && setEditedUser(prev => ({
                                  ...prev!,
                                  email: e.target.value
                                }))}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl ${
                                  isEditing 
                                    ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                                    : 'bg-gray-50'
                                }`}
                                readOnly={!isEditing}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Téléphone
                              </label>
                              <input
                                type="tel"
                                value={isEditing ? editedUser?.phone : selectedAccount.user.phone}
                                onChange={(e) => isEditing && setEditedUser(prev => ({
                                  ...prev!,
                                  phone: e.target.value
                                }))}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl ${
                                  isEditing 
                                    ? 'bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent' 
                                    : 'bg-gray-50'
                                }`}
                                readOnly={!isEditing}
                              />
                            </div>

                            <div>
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Nom d'utilisateur
                              </label>
                              <input
                                type="text"
                                value={selectedAccount.user.username}
                                className="w-full px-4 py-3 border border-gray-200 rounded-xl bg-gray-50"
                                readOnly
                              />
                            </div>

                            <div className="col-span-2">
                              <label className="text-sm font-medium text-gray-700 mb-2 block">
                                Adresse
                              </label>
                              <textarea
                                value={isEditing ? editedUser?.address : selectedAccount.user.address}
                                onChange={(e) => isEditing && setEditedUser(prev => ({
                                  ...prev!,
                                  address: e.target.value
                                }))}
                                className={`w-full px-4 py-3 border border-gray-200 rounded-xl ${
                                  isEditing ? 'bg-white focus:ring-2 focus:ring-blue-500' : 'bg-gray-50'
                                }`}
                                readOnly={!isEditing}
                                rows={3}
                              />
                            </div>
                          </div>

                          {isEditing && (
                            <div className="flex justify-end space-x-3 pt-4">
                              <button
                                type="button"
                                onClick={() => {
                                  setIsEditing(false);
                                  setEditedUser(selectedAccount.user);
                                }}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors flex items-center"
                              >
                                <X className="h-5 w-5 mr-2" />
                                Annuler
                              </button>
                              <button
                                type="submit"
                                className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800 transition-colors flex items-center"
                              >
                                <Save className="h-5 w-5 mr-2" />
                                Enregistrer
                              </button>
                            </div>
                          )}
                        </form>
                      </div>
                    </div>
                  </div>
                )}

                {activePopupTab === 'operations' && (
                  <div className="space-y-6">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <button
                        onClick={() => {
                          setCurrentOperation({ type: 'deposit', amount: 0 });
                          setShowOperationForm(true);
                        }}
                        className="p-4 bg-green-50 rounded-xl hover:bg-green-100 transition-colors"
                      >
                        <h3 className="font-medium text-green-700">Dépôt en espèces</h3>
                        <p className="text-sm text-green-600 mt-1">Ajouter des fonds au compte</p>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentOperation({ type: 'withdraw', amount: 0 });
                          setShowOperationForm(true);
                        }}
                        className="p-4 bg-red-50 rounded-xl hover:bg-red-100 transition-colors"
                      >
                        <h3 className="font-medium text-red-700">Retrait en espèces</h3>
                        <p className="text-sm text-red-600 mt-1">Retirer des fonds du compte</p>
                      </button>

                      <button
                        onClick={() => {
                          setCurrentOperation({ type: 'transfer', amount: 0 });
                          setShowOperationForm(true);
                        }}
                        className="p-4 bg-blue-50 rounded-xl hover:bg-blue-100 transition-colors"
                      >
                        <h3 className="font-medium text-blue-700">Virement interne</h3>
                        <p className="text-sm text-blue-600 mt-1">Transfert entre comptes</p>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal pour la création de carte */}
      {showCardForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-[500px] max-w-full">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold flex items-center">
                <CreditCard className="mr-2 text-blue-600" size={24} />
                Créer une Carte Bancaire
              </h2>
              <button
                onClick={() => setShowCardForm(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateCard} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Numéro de carte
                  </label>
                  <div className="relative">
                    <input
                      type="text"
                      value={newCard.cardNumber}
                      onChange={(e) => setNewCard({
                        ...newCard,
                        cardNumber: formatCardNumber(e.target.value)
                      })}
                      maxLength={19}
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md"
                      placeholder="XXXX XXXX XXXX XXXX"
                      required
                    />
                    <CreditCard className="absolute left-3 top-2.5 text-gray-400" size={20} />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Type de carte
                  </label>
                  <select
                    value={newCard.cardType}
                    onChange={(e) => setNewCard({
                      ...newCard,
                      cardType: e.target.value as 'VISA' | 'MASTERCARD'
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="VISA">VISA</option>
                    <option value="MASTERCARD">MASTERCARD</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Date d'expiration
                  </label>
                  <input
                    type="month"
                    value={newCard.expirationDate}
                    onChange={(e) => setNewCard({
                      ...newCard,
                      expirationDate: e.target.value
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    CVV
                  </label>
                  <input
                    type="text"
                    value={newCard.cvv}
                    onChange={(e) => setNewCard({
                      ...newCard,
                      cvv: e.target.value.slice(0, 3)
                    })}
                    maxLength={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compte associé
                  </label>
                  <select
                    value={newCard.accountId}
                    onChange={(e) => setNewCard({
                      ...newCard,
                      accountId: parseInt(e.target.value)
                    })}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md"
                    required
                  >
                    <option value="">Sélectionner un compte</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountNumber} - {account.user.fullName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowCardForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 text-white bg-blue-600 rounded-lg hover:bg-blue-700"
                >
                  Créer la carte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal pour la création de compte */}
      {showNewAccountForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl p-6">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-gray-900 flex items-center">
                <UserPlus className="mr-2 text-blue-600" size={24} />
                Ouverture de compte
              </h2>
              <button
                onClick={() => setShowNewAccountForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleCreateAccount} className="space-y-6">
              {/* Informations personnelles */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-900">Informations personnelles</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom complet
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={newAccount.fullName}
                      onChange={(e) => setNewAccount({...newAccount, fullName: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email
                    </label>
                    <input
                      type="email"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={newAccount.email}
                      onChange={(e) => setNewAccount({...newAccount, email: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Téléphone
                    </label>
                    <input
                      type="tel"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={newAccount.phone}
                      onChange={(e) => setNewAccount({...newAccount, phone: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Adresse
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={newAccount.address}
                      onChange={(e) => setNewAccount({...newAccount, address: e.target.value})}
                    />
                  </div>
                </div>
              </div>

              {/* Informations du compte */}
              <div className="bg-gray-50 p-4 rounded-lg space-y-4">
                <h3 className="font-medium text-gray-900">Informations du compte</h3>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Nom d'utilisateur
                    </label>
                    <input
                      type="text"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={newAccount.username}
                      onChange={(e) => setNewAccount({...newAccount, username: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Mot de passe
                    </label>
                    <input
                      type="password"
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={newAccount.password}
                      onChange={(e) => setNewAccount({...newAccount, password: e.target.value})}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Solde initial
                    </label>
                    <input
                      type="number"
                      required
                      step="0.001"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg"
                      value={newAccount.initialBalance}
                      onChange={(e) => setNewAccount({...newAccount, initialBalance: parseFloat(e.target.value)})}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setShowNewAccountForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-gradient-to-r from-blue-600 to-blue-700 text-white rounded-lg hover:from-blue-700 hover:to-blue-800"
                >
                  Créer le compte
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCloseAccountForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                <UserMinus className="mr-2 text-red-600" size={24} />
                Clôturer un compte
              </h3>
              <button
                onClick={() => {
                  setShowCloseAccountForm(false);
                  setSelectedAccountToClose(null);
                  setCloseAccountPassword('');
                  setCloseAccountSearch('');
                }}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Barre de recherche */}
            <div className="mb-6">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={20} />
                <input
                  type="text"
                  placeholder="Rechercher par numéro de compte, nom du client ou username..."
                  value={closeAccountSearch}
                  onChange={(e) => handleCloseAccountSearch(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>
            </div>

            {/* Liste des comptes filtrés */}
            <div className="max-h-[400px] overflow-y-auto mb-6 space-y-2">
              {/* Logs de débogage cachés */}
              <div style={{ display: 'none' }}>
                {JSON.stringify({
                  comptes: accounts,
                  filtres: filteredAccountsToClose,
                  recherche: closeAccountSearch
                })}
              </div>
              
              {(closeAccountSearch ? filteredAccountsToClose : accounts)
                .filter(account => account.status !== 'CLOSED')
                .map(account => (
                  <div
                    key={account.id}
                    onClick={() => setSelectedAccountToClose(account)}
                    className={`p-4 rounded-lg border cursor-pointer transition-colors ${
                      selectedAccountToClose?.id === account.id
                        ? 'border-red-500 bg-red-50'
                        : 'border-gray-200 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="font-medium text-gray-900">{account.user.fullName}</p>
                        <p className="text-sm text-gray-500">Compte N° {account.accountNumber}</p>
                        <p className="text-sm text-gray-500">Username: {account.user.username}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900">{account.balance.toFixed(3)} TND</p>
                        <p className="text-sm text-gray-500">Solde actuel</p>
                      </div>
                    </div>
                  </div>
                ))}
            </div>

            {/* Formulaire de confirmation */}
            {selectedAccountToClose && (
              <form onSubmit={handleCloseAccount} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe pour confirmation
                  </label>
                  <input
                    type="password"
                    value={closeAccountPassword}
                    onChange={(e) => setCloseAccountPassword(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setShowCloseAccountForm(false);
                      setSelectedAccountToClose(null);
                      setCloseAccountPassword('');
                      setCloseAccountSearch('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center"
                  >
                    <UserMinus size={18} className="mr-2" />
                    Clôturer le compte
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {showOperationForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-lg w-full p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-900 flex items-center">
                {currentOperation.type === 'deposit' ? (
                  <>
                    <DollarSign className="mr-2 text-green-600" size={24} />
                    Dépôt en espèces
                  </>
                ) : currentOperation.type === 'withdraw' ? (
                  <>
                    <ArrowDownRight className="mr-2 text-red-600" size={24} />
                    Retrait en espèces
                  </>
                ) : (
                  <>
                    <ArrowRight className="mr-2 text-blue-600" size={24} />
                    Virement interne
                  </>
                )}
              </h3>
              <button
                onClick={() => setShowOperationForm(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <X size={24} />
              </button>
            </div>

            {/* Informations du compte */}
            <div className="mb-6 bg-gray-50 rounded-xl p-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm text-gray-600">Compte source</span>
                <span className="text-sm font-medium text-gray-900">{selectedAccount?.accountNumber}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Solde disponible</span>
                <span className="text-lg font-semibold text-blue-600">
                  {selectedAccount?.balance.toFixed(3)} TND
                </span>
              </div>
            </div>

            <form onSubmit={handleBankOperation} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant {currentOperation.type === 'withdraw' ? 'à retirer' : 
                            currentOperation.type === 'deposit' ? 'à déposer' : 
                            'à transférer'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      step="0.001"
                      value={currentOperation.amount}
                      onChange={(e) => setCurrentOperation({
                        ...currentOperation,
                        amount: parseFloat(e.target.value)
                      })}
                      className="w-full pl-12 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                      required
                    />
                    <div className="absolute left-3 top-3 text-gray-500">TND</div>
                  </div>
                  {currentOperation.type === 'withdraw' && (
                    <p className="mt-1 text-sm text-gray-500">
                      Solde après retrait: {((selectedAccount?.balance || 0) - (currentOperation.amount || 0)).toFixed(3)} TND
                    </p>
                  )}
                  {currentOperation.type === 'deposit' && (
                    <p className="mt-1 text-sm text-gray-500">
                      Solde après dépôt: {((selectedAccount?.balance || 0) + (currentOperation.amount || 0)).toFixed(3)} TND
                    </p>
                  )}
                </div>

                {currentOperation.type === 'transfer' && (
                  <>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de compte destinataire
                      </label>
                      <input
                        type="text"
                        value={currentOperation.toAccountNumber || ''}
                        onChange={(e) => setCurrentOperation({
                          ...currentOperation,
                          toAccountNumber: e.target.value
                        })}
                        className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                        placeholder="Numéro du compte bénéficiaire"
                        required
                      />
                      <p className="mt-1 text-sm text-gray-500">
                        Solde après transfert: {((selectedAccount?.balance || 0) - (currentOperation.amount || 0)).toFixed(3)} TND
                      </p>
                    </div>
                  </>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Motif / Description
                  </label>
                  <input
                    type="text"
                    value={currentOperation.description || ''}
                    onChange={(e) => setCurrentOperation({
                      ...currentOperation,
                      description: e.target.value
                    })}
                    className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    placeholder={
                      currentOperation.type === 'deposit' ? 'Motif du dépôt' :
                      currentOperation.type === 'withdraw' ? 'Motif du retrait' :
                      'Motif du virement'
                    }
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowOperationForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className={`px-6 py-2 text-white rounded-lg flex items-center ${
                    currentOperation.type === 'deposit' ? 'bg-green-600 hover:bg-green-700' :
                    currentOperation.type === 'withdraw' ? 'bg-red-600 hover:bg-red-700' :
                    'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {currentOperation.type === 'deposit' ? <DollarSign className="mr-2" size={18} /> :
                   currentOperation.type === 'withdraw' ? <ArrowDownRight className="mr-2" size={18} /> :
                   <ArrowRight className="mr-2" size={18} />}
                  Confirmer {
                    currentOperation.type === 'deposit' ? 'le dépôt' :
                    currentOperation.type === 'withdraw' ? 'le retrait' :
                    'le virement'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}  // Ajouter cette fonction pour formater la monnaie
  const formatCurrency = (amount: number): string => {
    return new Intl.NumberFormat('fr-TN', {
      style: 'currency',
      currency: 'TND',
      minimumFractionDigits: 3,
      maximumFractionDigits: 3
    }).format(amount);
  };

