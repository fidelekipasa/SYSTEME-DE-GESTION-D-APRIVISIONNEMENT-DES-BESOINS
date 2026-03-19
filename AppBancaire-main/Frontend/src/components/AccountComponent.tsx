'use client'

import React, { useEffect, useState, useCallback } from 'react'
import { ArrowRight, CreditCard, DollarSign, X, User, Settings, LogOut, Home, Wallet, History, Send, TrendingUp, TrendingDown, Activity, PieChart, ArrowUpRight, ArrowDownRight, Download, HelpCircle, Clock, Bell, Calendar, ChevronDown, Tag, FileText, ArrowDownLeft, Receipt, Zap, Droplets, Wifi, Phone, Car, Search, Mail, MapPin, Shield, AlertCircle, CheckCircle, Lock, Key, Save, Coins, Banknote, CircleDollarSign, WalletCards, XCircle } from 'lucide-react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  BarElement,
  Filler  // Ajouter cet import
} from 'chart.js';
import { Line, Pie, Bar } from 'react-chartjs-2';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import autoTable from 'jspdf-autotable';
import { Doughnut } from 'react-chartjs-2';
import ProfileComponent from './ProfileComponent';
import { useNavigate } from 'react-router-dom';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
  Filler  // Ajouter Filler ici
);

interface Account {
  id: number
  accountNumber: string
  balance: number
  lastTransaction?: Transaction
}

interface TransferData {
  fromAccountId: number
  toAccountNumber: string
  amount: number
  password: string
  beneficiaryName: string
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

interface TransferFormData {
  fromAccountId: number;
  toAccountNumber: string;
  amount: number;
  password: string;
  beneficiaryName: string;
  isScheduled: boolean;
  scheduledDate?: string;
  scheduledTime?: string;
}

interface VirementProgramme {
  id: number;
  compteSource: Account;
  numeroCompteDestination: string;
  beneficiaireName: string;
  montant: number;
  dateExecution: string;
  executed: boolean;
  status: 'EN_ATTENTE' | 'EXECUTE' | 'REFUSE'; // Ajouter cette ligne
  refusReason?: string; // Ajouter cette ligne
}

interface PDFData {
  raw: string;
}

// Ajouter l'interface BankCard
interface BankCard {
  id: number;
  cardNumber: string;
  cardType: 'VISA' | 'MASTERCARD';
  expirationDate: string;
  cvv: string;
}

// Fonctions utilitaires (pas de hooks ici)
const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('fr-TN', {
    style: 'currency',
    currency: 'TND',
    minimumFractionDigits: 3,
    maximumFractionDigits: 3
  }).format(amount);
};

const formatMontantPropre = (montant: number, type?: string) => {
  const nombreAbsolu = Math.abs(montant);
  const signe = type === 'CREDIT' ? '+' : type === 'DEBIT' ? '-' : '';
  
  // Formater le nombre avec des espaces pour les milliers
  const partieEntiere = Math.floor(nombreAbsolu).toString().split('').reverse()
    .reduce((acc, digit, i) => {
      return digit + (i && i % 3 === 0 ? ' ' : '') + acc;
    }, '');
  
  // Ajouter les millimes (3 décimales pour le dinar tunisien)
  const millimes = (nombreAbsolu % 1).toFixed(3).substring(2);
  
  return `${signe}${partieEntiere}.${millimes} TND`;
};

