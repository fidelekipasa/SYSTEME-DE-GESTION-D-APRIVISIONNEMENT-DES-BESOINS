export const fetchAccounts = async () => {
  const credentials = localStorage.getItem('credentials');
  const response = await fetch('http://localhost:8080/api/accounts', {
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type': 'application/json'
    },
    credentials: 'include'
  });
  return response.json();
}; 