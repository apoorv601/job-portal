// login.js
// Handles login for both applicants and recruiters based on URL param

document.addEventListener('DOMContentLoaded', () => {
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
                const response = await fetch('/api/login', {
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
                
                // Redirect to home page after login
                console.log('Redirecting to index.html...');
                if (role === 'recruiter') {
                    window.location.href = 'recruiter-profile.html';
                } else {
                    window.location.href = 'applicant-profile.html';
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