const fetchAccounts = async (): Promise<Account[]> => {
  try {
    const credentials = localStorage.getItem('credentials');
    if (!credentials) {
      throw new Error('No credentials found');
    }
    
    const response = await fetch('http://localhost:8080/api/accounts', {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) {
      throw new Error('Failed to fetch accounts');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching accounts:', error);
    throw error;
  }
};

// Ajouter ces interfaces
interface BillPaymentForm {
  accountId: number;
  reference: string;
  amount: number;
  serviceType: 'electricity' | 'water' | 'internet' | 'phone' | 'tax' | 'insurance';
  password: string;
}

// Ajouter cette interface pour les factures
interface PaidBill {
  id: number;
  serviceType: string;
  amount: number;
  reference: string;
  date: string;
  status: 'PAID' | 'PENDING';
  accountNumber: string;
}

// Ajouter cette fonction pour récupérer la dernière transaction d'un compte
const fetchLastTransaction = async (accountId: number) => {
  try {
    const credentials = localStorage.getItem('credentials');
    const response = await fetch(`http://localhost:8080/api/accounts/${accountId}/transactions?limit=1`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (response.ok) {
      const transactions = await response.json();
      return transactions[0] || null;
    }
    return null;
  } catch (error) {
    console.error('Erreur lors de la récupération de la dernière transaction:', error);
    return null;
  }
};

// Ajouter cette interface après les autres interfaces
interface Notification {
  type: 'success' | 'error';
  message: string;
  details?: string;
  id: number;
  show: boolean;
}

// Ajouter cette interface pour les erreurs
interface CustomError {
  message: string;
}

interface AccountComponentProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
}

// Modifier l'interface Notification
interface Notification {
  type: 'success' | 'error';
  message: string;
  details?: string;
  id: number;
  show: boolean;
}

// Ajouter l'interface pour les props de NotificationContainer
interface NotificationContainerProps {
  notifications: Notification[];
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>;
}

// Modifier le composant NotificationContainer pour accepter les props
const NotificationContainer: React.FC<NotificationContainerProps> = ({ notifications, setNotifications }) => (
  <>
    {notifications.map((notification) => (
      <div
        key={notification.id}
        className={`fixed inset-0 flex items-center justify-center z-[9999]`} // Augmenter le z-index ici
        style={{
          pointerEvents: notification.show ? 'auto' : 'none',
          opacity: notification.show ? 1 : 0,
          transition: 'opacity 300ms ease-in-out'
        }}
      >
        <div className="fixed inset-0 bg-black bg-opacity-25 backdrop-blur-sm" />
        <div
          className={`
            relative transform transition-all duration-300 ease-out
            ${notification.show ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0'}
            max-w-md w-full bg-white rounded-xl shadow-2xl overflow-hidden
          `}
        >
          <div className="p-6">
            <div className="flex items-start space-x-4">
              {notification.type === 'success' ? (
                <div className="flex-shrink-0 w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-7 w-7 text-green-600" />
                </div>
              ) : (
                <div className="flex-shrink-0 w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                  <AlertCircle className="h-7 w-7 text-red-600" />
                </div>
              )}
              <div className="flex-1">
                <h3 className={`text-lg font-semibold ${
                  notification.type === 'success' ? 'text-green-800' : 'text-red-800'
                }`}>
                  {notification.type === 'success' ? 'Succès' : 'Erreur'}
                </h3>
                <p className="mt-1 text-sm text-gray-600">
                  {notification.message}
                </p>
                {notification.details && (
                  <p className="mt-2 text-sm text-gray-500">
                    {notification.details}
                  </p>
                )}
              </div>
              <button
                onClick={() => setNotifications(prev => 
                  prev.filter(n => n.id !== notification.id)
                )}
                className="flex-shrink-0"
              >
                <X 
                  size={20} 
                  className={`
                    ${notification.type === 'success' ? 'text-green-500' : 'text-red-500'}
                    hover:opacity-75 transition-opacity
                  `} 
                />
              </button>
            </div>
          </div>
          <div className="relative h-1 bg-gray-100">
            <div 
              className={`absolute left-0 h-full ${
                notification.type === 'success' ? 'bg-green-500' : 'bg-red-500'
              }`}
              style={{
                animation: 'expand 3s linear forwards'
              }}
            />
          </div>
        </div>
      </div>
    ))}
  </>
);

// Modifier la fonction showNotification
const showNotification = (
  setNotifications: React.Dispatch<React.SetStateAction<Notification[]>>, 
  type: 'success' | 'error', 
  message: string,
  details?: string
) => {
  const id = Date.now();
  const notification: Notification = { type, message, details, id, show: true };
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

// Ajouter cette interface pour les erreurs API
interface APIError {
  error?: string;
  message?: string;
}

// Ajouter cette interface en haut du fichier
type Color = string | [number, number, number];

// Composant principal
export default function AccountComponent({ activeTab, setActiveTab }: AccountComponentProps) {
  const navigate = useNavigate();

  // Tous les états sont déclarés ici
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [accountCards, setAccountCards] = useState<{ [key: number]: BankCard[] }>({});
  const [formData, setFormData] = useState<TransferFormData>({
    fromAccountId: 0,
    toAccountNumber: '',
    amount: 0,
    password: '',
    beneficiaryName: '',
    isScheduled: false,
    scheduledDate: '',
    scheduledTime: ''
  });
  const [isLoading, setIsLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoadingTransactions, setIsLoadingTransactions] = useState(false);
  const [statistics, setStatistics] = useState<any>(null);
  const [expenseStats, setExpenseStats] = useState<any>(null);
  const [balanceHistory, setBalanceHistory] = useState<any>(null);
  const [lastTransaction, setLastTransaction] = useState<Transaction | null>(null);
  const [monthlyStats, setMonthlyStats] = useState({
    credits: 0,
    debits: 0
  });
  const [transactionStats, setTransactionStats] = useState<any>(null);
  const [virementsProgrammes, setVirementsProgrammes] = useState<VirementProgramme[]>([]);
  const [showBillForm, setShowBillForm] = useState(false);
  const [selectedService, setSelectedService] = useState<BillPaymentForm['serviceType'] | null>(null);
  const [billForm, setBillForm] = useState<BillPaymentForm>({
    accountId: 0,
    reference: '',
    amount: 0,
    serviceType: 'electricity',
    password: ''
  });
  const [paidBills, setPaidBills] = useState<PaidBill[]>([]);
  const [selectedAccountForHistory, setSelectedAccountForHistory] = useState<Account | null>(null);
  const [showProfile, setShowProfile] = useState(false);

  // Nouveaux états pour la gestion du profil
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [profileData, setProfileData] = useState<any>(null);

  // Dans le composant AccountComponent, ajouter cet état
  const [notifications, setNotifications] = useState<Notification[]>([]);

  // Ajouter un état pour stocker les informations de l'agence
  const [agencyInfo, setAgencyInfo] = useState<{ name: string } | null>(null);

  // Effet pour charger les données du profil
  useEffect(() => {
    if (activeTab === 'settings') {
      fetchProfileData();
    }
  }, [activeTab]);

  // Fonction pour récupérer les données du profil
  const fetchProfileData = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/users/profile', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setProfileData(data);
      } else {
        showNotification(setNotifications, 'error', 'Erreur lors du chargement du profil');
      }
    } catch (error) {
      showNotification(setNotifications, 'error', 'Erreur de connexion');
    }
  };

  // Fonction pour mettre à jour le profil
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      const credentials = localStorage.getItem('credentials');
      const updateData: any = {
        email: profileData?.email,
        phone: profileData?.phone,
        address: profileData?.address
      };

      // Ajouter les informations de mot de passe si nécessaire
      if (newPassword) {
        if (newPassword !== confirmPassword) {
          showNotification(setNotifications, 'error', 'Les mots de passe ne correspondent pas');
          setIsLoading(false);
          return;
        }
        updateData.currentPassword = currentPassword;
        updateData.newPassword = newPassword;
      }

      const response = await fetch('http://localhost:8080/api/users/profile/update', {
        method: 'PUT',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(updateData)
      });

      if (response.ok) {
        showNotification(setNotifications, 'success', 'Profil mis à jour avec succès');
        // Réinitialiser les champs
        setCurrentPassword('');
        setNewPassword('');
        setConfirmPassword('');
        // Recharger les données du profil
        fetchProfileData();
      } else {
        const errorData = await response.text();
        showNotification(setNotifications, 'error', errorData || 'Erreur lors de la mise à jour du profil');
      }
    } catch (error) {
      showNotification(setNotifications, 'error', 'Erreur lors de la mise à jour du profil');
    } finally {
      setIsLoading(false);
    }
  };

  // Ajouter cet useEffect pour charger les données du profil
  useEffect(() => {
    if (activeTab === 'profile') {
      fetchProfileData();
    }
  }, [activeTab]);

  // Fonctions du composant
  const fetchAccountCards = async (accountId: number) => {
    try {
      const credentials = localStorage.getItem('credentials');
      if (!credentials) {
        console.error('No credentials found');
        return;
      }

      const response = await fetch(`http://localhost:8080/api/accounts/${accountId}/cards`, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

        const cards = await response.json();
        setAccountCards(prev => ({
          ...prev,
          [accountId]: cards
        }));
    } catch (error) {
      if (error instanceof Error) {
        console.error('Erreur lors de la récupération des cartes:', error.message);
      } else {
        console.error('Erreur inconnue lors de la récupération des cartes');
      }
    }
  };

const generatePDF = async (account: Account) => {
  try {
    const credentials = localStorage.getItem('credentials');
    const response = await fetch(`http://localhost:8080/api/accounts/${account.id}/transactions`, {
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      },
      credentials: 'include'
    });

    if (!response.ok) throw new Error('Erreur lors de la récupération des transactions');
    const transactions = await response.json();

    const pdf = new jsPDF();
    const pageWidth = pdf.internal.pageSize.getWidth();
    
    // En-tête avec dégradé plus compact
    pdf.setFillColor(31, 83, 221);
    pdf.rect(0, 0, pageWidth, 40, 'F');

    // Logo et titre plus compacts
    pdf.setTextColor(255, 255, 255);
    pdf.setFontSize(20);
    pdf.setFont('helvetica', 'bold');
    pdf.text('DevByFedi Bank', 15, 20);
    pdf.setFontSize(12);
    pdf.text('Relevé de compte', 15, 30);

    // Informations du compte plus compactes
    pdf.setDrawColor(230, 230, 230);
    pdf.setFillColor(249, 250, 251);
    pdf.rect(15, 45, pageWidth - 30, 35, 'FD');
    
    pdf.setTextColor(0, 0, 0);
    pdf.setFontSize(10);
    pdf.text([
      `N° de compte : ${account.accountNumber}`,
      `Date d'édition : ${new Date().toLocaleDateString('fr-FR')}`,
      `Solde actuel : ${formatMontantPropre(account.balance)}`
    ], 20, 55);

    // Préparer les données avec les styles de couleur appropriés
    const tableData = transactions.map((t: Transaction) => [
      `${new Date(t.date).toLocaleDateString('fr-FR')} ${new Date(t.date).toLocaleTimeString('fr-FR')}`,
      t.description,
      t.type === 'CREDIT' ? 'Crédit' : 'Débit',
      {
        content: formatMontantPropre(t.amount, t.type),
        styles: {
          textColor: t.type === 'CREDIT' ? '#2E7D32' : '#D32F2F'
        }
      }
    ]);

    // Puis utiliser ces données dans autoTable
    autoTable(pdf, {
      startY: 90,
      head: [['Date', 'Description', 'Type', 'Montant']],
      body: tableData,
      theme: 'grid',
      styles: {
        font: 'helvetica',
        fontSize: 9,
        cellPadding: 4,
        overflow: 'linebreak',
        cellWidth: 'wrap',
        halign: 'left',
        valign: 'middle',
        lineWidth: 0.1
      },
      headStyles: {
        fillColor: [31, 83, 221],
        textColor: [255, 255, 255],
        fontStyle: 'bold',
        halign: 'left'
      },
      columnStyles: {
        0: { cellWidth: 45 },
        1: { cellWidth: 'auto' },
        2: { cellWidth: 30, halign: 'center' },
        3: { 
          cellWidth: 35, 
          halign: 'right',
          fontStyle: 'bold',
          // Utiliser une couleur statique au lieu d'une fonction
          textColor: '#2E7D32' // Vert pour les montants positifs par défaut
        }
      },
      alternateRowStyles: {
        fillColor: [249, 250, 251]
      },
      margin: { left: 15, right: 15 },
      didDrawPage: (data) => {
        // Pied de page plus compact
      pdf.setFontSize(8);
        pdf.setTextColor(128, 128, 128);
        const pageNumber = `Page ${data.pageNumber}/${pdf.getNumberOfPages()}`;
        pdf.text(pageNumber, pageWidth - 20, pdf.internal.pageSize.height - 10, { align: 'right' });
    }
    });

    // Télécharger le PDF
    pdf.save(`releve_${account.accountNumber}_${new Date().toISOString().split('T')[0]}.pdf`);

  } catch (error) {
    if (error instanceof Error) {
      console.error('Erreur lors de la génération du PDF:', error.message);
    } else {
      console.error('Erreur inconnue lors de la génération du PDF');
    }
  }
};

  useEffect(() => {
    fetchAccounts().then(async data => {
      // Pour chaque compte, récupérer sa dernière transaction
      const accountsWithTransactions = await Promise.all(
        data.map(async account => {
          const lastTransaction = await fetchLastTransaction(account.id);
          return {
            ...account,
            lastTransaction
          };
        })
      );
      setAccounts(accountsWithTransactions);
      accountsWithTransactions.forEach(account => fetchAccountCards(account.id));
      fetchGraphData();  // Ajouter cet appel
    });
    fetchStatistics(); // Ajouter cet appel
    fetchTransactionStats(); // Ajouter cet appel
    fetchPaidBills();
    fetchVirementsProgrammes();
  }, []);

  // Modifier handleTransfer pour utiliser la nouvelle fonction showNotification
  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedAccount) {
        showNotification(setNotifications, 'error', 'Veuillez sélectionner un compte');
        return;
    }

    try {
        const credentials = localStorage.getItem('credentials');
        const transferPayload = {
            fromAccountId: selectedAccount.id,
            toAccountNumber: formData.toAccountNumber,
            amount: formData.amount,
            password: formData.password,
            beneficiaryName: formData.beneficiaryName,
            scheduledDateTime: formData.isScheduled ? 
                `${formData.scheduledDate}T${formData.scheduledTime}:00` : 
                null
        };

        // Utiliser l'endpoint approprié selon le type de virement
        const endpoint = formData.isScheduled ? 
            'http://localhost:8080/api/accounts/transfer/programme' : 
            'http://localhost:8080/api/accounts/transfer';

        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Basic ${credentials}`
            },
            body: JSON.stringify(transferPayload)
        });

        // Cloner la réponse pour pouvoir la lire plusieurs fois si nécessaire
        const clonedResponse = response.clone();

        // Lire la réponse une seule fois
        let data;
        try {
            data = await response.json();
        } catch (error) {
            // Si la première lecture échoue, utiliser le clone
            data = await clonedResponse.json();
        }

        if (response.ok) {
            const details = formData.isScheduled 
                ? `Montant: ${formatCurrency(formData.amount)} - Date: ${formData.scheduledDate} ${formData.scheduledTime}` 
                : `Montant: ${formatCurrency(formData.amount)} - Vers: ${formData.toAccountNumber}`;

            showNotification(
                setNotifications, 
                'success',
                formData.isScheduled 
                    ? 'Virement programmé avec succès'
                    : 'Virement effectué avec succès',
                details
            );

            const updatedAccounts = await fetchAccounts();
            setAccounts(updatedAccounts);
            setShowTransferForm(false);
            resetTransferForm();

            // Rafraîchir les virements programmés si nécessaire
            if (formData.isScheduled) {
                fetchVirementsProgrammes();
            }
        } else {
            const errorMessage = data.error || 'Le transfert a échoué';
            showNotification(
                setNotifications, 
                'error', 
                errorMessage,
                'Veuillez vérifier les informations saisies et réessayer.'
            );
        }
    } catch (err) {
        const error = err as Error;
        showNotification(setNotifications, 'error', error.message || 'Le transfert a échoué');
    } finally {
        setIsLoading(false);
    }
};

  const resetTransferForm = () => {
    setFormData({
      fromAccountId: 0,
      toAccountNumber: '',
      amount: 0,
      password: '',
      beneficiaryName: '',
      isScheduled: false,
      scheduledDate: '',
      scheduledTime: ''
    });
  };

  // Ajoutez cette fonction pour calculer les statistiques mensuelles
  const calculateMonthlyStats = (transactions: Transaction[]) => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const monthlyTransactions = transactions.filter(t => new Date(t.date) >= thirtyDaysAgo);
    
    const stats = monthlyTransactions.reduce((acc, t) => {
      if (t.type === 'CREDIT') {
        acc.credits += t.amount;
      } else {
        acc.debits += t.amount;
      }
      return acc;
    }, { credits: 0, debits: 0 });

    setMonthlyStats(stats);
  };

  // Modifiez la fonction fetchTransactions
  const fetchTransactions = async (accountId?: number) => {
    try {
      setIsLoadingTransactions(true);
      const credentials = localStorage.getItem('credentials');
      
      // Si un accountId est fourni, charger les transactions de ce compte
      // Sinon, charger toutes les transactions de l'utilisateur
      const url = accountId 
        ? `http://localhost:8080/api/accounts/${accountId}/transactions`
        : 'http://localhost:8080/api/accounts/transactions';

      const response = await fetch(url, {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTransactions(data);
      }
    } catch (error) {
      console.error('Erreur lors du chargement des transactions:', error);
    } finally {
      setIsLoadingTransactions(false);
    }
  };

  const fetchStatistics = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/accounts/statistics', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setStatistics(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques:', error);
    }
  };

  const fetchGraphData = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      
      // Calculer le solde total actuel
      const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);
      
      // Obtenir le premier jour du mois en cours
      const today = new Date();
      const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
      
      // Récupérer toutes les transactions du mois en cours
      const response = await fetch('http://localhost:8080/api/accounts/transactions/all', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const transactions = await response.json();
        
        // Filtrer les transactions du mois en cours
        const monthTransactions = transactions.filter((t: Transaction) => 
          new Date(t.date) >= firstDayOfMonth
        );
        
        // Créer un map pour stocker le solde par jour
        const dailyBalances = new Map();
        
        // Initialiser avec le solde actuel
        let currentBalance = totalBalance;
        
        // Parcourir tous les jours du mois jusqu'à aujourd'hui
        for (let d = new Date(); d >= firstDayOfMonth; d.setDate(d.getDate() - 1)) {
          const dateStr = d.toISOString().split('T')[0];
          
          // Filtrer les transactions pour cette date
          const dayTransactions = monthTransactions.filter((t: Transaction) => 
            new Date(t.date).toISOString().split('T')[0] === dateStr
          );
          
          // Calculer le solde pour ce jour
          dayTransactions.forEach((transaction: Transaction) => {
            if (transaction.type === 'CREDIT') {
              currentBalance -= transaction.amount;
            } else {
              currentBalance += transaction.amount;
            }
          });
          
          // Stocker le solde pour cette date
          dailyBalances.set(dateStr, currentBalance);
        }
        
        // Convertir les données pour le graphique
        const sortedDates = Array.from(dailyBalances.keys()).sort();
        const dates = sortedDates.map(date => 
          new Date(date).toLocaleDateString('fr-FR', { 
            day: '2-digit',
            month: '2-digit'
          })
        );
        const balances = sortedDates.map(date => dailyBalances.get(date));

        setBalanceHistory({
          dates: dates,
          balances: balances
        });
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des données du graphique:', error);
    }
  };

  const fetchTransactionStats = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/accounts/transaction-statistics', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setTransactionStats(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des statistiques de transactions:', error);
    }
  };

  const fetchVirementsProgrammes = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/accounts/transfers/programmes', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const data = await response.json();
        setVirementsProgrammes(data);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des virements programmés:', error);
    }
  };

  const fetchPaidBills = async () => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/accounts/bills', {
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        },
        credentials: 'include'
      });

      if (response.ok) {
        const bills = await response.json();
        setPaidBills(bills);
        console.log('Factures récupérées:', bills); // Pour le débogage
      } else {
        console.error('Erreur lors de la récupération des factures:', response.statusText);
      }
    } catch (error) {
      console.error('Erreur lors de la récupération des factures:', error);
    }
  };

  // Modifier useEffect pour charger les transactions quand on change d'onglet
  useEffect(() => {
    if (activeTab === 'history') {
      // Si un compte est sélectionné, charger ses transactions
      if (selectedAccountForHistory) {
        fetchTransactions(selectedAccountForHistory.id);
      } else {
        // Sinon, charger toutes les transactions de l'utilisateur
        const fetchAllTransactions = async () => {
          try {
            const credentials = localStorage.getItem('credentials');
            const response = await fetch('http://localhost:8080/api/accounts/transactions/all', {
              headers: {
                'Authorization': `Basic ${credentials}`,
                'Content-Type': 'application/json'
              },
              credentials: 'include'
            });

            if (response.ok) {
              const data = await response.json();
              setTransactions(data);
            }
          } catch (error) {
            console.error('Erreur lors du chargement des transactions:', error);
          }
        };

        fetchAllTransactions();
      }
    }
  }, [activeTab, selectedAccountForHistory]);

  const renderContent = () => {
    switch (activeTab) {
      case 'accounts':
        const totalBalance = accounts.reduce((sum, acc) => sum + acc.balance, 0);

        return (
          <div className="max-w-6xl mx-auto">
            {/* En-tête avec le solde total */}
            <div className="relative bg-gradient-to-br from-[#1F53DD] via-[#1941B0] to-[#132F85] rounded-2xl shadow-xl p-8 text-white mb-8 w-full overflow-hidden">
              {/* Cercles décoratifs en arrière-plan */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/2 blur-2xl"></div>
              <div className="absolute bottom-0 left-0 w-32 h-32 bg-blue-400/10 rounded-full translate-y-1/2 -translate-x-1/2 blur-xl"></div>
              
              {/* Contenu principal */}
              <div className="relative flex items-center justify-between">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <h2 className="text-xl font-medium text-white/80">Solde Total</h2>
                    <p className="text-4xl font-bold tracking-tight">
                      {formatCurrency(totalBalance)}
                    </p>
                  </div>
                  
                  {/* Statistiques rapides */}
                  <div className="flex items-center space-x-4 text-sm text-white/70">
                    <div className="flex items-center">
                      <ArrowUpRight className="h-4 w-4 mr-1 text-red-300" />
                      <span>Dépenses: {formatCurrency(transactionStats?.totalDebits || 0)}</span>
                    </div>
                    <div className="w-px h-4 bg-white/20"></div>
                    <div className="flex items-center">
                      <ArrowDownRight className="h-4 w-4 mr-1 text-green-300" />
                      <span>Revenus: {formatCurrency(transactionStats?.totalCredits || 0)}</span>
                    </div>
                  </div>
                </div>

                {/* Icône simple et moderne */}
                <div className="p-4 bg-white/10 rounded-2xl">
                  <Wallet size={28} className="text-white" />
                </div>
              </div>

              {/* Barre de progression en bas */}
              <div className="absolute bottom-0 left-0 right-0 h-1 bg-white/10">
                <div 
                  className="h-full bg-white/30 rounded-full"
                  style={{ 
                    width: `${Math.min((transactionStats?.totalCredits || 0) / (totalBalance || 1) * 100, 100)}%`,
                    transition: 'width 1s ease-in-out' 
                  }}
                ></div>
              </div>
            </div>

            {/* Résumé des activités récentes */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 mb-8 w-full">
              {/* Les trois cartes restent identiques mais avec w-full ajouté à leur div parent */}
              {/* Carte Activité Récente */}
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-blue-50 rounded-xl">
                      <Activity className="h-6 w-6 text-blue-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Activité Récente
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Aperçu de vos opérations
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-blue-50/50 to-blue-50 rounded-xl p-4 w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Transactions du mois</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {statistics?.transactionsThisMonth || 0}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100/50 rounded-full">
                        <TrendingUp className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-blue-50/50 to-blue-50 rounded-xl p-4 w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Dernière opération</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {statistics?.lastTransactionDate 
                            ? new Date(statistics.lastTransactionDate).toLocaleString('fr-FR', {
                                day: '2-digit',
                                month: '2-digit',
                                year: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })
                            : 'Aucune'}
                        </p>
                      </div>
                      <div className="p-3 bg-blue-100/50 rounded-full">
                        <Clock className="h-6 w-6 text-blue-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte Alertes - Mêmes modifications */}
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-red-50 rounded-xl">
                      <Bell className="h-6 w-6 text-red-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Alertes
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Notifications importantes
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-red-50/50 to-red-50 rounded-xl p-4 w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Notifications</p>
                        <div className="flex items-center space-x-2 mt-1">
                          <span className="h-2 w-2 bg-red-500 rounded-full animate-pulse"></span>
                          <p className="text-2xl font-bold text-gray-900">3</p>
                        </div>
                      </div>
                      <div className="p-3 bg-red-100/50 rounded-full">
                        <Bell className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-red-50/50 to-red-50 rounded-xl p-4 w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Dernière alerte</p>
                        <p className="text-sm text-gray-900 mt-1">
                          Aujourd'hui à {new Date().toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                        </p>
                      </div>
                      <div className="p-3 bg-red-100/50 rounded-full">
                        <AlertCircle className="h-6 w-6 text-red-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Carte Virements Programmés - Mêmes modifications */}
              <div className="bg-white rounded-2xl shadow-lg p-5 border border-gray-100 w-full">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center space-x-3">
                    <div className="p-3 bg-emerald-50 rounded-xl">
                      <Clock className="h-6 w-6 text-emerald-600" />
                    </div>
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">
                        Virements Programmés
                      </h3>
                      <p className="text-xs text-gray-500 mt-1">
                        Suivi des virements
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-50 rounded-xl p-4 w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Virements en attente</p>
                        <p className="text-2xl font-bold text-gray-900 mt-1">
                          {virementsProgrammes.filter(v => !v.executed).length}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-100/50 rounded-full">
                        <Send className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>

                  <div className="bg-gradient-to-br from-emerald-50/50 to-emerald-50 rounded-xl p-4 w-full">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600">Prochain virement</p>
                        <p className="text-sm text-gray-900 mt-1">
                          {(() => {
                            const prochainVirement = virementsProgrammes
                              .filter(v => !v.executed)
                              .sort((a, b) => new Date(a.dateExecution).getTime() - new Date(b.dateExecution).getTime())[0];
                          
                            return prochainVirement 
                              ? `${new Date(prochainVirement.dateExecution).toLocaleDateString()} - ${formatCurrency(prochainVirement.montant)}`
                              : 'Aucun'
                          })()}
                        </p>
                      </div>
                      <div className="p-3 bg-emerald-100/50 rounded-full">
                        <Calendar className="h-6 w-6 text-emerald-600" />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Liste des comptes */}
            <div className="bg-white rounded-xl shadow-lg p-6 mb-8 w-full">
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center space-x-3">
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <Wallet className="h-6 w-6 text-blue-600" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-800">Mes Comptes Bancaires</h3>
                </div>
                <span className="text-sm text-gray-500">
                  {accounts.length} {accounts.length > 1 ? 'comptes' : 'compte'}
                </span>
              </div>

              <div className="grid gap-6">
                {accounts.map(account => (
                  <div 
                    key={account.id} 
                    className="bg-gradient-to-r from-gray-50 to-white border border-gray-100 rounded-xl p-5 w-full"
                  >
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="p-3 bg-blue-600/5 rounded-lg">
                          <CreditCard className="h-6 w-6 text-blue-600" />
                        </div>
                        <div>
                          <p className="text-sm text-gray-500">N° de compte</p>
                          <p className="text-lg font-semibold text-gray-900 font-mono">
                            •••• {account.accountNumber.slice(-4)}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Solde disponible</p>
                        <p className={`text-xl font-bold ${
                          account.balance >= 0 ? 'text-green-600' : 'text-red-600'
                        }`}>
                          {formatCurrency(account.balance)}
                        </p>
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-3 justify-between"> {/* Ajout de justify-between */}
                      <div className="flex items-center gap-3"> {/* Groupe les boutons Relevé et Historique */}
                        <button 
                          onClick={() => generatePDF(account)}
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 
                                    text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 
                                    transition-all duration-200 text-sm font-medium group"
                        >
                          <Download size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span>Relevé</span>
                        </button>

                        <button 
                          onClick={() => {
                            setSelectedAccountForHistory(account);
                            setActiveTab('history');
                          }}
                          className="flex items-center space-x-2 px-4 py-2 bg-white border border-gray-200 
                                    text-gray-700 rounded-lg hover:bg-gray-50 hover:border-gray-300 
                                    transition-all duration-200 text-sm font-medium group"
                        >
                          <History size={16} className="text-gray-400 group-hover:text-blue-500 transition-colors" />
                          <span>Historique</span>
                        </button>
                      </div>

                      <button 
                        onClick={() => {
                          setSelectedAccount(account);
                          setFormData(prev => ({ ...prev, isScheduled: false }));
                          setShowTransferForm(true);
                        }}
                        className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white 
                                  rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300 text-sm font-medium"
                      >
                        <Send size={16} />
                        <span>Virement</span>
                      </button>
                    </div>

                    {/* Dernière transaction */}
                    <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-100">
                      <p className="text-xs font-medium text-gray-500 mb-2">Dernière transaction</p>
                      {account.lastTransaction ? (
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-3">
                            <div className="p-2 bg-white rounded-full">
                              {account.lastTransaction.type === 'CREDIT' ? (
                                <ArrowDownRight size={14} className="text-green-500" />
                              ) : (
                                <ArrowUpRight size={14} className="text-red-500" />
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {account.lastTransaction.description}
                              </p>
                              <p className="text-xs text-gray-500">
                                {new Date(account.lastTransaction.date).toLocaleString('fr-FR')}
                              </p>
                            </div>
                          </div>
                          <span className={`text-sm font-semibold ${
                            account.lastTransaction.type === 'CREDIT' 
                              ? 'text-green-600' 
                              : 'text-red-600'
                          }`}>
                            {formatMontantPropre(
                              account.lastTransaction.amount,
                              account.lastTransaction.type
                            )}
                          </span>
                        </div>
                      ) : (
                        <p className="text-sm text-gray-500 text-center">Aucune transaction</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Section des graphiques */}
            <div className="grid grid-cols-2 gap-6 mb-8 w-full">
              {/* Statistiques des transactions */}
              <div className="bg-white rounded-xl shadow-lg p-6 w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Analyse Mensuelle</h3>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                </div>

                <div className="space-y-4">
                  {/* Entrées du mois */}
                  <div className="p-4 bg-green-50 rounded-lg border border-green-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-green-600">Entrées du mois</p>
                        <p className="text-lg font-semibold text-green-700 mt-1">
                          +{formatCurrency(transactionStats?.totalCredits || 0)}
                        </p>
                      </div>
                      <div className="p-2 bg-green-100 rounded-lg">
                        <ArrowDownRight className="h-5 w-5 text-green-600" />
                      </div>
                    </div>
                  </div>

                  {/* Sorties du mois */}
                  <div className="p-4 bg-red-50 rounded-lg border border-red-100">
                    <div className="flex justify-between items-center">
                      <div>
                        <p className="text-sm text-red-600">Sorties du mois</p>
                        <p className="text-lg font-semibold text-red-700 mt-1">
                          -{formatCurrency(transactionStats?.totalDebits || 0)}
                        </p>
                      </div>
                      <div className="p-2 bg-red-100 rounded-lg">
                        <ArrowUpRight className="h-5 w-5 text-red-600" />
                      </div>
                    </div>
                  </div>

                  {/* Dernière transaction */}
                  <div className="p-4 bg-gray-50 rounded-lg border border-gray-100">
                    <p className="text-sm text-gray-600 mb-2">Dernière opération</p>
                    {transactionStats?.lastTransaction ? (
                      <div className="space-y-2">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="text-sm font-medium text-gray-900">
                              {transactionStats.lastTransaction.description}
                            </p>
                            <div className="flex items-center space-x-2 text-xs text-gray-500 mt-1">
                              <span>{new Date(transactionStats.lastTransaction.date).toLocaleString('fr-FR', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                                hour: '2-digit',
                                minute: '2-digit'
                              })}</span>
                              <span>•</span>
                              <span>
                                {transactionStats.lastTransaction.fromAccount === 'CASH' ? 'Dépôt en espèces' : 
                                 transactionStats.lastTransaction.toAccount === 'CASH' ? 'Retrait en espèces' :
                                 `${transactionStats.lastTransaction.fromAccount} → ${transactionStats.lastTransaction.toAccount}`}
                              </span>
                            </div>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${
                              transactionStats.lastTransaction.type === 'CREDIT' 
                                ? 'text-green-600' 
                                : 'text-red-600'
                            }`}>
                              {formatMontantPropre(
                                transactionStats.lastTransaction.amount,
                                transactionStats.lastTransaction.type
                              )}
                            </p>
                            <span className={`inline-flex items-center px-2 py-1 mt-1 rounded-full text-xs font-medium ${
                              transactionStats.lastTransaction.type === 'CREDIT'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {transactionStats.lastTransaction.type === 'CREDIT' ? 'Crédit' : 'Débit'}
                            </span>
                          </div>
                        </div>
                        <div className="pt-2 mt-2 border-t border-gray-200">
                          <div className="flex items-center justify-between text-xs text-gray-500">
                            <span className="flex items-center">
                              <Activity className="h-3 w-3 mr-1" />
                              Type: {
                                transactionStats.lastTransaction.type === 'DEPOSIT' ? 'Dépôt' :
                                transactionStats.lastTransaction.type === 'WITHDRAW' ? 'Retrait' :
                                transactionStats.lastTransaction.type === 'CREDIT' ? 'Crédit' :
                                transactionStats.lastTransaction.type === 'DEBIT' ? 'Débit' :
                                transactionStats.lastTransaction.type
                              }
                            </span>
                            <span className="flex items-center">
                              <Clock className="h-3 w-3 mr-1" />
                              Il y a {Math.round((new Date().getTime() - new Date(transactionStats.lastTransaction.date).getTime()) / (1000 * 60))} minutes
                            </span>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <p className="text-sm text-gray-500 text-center">Aucune transaction récente</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Cartes bancaires associées - Remplace l'Évolution du solde */}
              <div className="bg-white rounded-xl shadow-lg p-6 w-full">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-lg font-semibold text-gray-800">Cartes bancaires associées</h3>
                  <div className="p-2 bg-blue-50 rounded-lg">
                    <CreditCard className="h-5 w-5 text-blue-600" />
                  </div>
                </div>

                <div className="space-y-4">
                  {accounts.map(account => (
                    accountCards[account.id]?.map((card) => (
                      <div 
                        key={card.id}
                        className="bg-gray-50 rounded-lg border border-gray-200 p-4 hover:border-blue-300 transition-colors w-full"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              card.cardType === 'VISA' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'
                            }`}>
                              <CreditCard className="h-5 w-5" />
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {card.cardType} •••• {card.cardNumber.slice(-4)}
                              </p>
                              <p className="text-xs text-gray-500">
                                Expire le {new Date(card.expirationDate).toLocaleDateString('fr-FR', {
                                  month: '2-digit',
                                  year: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <span className={`px-2 py-1 text-xs rounded-full ${
                              new Date(card.expirationDate) > new Date() 
                                ? 'bg-green-100 text-green-700'
                                : 'bg-red-100 text-red-700'
                            }`}>
                              {new Date(card.expirationDate) > new Date() ? 'Active' : 'Expirée'}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))
                  ))}
                  {!Object.values(accountCards).flat().length && (
                    <div className="text-center py-8">
                      <CreditCard size={48} className="mx-auto text-gray-400 mb-4" />
                      <p className="text-gray-500">Aucune carte bancaire associée</p>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        );

      case 'history':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-800">
                  {selectedAccountForHistory 
                    ? `Historique du compte ${selectedAccountForHistory.accountNumber}` 
                    : 'Historique des transactions'}
                </h3>
              </div>

              {isLoadingTransactions ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                </div>
              ) : transactions.length > 0 ? (
                <div className="space-y-4 w-full">
                  {transactions.map((transaction) => (
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
                        <div>
                          <p className="font-medium text-gray-900">
                            {transaction.description}
                          </p>
                          <div className="flex items-center space-x-2 text-sm text-gray-500">
                            <span>{new Date(transaction.date).toLocaleDateString('fr-FR', {
                              year: 'numeric',
                              month: 'long',
                              day: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}</span>
                            <span>•</span>
                            <span>
                              De: {transaction.fromAccount === 'CASH' ? 'Dépôt en espèces' : 
                                  transaction.fromAccount === selectedAccount?.accountNumber ? 'Ce compte' : 
                                  transaction.fromAccount}
                            </span>
                            <span>→</span>
                            <span>
                              Vers: {transaction.toAccount === 'CASH' ? 'Retrait en espèces' : 
                                    transaction.toAccount === selectedAccount?.accountNumber ? 'Ce compte' : 
                                    transaction.toAccount}
                            </span>
                          </div>
                          <div className="text-sm text-gray-500 mt-1">
                            <span>Type: {
                              transaction.type === 'DEPOSIT' ? 'Dépôt' :
                              transaction.type === 'WITHDRAW' ? 'Retrait' :
                              transaction.type === 'CREDIT' ? 'Crédit' :
                              transaction.type === 'DEBIT' ? 'Débit' :
                              transaction.type === 'ACCOUNT_CLOSURE' ? 'Clôture de compte' :
                              transaction.type
                            }</span>
                            {transaction.type === 'ACCOUNT_CLOSURE' && (
                              <span className="ml-2 text-gray-400">• Compte clôturé</span>
                            )}
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className={`font-medium ${
                          transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT' || transaction.fromAccount === 'CASH' ? 'text-green-600' :
                          transaction.type === 'WITHDRAW' || transaction.type === 'DEBIT' || transaction.toAccount === 'CASH' ? 'text-red-600' :
                          transaction.type === 'ACCOUNT_CLOSURE' ? 'text-gray-600' : 'text-blue-600'
                        }`}>
                          {transaction.type === 'DEPOSIT' || transaction.type === 'CREDIT' || transaction.fromAccount === 'CASH' ? '+' : '-'}
                          {transaction.amount.toFixed(3)} TND
                        </span>
                        <p className="text-sm text-gray-500 mt-1">
                          {transaction.type === 'DEPOSIT' || transaction.fromAccount === 'CASH' ? 'Dépôt en espèces' :
                           transaction.type === 'WITHDRAW' || transaction.toAccount === 'CASH' ? 'Retrait en espèces' :
                           transaction.type === 'CREDIT' ? 'Virement reçu' :
                           transaction.type === 'DEBIT' ? 'Virement émis' :
                           transaction.type === 'ACCOUNT_CLOSURE' ? 'Solde clôturé' :
                           'Transaction'}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <History size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucune transaction à afficher</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'bills':
        return (
          <div className="space-y-6">
            {/* Grille des services */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Électricité */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-yellow-100 rounded-xl">
                        <Zap className="h-6 w-6 text-yellow-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Électricité</h3>
                        <p className="text-sm text-gray-500">STEG</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedService('electricity');
                      setShowBillForm(true);
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300"
                  >
                    Payer une facture
                  </button>
                </div>
              </div>

              {/* Eau */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-blue-100 rounded-xl">
                        <Droplets className="h-6 w-6 text-blue-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Eau</h3>
                        <p className="text-sm text-gray-500">SONEDE</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedService('water');
                      setShowBillForm(true);
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300"
                  >
                    Payer une facture
                  </button>
                </div>
              </div>

              {/* Internet */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-purple-100 rounded-xl">
                        <Wifi className="h-6 w-6 text-purple-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Internet</h3>
                        <p className="text-sm text-gray-500">Fournisseurs Internet</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedService('internet');
                      setShowBillForm(true);
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300"
                  >
                    Payer une facture
                  </button>
                </div>
              </div>

              {/* Téléphone */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-green-100 rounded-xl">
                        <Phone className="h-6 w-6 text-green-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Téléphone</h3>
                        <p className="text-sm text-gray-500">Opérateurs mobiles</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedService('phone');
                      setShowBillForm(true);
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300"
                  >
                    Payer une facture
                  </button>
                </div>
              </div>

              {/* Impôts */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-red-100 rounded-xl">
                        <Home className="h-6 w-6 text-red-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Impôts</h3>
                        <p className="text-sm text-gray-500">Services fiscaux</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedService('tax');
                      setShowBillForm(true);
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300"
                  >
                    Payer une facture
                  </button>
                </div>
              </div>

              {/* Assurance */}
              <div className="bg-white rounded-xl shadow-lg hover:shadow-xl transition-shadow duration-300">
                <div className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="p-3 bg-orange-100 rounded-xl">
                        <Car className="h-6 w-6 text-orange-600" />
                      </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-900">Assurance</h3>
                        <p className="text-sm text-gray-500">Compagnies d'assurance</p>
                      </div>
                    </div>
                    <ArrowRight className="h-5 w-5 text-gray-400" />
                  </div>
                  <button
                    onClick={() => {
                      setSelectedService('insurance');
                      setShowBillForm(true);
                    }}
                    className="w-full py-2.5 px-4 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300"
                  >
                    Payer une facture
                  </button>
                </div>
              </div>
            </div>

            {/* Section des factures récentes */}
            <div className="bg-white rounded-xl shadow-lg p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Factures récentes</h3>
              <div className="space-y-4">
                {paidBills.length > 0 ? (
                  paidBills.map((bill) => (
                    <div key={bill.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          bill.serviceType === 'electricity' ? 'bg-yellow-100' :
                          bill.serviceType === 'water' ? 'bg-blue-100' :
                          bill.serviceType === 'internet' ? 'bg-purple-100' :
                          bill.serviceType === 'phone' ? 'bg-green-100' :
                          bill.serviceType === 'tax' ? 'bg-red-100' :
                          'bg-orange-100'
                        }`}>
                          {bill.serviceType === 'electricity' ? <Zap className="h-5 w-5 text-yellow-600" /> :
                           bill.serviceType === 'water' ? <Droplets className="h-5 w-5 text-blue-600" /> :
                           bill.serviceType === 'internet' ? <Wifi className="h-5 w-5 text-purple-600" /> :
                           bill.serviceType === 'phone' ? <Phone className="h-5 w-5 text-green-600" /> :
                           bill.serviceType === 'tax' ? <Home className="h-5 w-5 text-red-600" /> :
                           <Car className="h-5 w-5 text-orange-600" />}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            {bill.serviceType === 'electricity' ? 'STEG' :
                             bill.serviceType === 'water' ? 'SONEDE' :
                             bill.serviceType === 'internet' ? 'Internet' :
                             bill.serviceType === 'phone' ? 'Téléphone' :
                             bill.serviceType === 'tax' ? 'Impôts' :
                             'Assurance'}
                          </p>
                          <p className="text-xs text-gray-500">
                            Réf: {bill.reference} • {new Date(bill.date).toLocaleDateString('fr-FR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            Compte: {bill.accountNumber}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-semibold text-gray-900">{formatCurrency(bill.amount)}</p>
                        <span className="inline-flex items-center px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-700">
                          Payée
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-6 bg-gray-50 rounded-lg">
                    <Receipt className="mx-auto h-12 w-12 text-gray-400 mb-3" />
                    <p className="text-gray-500">Aucune facture payée</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        );

      case 'scheduled':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full">
              <div className="flex justify-end mb-6">
                <button
                  onClick={() => {
                    if (accounts.length > 0) {
                      setSelectedAccount(accounts[0]);
                      setFormData(prev => ({ 
                        ...prev, 
                        isScheduled: true,
                        fromAccountId: accounts[0].id 
                      }));
                      setShowTransferForm(true);
                    }
                  }}
                  className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300"
                >
                  <Clock size={16} />
                  <span>Nouveau Virement Programmé</span>
                </button>
              </div>

              {virementsProgrammes.length > 0 ? (
                <div className="space-y-4 w-full">
                  {virementsProgrammes.map((virement) => (
                    <div key={virement.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg hover:bg-gray-100 transition-all duration-200 w-full">
                      <div className="flex items-center space-x-4">
                        <div className={`p-2 rounded-lg ${
                          virement.status === 'EXECUTE' ? 'bg-green-100' : 
                          virement.status === 'REFUSE' ? 'bg-red-100' : 
                          'bg-yellow-100'
                        }`}>
                          {virement.status === 'EXECUTE' ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : virement.status === 'REFUSE' ? (
                            <AlertCircle className="h-5 w-5 text-red-600" />
                          ) : (
                            <Clock className="h-5 w-5 text-yellow-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">
                            Virement vers {virement.beneficiaireName}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(virement.dateExecution).toLocaleString('fr-FR')}
                          </p>
                          <p className="text-xs text-gray-500">
                            De: {virement.compteSource.accountNumber} → Vers: {virement.numeroCompteDestination}
                          </p>
                        </div>
                      </div>
                      <div className="flex flex-col items-end space-y-2">
                        <p className="text-sm font-semibold text-red-600">
                          -{formatCurrency(virement.montant)}
                        </p>
                        <div className="flex flex-col items-end">
                          <div className="flex items-center space-x-2">
                            <span className={`inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium ${
                              virement.status === 'EXECUTE' 
                                ? 'bg-green-100 text-green-700'
                                : virement.status === 'REFUSE'
                                ? 'bg-red-100 text-red-700'
                                : 'bg-yellow-100 text-yellow-700'
                            }`}>
                              {virement.status === 'EXECUTE' && (
                                <CheckCircle className="w-3.5 h-3.5 mr-1" />
                              )}
                              {virement.status === 'REFUSE' && (
                                <AlertCircle className="w-3.5 h-3.5 mr-1" />
                              )}
                              {virement.status === 'EN_ATTENTE' && (
                                <Clock className="w-3.5 h-3.5 mr-1" />
                              )}
                              {virement.status === 'EXECUTE' 
                                ? 'Exécuté' 
                                : virement.status === 'REFUSE'
                                ? 'Refusé'
                                : 'En attente'}
                            </span>
                            {virement.status === 'EN_ATTENTE' && (
                              <button
                                onClick={() => {
                                  if (window.confirm('Êtes-vous sûr de vouloir annuler ce virement programmé ?')) {
                                    handleCancelTransfer(virement.id);
                                  }
                                }}
                                className="px-3 py-1 bg-red-100 text-red-600 rounded-lg hover:bg-red-200 transition-colors text-xs font-medium flex items-center"
                              >
                                <X className="w-3.5 h-3.5 mr-1" />
                                Annuler
                              </button>
                            )}
                          </div>
                          {virement.status === 'REFUSE' && virement.refusReason && (
                            <span className="text-xs text-red-500 mt-1 text-right">
                              Cause : {virement.refusReason}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Clock size={48} className="mx-auto text-gray-400 mb-4" />
                  <p className="text-gray-500">Aucun virement programmé</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'settings':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full">
              <div className="mb-6">
                <h3 className="text-xl font-semibold text-gray-800 flex items-center">
                  <Settings className="mr-2 text-blue-600" size={24} />
                  Paramètres du compte
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Gérez vos informations personnelles et paramètres de sécurité
                </p>
              </div>

              <form onSubmit={handleUpdateProfile} className="space-y-6 w-full">
                {/* Informations personnelles */}
                <div className="bg-gray-50 p-6 rounded-xl space-y-6 w-full">
                  <h4 className="text-lg font-medium text-gray-900">
                    Informations personnelles
                  </h4>
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse email
                      </label>
                      <div className="relative w-full">
                        <Mail className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="email"
                          value={profileData?.email || ''}
                          onChange={(e) => setProfileData((prev: any) => ({
                            ...prev,
                            email: e.target.value
                          }))}
                          className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Numéro de téléphone
                      </label>
                      <div className="relative w-full">
                        <Phone className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="tel"
                          value={profileData?.phone || ''}
                          onChange={(e) => setProfileData((prev: any) => ({
                            ...prev,
                            phone: e.target.value
                          }))}
                          className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>

                    <div className="md:col-span-2 w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Adresse
                      </label>
                      <div className="relative w-full">
                        <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="text"
                          value={profileData?.address || ''}
                          onChange={(e) => setProfileData((prev: any) => ({
                            ...prev,
                            address: e.target.value
                          }))}
                          className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sécurité */}
                <div className="bg-gray-50 p-6 rounded-xl space-y-6 w-full">
                  <h4 className="text-lg font-medium text-gray-900">
                    Sécurité
                  </h4>

                  <div className="space-y-4 w-full">
                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Mot de passe actuel
                      </label>
                      <div className="relative w-full">
                        <Lock className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="password"
                          value={currentPassword}
                          onChange={(e) => setCurrentPassword(e.target.value)}
                          className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Entrez votre mot de passe actuel"
                        />
                      </div>
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Nouveau mot de passe
                      </label>
                      <div className="relative w-full">
                        <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="password"
                          value={newPassword}
                          onChange={(e) => setNewPassword(e.target.value)}
                          className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Entrez votre nouveau mot de passe"
                        />
                      </div>
                    </div>

                    <div className="w-full">
                      <label className="block text-sm font-medium text-gray-700 mb-1">
                        Confirmer le nouveau mot de passe
                      </label>
                      <div className="relative w-full">
                        <Key className="absolute left-3 top-3 text-gray-400" size={18} />
                        <input
                          type="password"
                          value={confirmPassword}
                          onChange={(e) => setConfirmPassword(e.target.value)}
                          className="pl-10 w-full py-2 px-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                          placeholder="Confirmez votre nouveau mot de passe"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end space-x-3 w-full">
                  <button
                    type="button"
                    onClick={() => {
                      setProfileData(null);
                      setCurrentPassword('');
                      setNewPassword('');
                      setConfirmPassword('');
                    }}
                    className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    Annuler
                  </button>
                  <button
                    type="submit"
                    disabled={isLoading}
                    className="px-6 py-2 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300 flex items-center"
                  >
                    {isLoading ? (
                      <>
                        <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Mise à jour...
                      </>
                    ) : (
                      <>
                        <Save className="mr-2" size={18} />
                        Enregistrer les modifications
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );

      case 'profile':
        return (
          <div className="max-w-6xl mx-auto">
            <div className="bg-white rounded-xl shadow-lg p-6 w-full">
              <div className="space-y-6 w-full">
                {/* Photo de profil et informations principales */}
                <div className="flex items-center space-x-6 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl w-full">
                  <div className="h-24 w-24 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 flex items-center justify-center text-white text-3xl font-bold">
                    {profileData?.fullName?.charAt(0).toUpperCase() || localStorage.getItem('fullName')?.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">
                      {profileData?.fullName || localStorage.getItem('fullName')}
                    </h3>
                    <p className="text-gray-500">{profileData?.username || localStorage.getItem('username')}</p>
                    <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 mt-2">
                      {(profileData?.role || localStorage.getItem('userRole'))?.replace('ROLE_', '')}
                    </span>
                  </div>
                </div>

                {/* Informations détaillées */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full">
                  <div className="space-y-4 w-full">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg w-full">
                      <Mail className="text-blue-600" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Email</p>
                        <p className="text-gray-900">{profileData?.email || 'Non renseigné'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg w-full">
                      <Phone className="text-blue-600" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Téléphone</p>
                        <p className="text-gray-900">{profileData?.phone || 'Non renseigné'}</p>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-4 w-full">
                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg w-full">
                      <MapPin className="text-blue-600" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Adresse</p>
                        <p className="text-gray-900">{profileData?.address || 'Non renseigné'}</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg w-full">
                      <Calendar className="text-blue-600" size={20} />
                      <div>
                        <p className="text-sm text-gray-500">Date d'inscription</p>
                        <p className="text-gray-900">
                          {new Date().toLocaleDateString('fr-FR', {
                            day: '2-digit',
                            month: 'long',
                            year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Sécurité */}
                <div className="mt-6 p-4 bg-yellow-50 rounded-xl border border-yellow-100 w-full">
                  <div className="flex items-center space-x-3">
                    <Shield className="text-yellow-600" size={20} />
                    <div>
                      <h4 className="text-sm font-medium text-yellow-800">Sécurité du compte</h4>
                      <p className="text-sm text-yellow-600">
                        Dernière connexion : {new Date().toLocaleString('fr-FR')}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Ajouter cette fonction avec les autres fonctions du composant
  const handleBillPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch('http://localhost:8080/api/accounts/pay-bill', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Basic ${credentials}`
        },
        body: JSON.stringify({
          accountId: billForm.accountId,
          amount: billForm.amount,
          serviceType: selectedService,
          reference: billForm.reference,
          password: billForm.password
        })
      });

      const data = await response.json();

      if (response.ok) {
        const updatedAccounts = accounts.map(account => {
          if (account.id === billForm.accountId) {
            return {
              ...account,
              balance: data.newBalance
            };
          }
          return account;
        });
        setAccounts(updatedAccounts);

        // Utiliser une fonction pour obtenir le nom du service
        const getServiceName = (type: string | null) => {
          switch(type) {
            case 'electricity':
              return 'Électricité';
            case 'water':
              return 'Eau';
            case 'internet':
              return 'Internet';
            case 'phone':
              return 'Téléphone';
            case 'tax':
              return 'Impôts';
            case 'insurance':
              return 'Assurance';
            default:
              return 'Électricité';
          }
        };

        const serviceName = getServiceName(selectedService);

        showNotification(
          setNotifications, 
          'success',
          'Paiement effectué avec succès',
          `Service: ${serviceName} - Montant: ${formatCurrency(billForm.amount)} - Référence: ${billForm.reference}`
        );

        setBillForm({
          accountId: 0,
          reference: '',
          amount: 0,
          serviceType: 'electricity',
          password: ''
        });

        setShowBillForm(false);
        fetchPaidBills();
        fetchTransactionStats();
      } else {
        const errorData = await response.json() as APIError;
        const errorMessage = errorData.error || 'Une erreur est survenue lors du paiement';
        showNotification(
          setNotifications, 
          'error', 
          errorMessage,
          'Veuillez vérifier votre solde et les informations saisies.'
        );
      }
    } catch (err) {
      const error = err as Error;
      showNotification(setNotifications, 'error', error.message || 'Une erreur est survenue lors du paiement');
    }
  };

  // Ajouter cette fonction pour gérer le changement d'onglet
  const onTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem('currentTab', tab);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  // Dans la section où vous gérez le clic sur "Mon Profil"
  const handleProfileClick = () => {
    setShowProfile(true);
  };

  // Modifier l'useEffect pour la gestion des onglets
  useEffect(() => {
    const savedTab = localStorage.getItem('currentTab') || 'accounts';
    setActiveTab(savedTab);

    const handleTabChangeEvent = (event: CustomEvent) => {
      const newTab = event.detail;
      setActiveTab(newTab);
      localStorage.setItem('currentTab', newTab);
    };

    window.addEventListener('tabChange', handleTabChangeEvent as EventListener);

    return () => {
      window.removeEventListener('tabChange', handleTabChangeEvent as EventListener);
    };
  }, [setActiveTab]);

  // Ajouter la fonction d'annulation
  const handleCancelTransfer = async (virementId: number) => {
    try {
      const credentials = localStorage.getItem('credentials');
      const response = await fetch(`http://localhost:8080/api/accounts/transfers/programmes/${virementId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Basic ${credentials}`,
          'Content-Type': 'application/json'
        }
      });

      if (response.ok) {
        showNotification(
          setNotifications,
          'success',
          'Virement programmé annulé avec succès'
        );
        fetchVirementsProgrammes();
      } else {
        const data = await response.json();
        showNotification(
          setNotifications,
          'error',
          data.error || 'Erreur lors de l\'annulation du virement'
        );
      }
    } catch (error) {
      showNotification(
        setNotifications,
        'error',
        'Erreur lors de l\'annulation du virement'
      );
    }
  };

  // Ajouter un useEffect pour récupérer les informations de l'agence
  useEffect(() => {
    const fetchAgencyInfo = async () => {
      try {
        const credentials = localStorage.getItem('credentials');
        const response = await fetch('http://localhost:8080/api/users/agency-info', {
          headers: {
            'Authorization': `Basic ${credentials}`,
            'Content-Type': 'application/json'
          }
        });
        if (response.ok) {
          const data = await response.json();
          setAgencyInfo(data);
        }
      } catch (error) {
        console.error('Erreur lors de la récupération des informations de l\'agence:', error);
      }
    };

    fetchAgencyInfo();
  }, []);

  // Modifier la structure principale et le sidebar
  return (
    <div className="flex min-h-screen bg-gray-50 font-['Poppins']">
      <NotificationContainer 
        notifications={notifications} 
        setNotifications={setNotifications} 
      />
      {/* Sidebar */}
      <div className="fixed top-16 left-0 bottom-0 w-80 bg-white shadow-lg border-r border-gray-100">
        <div className="flex flex-col h-full">
          {/* En-tête du Sidebar */}
          <div className="pt-6 p-6 border-b border-gray-100">
            <div className="flex flex-col items-center text-center">
              <div className="p-3 bg-blue-50 rounded-xl mb-3">
                <User className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Mon Espace</h1>
                <p className="text-sm text-gray-500">Gestion des comptes</p>
                {agencyInfo && (
                  <p className="text-sm text-blue-600 mt-1">Agence {agencyInfo.name}</p>
                )}
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 p-4 mt-4">
            <div className="space-y-4"> {/* Augmenté l'espacement entre les groupes */}
              {/* Groupe Principal */}
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase">Principal</p>
                <button
                  onClick={() => onTabChange('accounts')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'accounts'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Wallet className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Mes Comptes</span>
                </button>
              </div>

              {/* Groupe Gestion */}
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase">Gestion</p>
                <button
                  onClick={() => onTabChange('history')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'history'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <History className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Historique</span>
                </button>

                <button
                  onClick={() => onTabChange('bills')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'bills'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Receipt className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Paiements</span>
                </button>

                <button
                  onClick={() => onTabChange('scheduled')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'scheduled'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <Clock className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Virements Programmés</span>
                </button>
              </div>

              {/* Groupe Autres */}
              <div className="space-y-2">
                <p className="px-4 text-xs font-semibold text-gray-400 uppercase">Autres</p>
                <button
                  onClick={() => onTabChange('profile')}
                  className={`flex items-center justify-start w-full px-4 py-2.5 rounded-lg transition-all duration-200 ${
                    activeTab === 'profile'
                      ? 'bg-gradient-to-r from-blue-50 to-blue-50/50 text-blue-600'
                      : 'text-gray-600 hover:bg-gray-50'
                  }`}
                >
                  <User className="h-5 w-5" />
                  <span className="ml-3 text-[14px] font-medium">Mon Profil</span>
                </button>

                <button
                  onClick={() => onTabChange('settings')}
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

          {/* Footer du Sidebar */}
          <div className="p-4 border-t border-gray-100">
            <div className="bg-blue-50 rounded-xl p-4">
              <div className="flex items-center justify-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <HelpCircle className="h-5 w-5 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">Besoin d'aide ?</p>
                  <p className="text-xs text-gray-500">Contactez le support</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="flex-1 ml-80 pt-24 p-8"> {/* Changé pt-16 à pt-24 pour plus d'espace */}
        {/* En-tête de la page - sans carte blanche */}
        <div className="w-[95%] mx-auto mb-8">
          <div className="flex items-center">
            <div>
              <h2 className="text-2xl font-bold text-blue-600"> {/* Changé text-gray-800 en text-blue-600 */}
                {activeTab === 'accounts' ? 'Mes Comptes' : 
                activeTab === 'history' ? 'Historique' : 
                activeTab === 'bills' ? 'Paiements de factures' :
                activeTab === 'scheduled' ? 'Virements Programmés' :
                activeTab === 'settings' ? 'Paramètres' :
                'Profil'}
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {activeTab === 'accounts' ? 'Gérez vos comptes bancaires' : 
                activeTab === 'history' ? 'Consultez vos transactions' : 
                activeTab === 'bills' ? 'Réglez vos factures' :
                activeTab === 'scheduled' ? 'Gérez vos virements programmés' :
                activeTab === 'settings' ? 'Configurez vos préférences' :
                'Gérez vos informations personnelles'}
              </p>
            </div>
          </div>
        </div>

        {/* Contenu */}
        <div className="w-[95%] mx-auto">
          {renderContent()}
        </div>
      </div>

      {/* Transfer Modal */}
      {showTransferForm && selectedAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-[100]">
          <div className="bg-white rounded-xl shadow-2xl max-w-2xl w-full p-6 transform transition-all">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-xl font-bold text-gray-800">
                {formData.isScheduled ? 'Programmer un virement' : 'Effectuer un virement'}
              </h3>
              <button 
                onClick={() => setShowTransferForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 rounded-lg p-4">
              <p className="text-sm text-gray-600">Depuis le compte</p>
              <p className="text-lg font-semibold text-gray-800">{selectedAccount.accountNumber}</p>
              <p className="text-sm text-gray-600 mt-2">Solde disponible</p>
              <p className="text-lg font-semibold text-blue-600">{formatCurrency(selectedAccount.balance)}</p>
            </div>

              {formData.isScheduled && (
                <div className="bg-blue-50 rounded-lg p-4">
                  <p className="text-sm text-blue-600 font-medium">Informations de programmation</p>
                  <p className="text-xs text-blue-500 mt-1">Le virement sera executé à la date et l'heure spécifiées</p>
                </div>
              )}
            </div>

            <form onSubmit={handleTransfer} className="mt-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Compte bénéficiaire
                </label>
                <input
                  type="text"
                  value={formData.toAccountNumber}
                  onChange={(e) => setFormData({...formData, toAccountNumber: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Numéro de compte"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Nom du bénéficiaire
                </label>
                <input
                  type="text"
                  value={formData.beneficiaryName}
                  onChange={(e) => setFormData({...formData, beneficiaryName: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Nom complet du bénéficiaire"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Montant
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500 text-sm">TND</span>
                  <input
                    type="number"
                    step="0.001"
                    min="0"
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({...formData, amount: parseFloat(e.target.value)})}
                    className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    placeholder="0.000"
                    required
                  />
                  <div className="absolute right-3 top-2.5 text-gray-400">
                    <Coins size={16} /> {/* Réduire la taille de l'icône */}
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Mot de passe
                </label>
                <input
                  type="password"
                  value={formData.password}
                  onChange={(e) => setFormData({...formData, password: e.target.value})}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                  placeholder="Votre mot de passe"
                  required
                />
              </div>

              {formData.isScheduled && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Date du virement
                    </label>
                    <input
                      type="date"
                      value={formData.scheduledDate}
                      min={new Date().toISOString().split('T')[0]}
                      onChange={(e) => setFormData({...formData, scheduledDate: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required={formData.isScheduled}
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Heure du virement
                    </label>
                    <input
                      type="time"
                      value={formData.scheduledTime}
                      onChange={(e) => setFormData({...formData, scheduledTime: e.target.value})}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                      required={formData.isScheduled}
                    />
                  </div>
                </>
              )}
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowTransferForm(false)}
                  className="px-4 py-2 text-sm text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Traitement...
                    </>
                  ) : (
                    <>
                      <Send size={16} className="mr-2" />
                      {formData.isScheduled ? 'Programmer le virement' : 'Confirmer le virement'}
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Formulaire de paiement de facture */}
      {showBillForm && selectedService && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 transform transition-all font-['Poppins']">
            <div className="flex justify-between items-center mb-6">
              <div className="flex items-center space-x-3">
                <div className={`p-3 rounded-xl ${
                  selectedService === 'electricity' ? 'bg-yellow-100' :
                  selectedService === 'water' ? 'bg-blue-100' :
                  selectedService === 'internet' ? 'bg-purple-100' :
                  selectedService === 'phone' ? 'bg-green-100' :
                  selectedService === 'tax' ? 'bg-red-100' :
                  'bg-orange-100'
                }`}>
                  {selectedService === 'electricity' ? <Zap className="h-6 w-6 text-yellow-600" /> :
                   selectedService === 'water' ? <Droplets className="h-6 w-6 text-blue-600" /> :
                   selectedService === 'internet' ? <Wifi className="h-6 w-6 text-purple-600" /> :
                   selectedService === 'phone' ? <Phone className="h-6 w-6 text-green-600" /> :
                   selectedService === 'tax' ? <Home className="h-6 w-6 text-red-600" /> :
                   <Car className="h-6 w-6 text-orange-600" />}
                </div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Paiement {
                    selectedService === 'electricity' ? 'Électricité' :
                    selectedService === 'water' ? 'Eau' :
                    selectedService === 'internet' ? 'Internet' :
                    selectedService === 'phone' ? 'Téléphone' :
                    selectedService === 'tax' ? 'Impôts' :
                    'Assurance'
                  }
                </h3>
              </div>
              <button
                onClick={() => setShowBillForm(false)}
                className="text-gray-400 hover:text-gray-600 transition-colors"
              >
                <X size={24} />
              </button>
            </div>

            <form onSubmit={handleBillPayment} className="space-y-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Compte à débiter
                  </label>
                  <select
                    value={billForm.accountId}
                    onChange={(e) => setBillForm({...billForm, accountId: Number(e.target.value)})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  >
                    <option value="">Slectionner un compte</option>
                    {accounts.map(account => (
                      <option key={account.id} value={account.id}>
                        {account.accountNumber} - {formatCurrency(account.balance)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Référence client
                  </label>
                  <input
                    type="text"
                    value={billForm.reference}
                    onChange={(e) => setBillForm({...billForm, reference: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Numéro de référence"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Montant
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-gray-500">TND</span>
                    <input
                      type="number"
                      step="0.001"  // Modifier pour supporter les millimes
                      value={billForm.amount || ''}
                      onChange={(e) => setBillForm({...billForm, amount: Number(e.target.value)})}
                      className="w-full pl-14 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      placeholder="0.000"
                      required
                    />
                    <div className="absolute right-3 top-2.5 text-gray-400">
                      <Coins size={16} /> {/* Réduire la taille de l'icône */}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Mot de passe
                  </label>
                  <input
                    type="password"
                    value={billForm.password}
                    onChange={(e) => setBillForm({...billForm, password: e.target.value})}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Votre mot de passe"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowBillForm(false)}
                  className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="px-6 py-2 bg-gradient-to-r from-[#1F53DD] to-[#1941B0] text-white rounded-lg hover:from-[#1941B0] hover:to-[#132F85] transition-all duration-300 flex items-center"
                >
                  {isLoading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Traitement...
                    </>
                  ) : (
                    'Payer'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Ajouter le composant ProfileComponent */}
      <ProfileComponent 
        isOpen={showProfile} 
        onClose={() => setShowProfile(false)} 
      />
    </div>
  )
}