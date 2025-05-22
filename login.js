// login.js
// Handles login for both applicants and recruiters based on URL param

// --- API base path detection for local/cloud ---
const isProd = window.location.hostname === 'adage.host';
const API_BASE = isProd
  ? 'https://adage.host/Job_for_Expats/api'
  : '/api';

// Keep a debug log of the API base path used - this helps debugging
console.log('Using API base path:', API_BASE);

// Function to check database connection status
async function checkDatabaseConnection() {
    try {
        console.log('Checking database connection status...');
        const response = await fetch(`${API_BASE}/dbstatus`);
        const data = await response.json();
        console.log('Database connection status:', data);
        
        // Create or update the status indicator
        let statusIndicator = document.getElementById('db-status-indicator');
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'db-status-indicator';
            statusIndicator.style.position = 'fixed';
            statusIndicator.style.bottom = '10px';
            statusIndicator.style.right = '10px';
            statusIndicator.style.padding = '8px 12px';
            statusIndicator.style.borderRadius = '4px';
            statusIndicator.style.fontSize = '12px';
            statusIndicator.style.zIndex = '9999';
            document.body.appendChild(statusIndicator);
        }
        
        if (data.connected) {
            statusIndicator.style.backgroundColor = '#4CAF50';
            statusIndicator.style.color = 'white';
            statusIndicator.innerHTML = '✓ Database Connected';
            statusIndicator.title = `MongoDB connected at: ${data.timestamp}`;
        } else {
            statusIndicator.style.backgroundColor = '#F44336';
            statusIndicator.style.color = 'white';
            statusIndicator.innerHTML = '✗ Database Error';
            statusIndicator.title = `Error: ${data.error || 'Unknown error'}\nTimestamp: ${data.timestamp}`;
        }
        
        // Click to show more details
        statusIndicator.style.cursor = 'pointer';
        statusIndicator.onclick = function() {
            alert(`Database Status:\n
Connection: ${data.connected ? 'Connected' : 'Disconnected'}
Timestamp: ${data.timestamp}
${data.error ? 'Error: ' + data.error : ''}`);
        };
        
        return data.connected;
    } catch (error) {
        console.error('Failed to check database status:', error);
        
        // Create status indicator for connection failure
        let statusIndicator = document.getElementById('db-status-indicator');
        if (!statusIndicator) {
            statusIndicator = document.createElement('div');
            statusIndicator.id = 'db-status-indicator';
            statusIndicator.style.position = 'fixed';
            statusIndicator.style.bottom = '10px';
            statusIndicator.style.right = '10px';
            statusIndicator.style.padding = '8px 12px';
            statusIndicator.style.borderRadius = '4px';
            statusIndicator.style.fontSize = '12px';
            statusIndicator.style.zIndex = '9999';
            document.body.appendChild(statusIndicator);
        }
        
        statusIndicator.style.backgroundColor = '#FF9800';
        statusIndicator.style.color = 'white';
        statusIndicator.innerHTML = '! API Connection Error';
        statusIndicator.title = `Could not connect to API endpoint: ${API_BASE}/dbstatus`;
        
        return false;
    }
}

document.addEventListener('DOMContentLoaded', () => {
    // Check database connection on page load
    checkDatabaseConnection();
    const loginForm = document.getElementById('login-form');
    // Set role input based on URL param
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || 'applicant';
    const roleInput = document.getElementById('login-role');
    if (roleInput) roleInput.value = role;
    // Recruiter/applicant switch
    const recruiterLink = document.querySelector('.role-switch a');
    if (recruiterLink) {
        recruiterLink.addEventListener('click', e => {
            e.preventDefault();
            window.location.href = 'login.html?role=recruiter';
        });
    }
    if (loginForm && !loginForm.hasListener) {
        loginForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('username').value;
            const password = document.getElementById('password').value;
            let role = 'applicant';
            const roleInput = document.getElementById('login-role');
            if (roleInput) {
                role = roleInput.value;
            } else {
                const params = new URLSearchParams(window.location.search);
                if (params.get('role')) role = params.get('role');
            }
            if (!username || !password) {
                alert('Please enter both username and password');
                return;
            }
            try {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Logging in...';
                }
                console.log('Sending login request:', { username, password });
                const response = await fetch(`${API_BASE}/login`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                console.log('Login response status:', response.status);
                let data;
                try {
                    data = await response.json();
                } catch (jsonErr) {
                    console.error('Failed to parse JSON:', jsonErr);
                    alert('Server did not return valid JSON. Check backend logs.');
                    return;
                }                console.log('Login response data:', data);
                if (!response.ok) {
                    alert('Login failed: ' + (data.message || 'Unknown error'));
                    throw new Error(data.message || 'Login failed. Please check your username and password, or ensure the backend server is running.');
                }
                
                // Successful login - verify token exists
                if (!data.token) {
                    console.error('No token returned from server');
                    alert('Login failed: Server did not return an authentication token');
                    return;
                }
                
                console.log('Login successful, storing token and redirecting...');
                
                // Store auth token
                localStorage.setItem('authToken', data.token);
                
                // Store user data for easy access
                if (data.user) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                }
                
                // Optionally store account info for multi-account support
                let accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
                accounts = accounts.filter(acc => acc.username !== username || acc.role !== role);
                accounts.push({ username, role, token: data.token });
                localStorage.setItem('accounts', JSON.stringify(accounts));
                
                // On successful login, redirect to home page
                if (data.token) {
                    localStorage.setItem('authToken', data.token);
                    window.location.href = 'index.html';
                    return;
                }
            } catch (error) {
                console.error('Login error:', error);
                alert(error.message || 'Invalid username or password. If the problem persists, ensure the backend server is running and seeded with users.');
            } finally {
                const submitBtn = loginForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Login';
                }
            }
        });
        loginForm.hasListener = true;
    }
});
