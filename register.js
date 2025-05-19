// register.js
// Handles registration for both applicants and recruiters based on URL param

document.addEventListener('DOMContentLoaded', () => {
    const registerForm = document.getElementById('register-form');
    const roleInput = document.getElementById('register-role');
    // Set role from URL param
    const params = new URLSearchParams(window.location.search);
    const role = params.get('role') || 'applicant';
    roleInput.value = role;
    registerForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('reg-username').value;
        const password = document.getElementById('reg-password').value;
        const name = document.getElementById('reg-name').value;
        const email = document.getElementById('reg-email').value;
        const nationality = document.getElementById('reg-nationality').value;
        const currentLocation = document.getElementById('reg-location').value;
        if (!username || !password || !name || !email) {
            alert('Please fill in all required fields');
            return;
        }
        try {
            const response = await fetch('/api/register', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    username,
                    password,
                    role,
                    name,
                    email,
                    nationality,
                    currentLocation
                })
            });
            const data = await response.json();
            if (!response.ok) {
                throw new Error(data.message || 'Registration failed');
            }
            alert('Registration successful! Please login.');
            window.location.href = `/login.html?role=${role}`;
        } catch (error) {
            alert(error.message || 'Registration failed');
        }
    });
});
