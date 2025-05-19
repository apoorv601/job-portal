// Utility functions
function getTimeAgo(date) {
    const seconds = Math.floor((new Date() - date) / 1000);
    let interval = Math.floor(seconds / 31536000);
    
    if (interval >= 1) {
        return interval + " year" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 2592000);
    if (interval >= 1) {
        return interval + " month" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 86400);
    if (interval >= 1) {
        return interval + " day" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 3600);
    if (interval >= 1) {
        return interval + " hour" + (interval === 1 ? "" : "s") + " ago";
    }
    interval = Math.floor(seconds / 60);
    if (interval >= 1) {
        return interval + " minute" + (interval === 1 ? "" : "s") + " ago";
    }
    return "just now";
}

function capitalizeFirstLetter(string) {
    if (!string) return '';
    return string.charAt(0).toUpperCase() + string.slice(1);
}

// --- DOMContentLoaded main logic ---
document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const jobListingsSection = document.getElementById('job-listings');
    const jobDetailsSection = document.getElementById('job-details');
    const jobDetailsContent = document.getElementById('job-details-content');
    const backToListingsButton = document.getElementById('back-to-listings');
    const searchBar = document.getElementById('search-bar');
    const filterForm = document.getElementById('filter-form');
    const applicationForm = document.getElementById('application-form');
    const loginButton = document.getElementById('login-button');
    const registerButton = document.getElementById('register-button');
    const loginSection = document.getElementById('login-section');
    const registerSection = document.getElementById('register-section');
    const loginForm = document.getElementById('login-form');
    const registerForm = document.getElementById('register-form');
    const profileSection = document.getElementById('profile-section');
    const profileContent = document.getElementById('profile-content');
    const logoutButton = document.getElementById('logout-button');
    const postJobSection = document.getElementById('post-job-section');
    const postJobForm = document.getElementById('post-job-form');
    
    // Additional DOM elements for enhanced features
    const jobsContainer = document.getElementById('jobs-container');
    const jobsLoading = document.getElementById('jobs-loading');
    const jobsPagination = document.getElementById('jobs-pagination');
    const sortBySelect = document.getElementById('sort-by');
    const showRegisterLink = document.getElementById('show-register');
    const showLoginLink = document.getElementById('show-login');
    const editProfileButton = document.getElementById('edit-profile-button');
    const cancelApplicationButton = document.getElementById('cancel-application');
    const applicationJobTitle = document.getElementById('application-job-title');
    const companyProfileSection = document.getElementById('company-profile-section');
    const applicationsSection = document.getElementById('applications-section');
    
    // Filter elements
    const locationFilter = document.getElementById('location');
    const jobTypeFilter = document.getElementById('job-type');
    const industryFilter = document.getElementById('industry');
    const salaryRangeFilter = document.getElementById('salary-range');
    const languageFilter = document.getElementById('language');
    const expatFriendlyCheckbox = document.getElementById('expat-friendly');
    const visaSponsorshipCheckbox = document.getElementById('visa-sponsorship');
    
    // Search functionality elements
    const jobSearchInput = document.getElementById('job-search-input');
    const jobSearchButton = document.getElementById('search-button');
    const searchTags = document.querySelectorAll('.search-tag');
    const searchResults = document.getElementById('search-results');
    const searchResultsContent = document.getElementById('search-results-content');
    const resultCount = document.getElementById('result-count');
    
    // State Management
    let currentUser = null;
    let authToken = localStorage.getItem('authToken');
    let currentPage = 1;
    let totalPages = 1;
    let currentFilters = {};
    let currentSort = 'relevance';
    let currentSelectedJob = null;
    
    // Form validation utility
    function validateForm(formData, rules) {
        const errors = {};
        
        for (const field in rules) {
            const value = formData[field];
            const fieldRules = rules[field];
            
            // Required check
            if (fieldRules.required && (!value || value.trim() === '')) {
                errors[field] = `${fieldRules.label} is required`;
                continue;
            }
            
            // Minimum length check
            if (value && fieldRules.minLength && value.length < fieldRules.minLength) {
                errors[field] = `${fieldRules.label} must be at least ${fieldRules.minLength} characters`;
            }
            
            // Email format check
            if (value && fieldRules.isEmail) {
                const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
                if (!emailRegex.test(value)) {
                    errors[field] = `Please enter a valid email address`;
                }
            }
            
            // Match check (for password confirmation etc)
            if (value && fieldRules.match && value !== formData[fieldRules.match]) {
                errors[field] = `${fieldRules.label} does not match ${rules[fieldRules.match].label}`;
            }
        }
        
        return Object.keys(errors).length > 0 ? errors : null;
    }
    
    // Display validation errors in form
    function showValidationErrors(form, errors) {
        // Clear previous errors
        const previousErrors = form.querySelectorAll('.form-error');
        previousErrors.forEach(el => el.remove());
        
        // Add new error messages
        for (const field in errors) {
            const input = form.querySelector(`[name="${field}"]`);
            if (input) {
                input.classList.add('input-error');
                
                const errorEl = document.createElement('div');
                errorEl.className = 'form-error';
                errorEl.textContent = errors[field];
                
                input.parentNode.insertBefore(errorEl, input.nextSibling);
            }
        }
    }
    
    // Clear validation errors
    function clearValidationErrors(form) {
        const errorFields = form.querySelectorAll('.input-error');
        errorFields.forEach(field => field.classList.remove('input-error'));
        
        const errorMessages = form.querySelectorAll('.form-error');
        errorMessages.forEach(el => el.remove());
    }
    
    // Check if user is already logged in
    if (authToken) {
        try {
            currentUser = jwt_decode(authToken);
            console.log('User authenticated:', currentUser);
            
            // Update UI based on authentication
            setTimeout(() => {
                // displayProfile(); // Removed: not defined on this page
                updateAuthenticationUI(true);
                console.log('Authentication UI updated for logged-in user');
            }, 0);
        } catch (error) {
            console.error('Invalid token:', error);
            localStorage.removeItem('authToken');
            authToken = null;
            updateAuthenticationUI(false);
        }
    } else {
        console.log('No auth token found, user not logged in');
        updateAuthenticationUI(false);
    }
    
    // --- 1. Always load jobs on home page and handle spinner ---
    async function fetchJobs(page = 1, filters = {}, sort = 'relevance') {
        try {
            jobsLoading.style.display = 'flex';
            jobsContainer.innerHTML = '';
            
            // Build query params
            let queryParams = new URLSearchParams({
                page,
                limit: 10,
                ...filters
            });
            
            // Add sort parameter
            if (sort === 'date-desc') {
                queryParams.append('sort', 'postedAt:-1');
            } else if (sort === 'salary-desc') {
                queryParams.append('sort', 'salary.min:-1');
            }
            
            const response = await fetch(`/api/jobs?${queryParams}`, {
                // Adding a timeout to prevent long wait if server is down
                signal: AbortSignal.timeout(5000)
            }).catch(error => {
                // This will catch network errors like server not running
                throw new Error('Server connection failed. Please verify that the backend server is running.');
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch jobs');
            }
            
            const data = await response.json();
            
            // Update state
            currentPage = data.currentPage;
            totalPages = data.totalPages;
            
            displayJobListings(data.jobs);
            displayPagination(data.currentPage, data.totalPages);
            
            return data;
        } catch (error) {
            console.error('Error fetching jobs:', error);
            jobsContainer.innerHTML = `
                <div class="error-message">
                    <h3>Connection Error</h3>
                    <p>${error.message}</p>
                    <div class="server-instructions">
                        <h4>How to start the server:</h4>
                        <ol>
                            <li>Make sure MongoDB is installed and running</li>
                            <li>Open a terminal in the project root directory</li>
                            <li>Run: <code>npm install</code> (if you haven't already)</li>
                            <li>Run: <code>npm start</code> or <code>node backend/server.js</code></li>
                        </ol>
                    </div>
                </div>
            `;
        } finally {
            jobsLoading.style.display = 'none';
        }
    }

    function displayJobListings(jobs) {
        if (jobs.length === 0) {
            jobsContainer.innerHTML = `
                <div class="no-results">
                    <h3>No jobs found</h3>
                    <p>Try adjusting your search criteria</p>
                </div>
            `;
            return;
        }
        
        jobsContainer.innerHTML = '';
        
        jobs.forEach(job => {
            const jobElement = document.createElement('div');
            jobElement.classList.add('job-listing');
            
            // Format salary range if available
            let salaryDisplay = 'Not specified';
            if (job.salary && job.salary.min) {
                salaryDisplay = job.salary.min.toLocaleString();
                if (job.salary.max) {
                    salaryDisplay += ` - ${job.salary.max.toLocaleString()}`;
                }
                salaryDisplay += ` ${job.salary.currency || 'HKD'}`;
                if (job.salary.period === 'monthly') {
                    salaryDisplay += ' per month';
                } else if (job.salary.period === 'annual') {
                    salaryDisplay += ' per year';
                }
            }
            
            // Create posted date
            const postedDate = job.postedAt ? new Date(job.postedAt) : new Date();
            const timeAgo = getTimeAgo(postedDate);
            
            jobElement.innerHTML = `
                <div class="job-listing-content">
                    <h3 class="job-title">${job.title}</h3>
                    <div class="company-name">${job.company}</div>
                    <div class="job-meta">
                        <span class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                        <span class="job-type"><i class="fas fa-briefcase"></i> ${capitalizeFirstLetter(job.type)}</span>
                        <span class="job-salary"><i class="fas fa-money-bill-wave"></i> ${salaryDisplay}</span>
                        <span class="job-posted"><i class="far fa-clock"></i> ${timeAgo}</span>
                    </div>
                    ${job.suitableForExpats ? '<span class="expat-friendly-badge">Expat Friendly</span>' : ''}
                    ${job.visaSponsorshipOffered ? '<span class="visa-sponsored-badge">Visa Sponsorship</span>' : ''}
                </div>
            `;
            
            jobElement.addEventListener('click', () => fetchAndDisplayJobDetails(job._id));
            jobsContainer.appendChild(jobElement);
        });
    }
      async function fetchAndDisplayJobDetails(jobId) {
        try {
            jobDetailsContent.innerHTML = `<div class="loading-spinner"></div>`;
            jobListingsSection.classList.add('hidden');
            jobDetailsSection.classList.remove('hidden');
            
            const response = await fetch(`/api/jobs/${jobId}`);
            
            if (!response.ok) {
                throw new Error('Failed to fetch job details');
            }
            
            const job = await response.json();
            currentSelectedJob = job;
            displayJobDetails(job);
            
        } catch (error) {
            console.error('Error fetching job details:', error);
            jobDetailsContent.innerHTML = `<p class="error-message">Failed to load job details. Please try again later.</p>`;
        }
    }
    
    function displayJobDetails(job) {
        // Format posted date
        const postedDate = job.postedAt ? new Date(job.postedAt) : new Date();
        const timeAgo = getTimeAgo(postedDate);
        
        // Format salary range
        let salaryDisplay = 'Not specified';
        if (job.salary && job.salary.min) {
            salaryDisplay = job.salary.min.toLocaleString();
            if (job.salary.max) {
                salaryDisplay += ` - ${job.salary.max.toLocaleString()}`;
            }
            salaryDisplay += ` ${job.salary.currency || 'HKD'}`;
            if (job.salary.period === 'monthly') {
                salaryDisplay += ' per month';
            } else if (job.salary.period === 'annual') {
                salaryDisplay += ' per year';
            }
        }
        
        // Format requirements list if available
        let requirementsList = '';
        if (job.requirements && job.requirements.length > 0) {
            requirementsList = '<ul>' + job.requirements.map(req => `<li>${req}</li>`).join('') + '</ul>';
        }
        
        // Format responsibilities list if available
        let responsibilitiesList = '';
        if (job.responsibilities && job.responsibilities.length > 0) {
            responsibilitiesList = '<ul>' + job.responsibilities.map(resp => `<li>${resp}</li>`).join('') + '</ul>';
        }
        
        // Format languages required
        let languagesHtml = '';
        if (job.languages && job.languages.length > 0) {
            languagesHtml = '<div class="job-languages"><h4>Required Languages:</h4><ul>';
            job.languages.forEach(lang => {
                languagesHtml += `<li>${lang.language}: ${lang.proficiency}</li>`;
            });
            languagesHtml += '</ul></div>';
        }
        
        // Create the company name with link if available
        const companyLink = job.companyId 
            ? `<a href="#" class="company-link" data-company-id="${job.companyId}">${job.company}</a>` 
            : job.company;
        
        // Generate the job detail HTML
        jobDetailsContent.innerHTML = `
            <div class="job-details-header">
                <h2>${job.title}</h2>
                <div class="company-name">${companyLink}</div>
                <div class="job-meta">
                    <span class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span class="job-type"><i class="fas fa-briefcase"></i> ${capitalizeFirstLetter(job.type)}</span>
                    <span class="job-salary"><i class="fas fa-money-bill-wave"></i> ${salaryDisplay}</span>
                    <span class="job-posted"><i class="far fa-clock"></i> Posted ${timeAgo}</span>
                </div>
                <div class="job-badges">
                    ${job.suitableForExpats ? '<span class="expat-friendly-badge">Expat Friendly</span>' : ''}
                    ${job.visaSponsorshipOffered ? '<span class="visa-sponsored-badge">Visa Sponsorship</span>' : ''}
                </div>
            </div>
            
            <div class="job-details-content">
                <div class="job-description">
                    <h3>Job Description</h3>
                    <div>${job.description}</div>
                </div>
                
                ${job.responsibilities.length > 0 ? 
                    `<div class="job-responsibilities">
                        <h3>Responsibilities</h3>
                        ${responsibilitiesList}
                    </div>` : ''
                }
                
                ${job.requirements.length > 0 ? 
                    `<div class="job-requirements">
                        <h3>Requirements</h3>
                        ${requirementsList}
                    </div>` : ''
                }
                
                ${languagesHtml}
                
                ${job.benefits && job.benefits.length > 0 ? 
                    `<div class="job-benefits">
                        <h3>Benefits</h3>
                        <ul>
                            ${job.benefits.map(benefit => `<li>${benefit}</li>`).join('')}
                        </ul>
                    </div>` : ''
                }
            </div>
            
            <div class="job-application-button mt-3">
                <button id="apply-job-button" class="apply-button">Apply Now</button>
            </div>
        `;
        
        // Add event listener for apply button
        const applyBtn = document.getElementById('apply-job-button');
        if (applyBtn) {
            applyBtn.onclick = function() {
                // Only allow if logged in and applicant
                let userData = null;
                try { userData = JSON.parse(localStorage.getItem('currentUser')); } catch (e) {}
                if (!userData || userData.role !== 'applicant') {
                    alert('You must be logged in as an applicant to apply for jobs.');
                    window.location.href = 'login.html?role=applicant';
                    return;
                }
                // Show application form or submit application logic here
                // For now, just show a simple prompt and simulate application
                const applicantName = userData.name || userData.username;
                const applicantEmail = userData.email || '';
                const coverLetter = prompt('Enter a short cover letter for this job application:', '');
                if (coverLetter === null) return;
                fetch(`/api/jobs/${job._id}/apply`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': 'Bearer ' + localStorage.getItem('authToken')
                    },
                    body: JSON.stringify({ coverLetter, applicantName, applicantEmail })
                })
                .then(res => res.json())
                .then(data => {
                    if (data && data.success) {
                        alert('Application submitted successfully!');
                        refreshMyApplicationsIfOnPage && refreshMyApplicationsIfOnPage();
                    } else {
                        alert(data.message || 'Application failed.');
                    }
                })
                .catch(() => alert('Could not submit application. Please try again.'));
            };
        }
    }

    // --- Add displayPagination stub to prevent JS error ---
    function displayPagination(currentPage, totalPages) {
        // Optionally, implement pagination UI here
        // For now, just log to console to prevent error
        // You can enhance this to show real pagination controls
        // Example: console.log(`Page ${currentPage} of ${totalPages}`);
    }

    // --- Attach event listeners with null checks and only once ---
    if (backToListingsButton && !backToListingsButton.hasListener) {
        backToListingsButton.addEventListener('click', () => {
            jobDetailsSection.classList.add('hidden');
            jobListingsSection.classList.remove('hidden');
        });
        backToListingsButton.hasListener = true;
    }

    // Add event listeners for search
    const searchButton = document.getElementById('search-button');
    
    if (searchButton && !searchButton.hasListener) {
        searchButton.addEventListener('click', () => {
            performSearch();
        });
        searchButton.hasListener = true;
    }
    
    if (searchBar && !searchBar.hasListener) {
        searchBar.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                performSearch();
            }
        });
        searchBar.hasListener = true;
    }
    
    // Add click events for search tags
    document.querySelectorAll('.search-tags a').forEach(tag => {
        tag.addEventListener('click', (e) => {
            e.preventDefault();
            const searchTerm = tag.getAttribute('data-search');
            if (searchBar) {
                searchBar.value = searchTerm;
                performSearch();
            }
        });
    });
    
    // Search function
    function performSearch() {
        if (!searchBar) return;
        
        const searchTerm = searchBar.value.trim();
        if (!searchTerm) return;
        
        // Show loading state
        if (jobsContainer) {
            jobsContainer.innerHTML = '<div class="loading-spinner"></div>';
        }
        
        // Scroll to job listings
        document.getElementById('job-listings')?.scrollIntoView({ behavior: 'smooth' });
        
        // Fetch jobs with the search term
        fetch(`/api/jobs?search=${encodeURIComponent(searchTerm)}`)
            .then(response => {
                if (!response.ok) {
                    throw new Error('Search failed');
                }
                return response.json();
            })
            .then(data => {
                if (jobsContainer) {
                    if (data.jobs && data.jobs.length > 0) {
                        displayJobListings(data.jobs);
                    } else {
                        jobsContainer.innerHTML = `
                            <div class="no-results">
                                <h3>No jobs found for "${searchTerm}"</h3>
                                <p>Try different keywords or check out our latest listings</p>
                            </div>
                        `;
                    }
                }
            })
            .catch(error => {
                console.error('Search error:', error);
                if (jobsContainer) {
                    jobsContainer.innerHTML = `
                        <div class="error-message">
                            <h3>Search Error</h3>
                            <p>${error.message}</p>
                        </div>
                    `;
                }
            });
    }

    if (document.getElementById('search-button')) {
        document.getElementById('search-button').addEventListener('click', async () => {
            const searchTerm = searchBar.value.trim().toLowerCase();
            if (!searchTerm) return;
            const response = await fetch(`/api/jobs?search=${encodeURIComponent(searchTerm)}`);
            const data = await response.json();
            displayJobListings(data.jobs || []);
        });
    }

    if (filterForm && !filterForm.hasListener) {
        filterForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            // Build filter object from form values
            const filterData = {
                location: locationFilter.value !== 'all' ? locationFilter.value : null,
                type: jobTypeFilter.value !== 'all' ? jobTypeFilter.value : null,
                industry: industryFilter.value !== 'all' ? industryFilter.value : null,
                language: languageFilter.value !== 'all' ? languageFilter.value : null,
                suitableForExpats: expatFriendlyCheckbox.checked ? true : null,
                visaSponsorshipOffered: visaSponsorshipCheckbox.checked ? true : null
            };
            
            // Add salary filter if selected
            if (salaryRangeFilter.value !== 'all') {
                const salaryRange = salaryRangeFilter.value.split('-');
                if (salaryRange.length === 2) {
                    filterData.minSalary = salaryRange[0];
                    filterData.maxSalary = salaryRange[1];
                } else if (salaryRange[0].endsWith('+')) {
                    filterData.minSalary = salaryRange[0].replace('+', '');
                }
            }
            
            // Remove null values
            Object.keys(filterData).forEach(key => {
                if (filterData[key] === null) {
                    delete filterData[key];
                }
            });
            
            // Update state and fetch with filters
            currentFilters = filterData;
            currentPage = 1;
            
            await fetchJobs(1, currentFilters, currentSort);
        });
        filterForm.hasListener = true;
    }

    if (applicationForm && !applicationForm.hasListener) {
        applicationForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const jobId = document.getElementById('job-id').value;
            const applicantName = document.getElementById('applicant-name').value;
            const applicantEmail = document.getElementById('applicant-email').value;

            console.log(`Applicant ${applicantName} (${applicantEmail}) applied for job ID ${jobId}`);
            alert('Application submitted successfully!');
            applicationForm.reset();
        });
        applicationForm.hasListener = true;
    }

    if (loginButton && !loginButton.hasListener) {
        loginButton.addEventListener('click', () => {
            loginSection.classList.remove('hidden');
        });
        loginButton.hasListener = true;
    }

    if (registerButton && !registerButton.hasListener) {
        registerButton.addEventListener('click', () => {
            registerSection.classList.remove('hidden');
        });
        registerButton.hasListener = true;
    }

    if (showRegisterLink && !showRegisterLink.hasListener) {
        showRegisterLink.addEventListener('click', (e) => {
            e.preventDefault();
            loginSection.classList.add('hidden');
            registerSection.classList.remove('hidden');
        });
        showRegisterLink.hasListener = true;
    }

    if (showLoginLink && !showLoginLink.hasListener) {
        showLoginLink.addEventListener('click', (e) => {
            e.preventDefault();
            registerSection.classList.add('hidden');
            loginSection.classList.remove('hidden');
        });
        showLoginLink.hasListener = true;
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
                const response = await fetch('/api/login', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password })
                });
                const data = await response.json();
                if (!response.ok) {
                    // Show backend error message if available
                    throw new Error(data.message || 'Login failed. Please check your username and password, or ensure the backend server is running.');
                }
                authToken = data.token;
                localStorage.setItem('authToken', authToken);
                currentUser = jwt_decode(authToken);
                // Store user info for role-based UI
                if (data.user) {
                    localStorage.setItem('currentUser', JSON.stringify(data.user));
                }
                saveLoginAccount(username, role, data.token);
                if (loginSection) loginSection.classList.add('hidden');
                if (typeof updateAuthenticationUI === 'function') updateAuthenticationUI(true);
                // Redirect to correct profile page after login
                if (data.user && data.user.role === 'recruiter') {
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

    if (registerForm && !registerForm.hasListener) {
        registerForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const username = document.getElementById('reg-username')?.value;
            const password = document.getElementById('reg-password')?.value;
            const role = document.getElementById('reg-role')?.value;
            const name = document.getElementById('reg-name')?.value;
            const email = document.getElementById('reg-email')?.value;
            const nationality = document.getElementById('reg-nationality')?.value;
            const currentLocation = document.getElementById('reg-location')?.value;
            if (!username || !password || !name || !email) {
                alert('Please fill in all required fields');
                return;
            }
            try {
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = true;
                    submitBtn.textContent = 'Registering...';
                }
                const response = await fetch('/api/register', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({ username, password, role, name, email, nationality, currentLocation })
                });
                const data = await response.json();
                if (!response.ok) {
                    throw new Error(data.message || 'Registration failed');
                }
                alert('Registration successful! Please login.');
                if (registerSection) registerSection.classList.add('hidden');
                if (loginSection) loginSection.classList.remove('hidden');
                const usernameInput = document.getElementById('username');
                if (usernameInput) usernameInput.value = username;
                const passwordInput = document.getElementById('password');
                if (passwordInput) passwordInput.focus();
                registerForm.reset();
            } catch (error) {
                console.error('Registration error:', error);
                alert(error.message || 'Registration failed. Please try again.');
            } finally {
                const submitBtn = registerForm.querySelector('button[type="submit"]');
                if (submitBtn) {
                    submitBtn.disabled = false;
                    submitBtn.textContent = 'Register';
                }
            }
        });
        registerForm.hasListener = true;
    }

    const regRole = document.getElementById('reg-role');
    if (regRole && !regRole.hasListener) {
        regRole.addEventListener('change', function() {
            const nationalityGroup = document.getElementById('nationality-group');
            const locationGroup = document.getElementById('location-group');
            if (this.value === 'applicant') {
                nationalityGroup.style.display = 'block';
                locationGroup.style.display = 'block';
            } else {
                nationalityGroup.style.display = 'none';
                locationGroup.style.display = 'none';
            }
        });
        regRole.hasListener = true;
    }

    if (sortBySelect && !sortBySelect.hasListener) {
        sortBySelect.addEventListener('change', () => {
            currentSort = sortBySelect.value;
            fetchJobs(1, currentFilters, currentSort);
        });
        sortBySelect.hasListener = true;
    }

    // --- 2. Store multiple login accounts in localStorage ---
    function saveLoginAccount(username, role, token) {
        let accounts = JSON.parse(localStorage.getItem('accounts') || '[]');
        // Remove any existing account with same username/role
        accounts = accounts.filter(acc => acc.username !== username || acc.role !== role);
        accounts.push({ username, role, token });
        localStorage.setItem('accounts', JSON.stringify(accounts));
    }
    
    // --- 3. After job application, refresh my applications if on that page ---
    function refreshMyApplicationsIfOnPage() {
        if (window.location.pathname.endsWith('my-applications.html')) {
            if (window.applicationsContent) {
                (async () => {
                    const authToken = localStorage.getItem('authToken');
                    if (!authToken) {
                        window.applicationsContent.innerHTML = '<div class="error-message">You must be logged in to view your applications.</div>';
                        return;
                    }
                    try {
                        // Fetch user profile to get appliedJobs
                        const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${authToken}` } });
                        if (!res.ok) throw new Error('Failed to load user profile');
                        const user = await res.json();
                        const appliedJobs = user.appliedJobs || [];
                        if (appliedJobs.length === 0) {
                            window.applicationsContent.innerHTML = '<div>No applications found.</div>';
                            return;
                        }
                        // Fetch job details for each applied job
                        const jobDetails = await Promise.all(
                            appliedJobs.map(async jobId => {
                                const jobRes = await fetch(`/api/jobs/${jobId}`);
                                if (!jobRes.ok) return null;
                                return await jobRes.json();
                            })
                        );
                        window.applicationsContent.innerHTML = jobDetails.filter(j => j).length ?
                            jobDetails.filter(j => j).map(job => `<div><b>${job.title}</b> - <span>${job.company}</span></div>`).join('') :
                            '<div>No applications found.</div>';
                    } catch (e) {
                        window.applicationsContent.innerHTML = `<div class='error-message'>Could not load applications.<br>${e.message ? e.message : ''}</div>`;
                    }
                })();
            }
        }
    }

    // Check if user is an applicant and fetch jobs on load
    fetchJobs();

    // --- Add/updateAuthenticationUI for login/logout UI feedback ---
    function updateAuthenticationUI(isLoggedIn) {
        console.log('Updating authentication UI, isLoggedIn:', isLoggedIn);
        
        // Login/Register buttons (shown when logged out)
        const loginBtn = document.getElementById('login-button');
        const registerBtn = document.getElementById('register-button');
        const recruiterLoginBtn = document.getElementById('recruiter-login-button');
        const recruiterRegisterBtn = document.getElementById('recruiter-register-button');
        
        // Profile/Logout buttons (shown when logged in)
        const profileBtn = document.getElementById('profile-button');
        const logoutBtn = document.getElementById('logout-button');
        
        // Get user role from localStorage or currentUser
        let userRole = null;
        let userData = null;
        try {
            userData = JSON.parse(localStorage.getItem('currentUser'));
        } catch (e) {}
        if (!userData && typeof currentUser === 'object' && currentUser.role) {
            userRole = currentUser.role;
        } else if (userData && userData.role) {
            userRole = userData.role;
        }
        // Set profile button href based on role
        if (profileBtn) {
            if (userRole === 'recruiter') {
                profileBtn.href = 'recruiter-profile.html';
                profileBtn.textContent = 'Recruiter Profile';
            } else {
                profileBtn.href = 'applicant-profile.html';
                profileBtn.textContent = 'My Profile';
            }
        }
        // --- Profile horizontal menu injection ---
        const profileMenuContainer = document.getElementById('profile-menu-container');
        if (isLoggedIn && profileMenuContainer) {
            let menuHtml = `<nav class='profile-nav-menu'>
                <a href='index.html'>🏠 Home</a>
                <a href='${userRole === 'recruiter' ? 'recruiter-profile.html' : 'applicant-profile.html'}'>👤 Profile</a>
                ${userRole === 'applicant' ? "<a href='my-applications.html'>📄 My Applications</a>" : ''}
                ${userRole === 'recruiter' ? "<a href='post-job.html'>📢 Post Job</a>" : ''}
                <a href='#' id='profile-nav-logout'>🚪 Logout</a>
            </nav>`;
            profileMenuContainer.innerHTML = menuHtml;
            // Logout handler
            document.getElementById('profile-nav-logout').onclick = function(e) {
                e.preventDefault();
                localStorage.removeItem('authToken');
                localStorage.removeItem('currentUser');
                updateAuthenticationUI(false);
                window.location.href = 'index.html';
            };
        } else if (profileMenuContainer) {
            profileMenuContainer.innerHTML = '';
        }
        // Show/hide based on login state
        if (isLoggedIn) {
            // Hide login/register buttons
            [loginBtn, registerBtn, recruiterLoginBtn, recruiterRegisterBtn].forEach(btn => {
                if (btn) {
                    btn.style.display = 'none';
                    console.log(`Hidden button: ${btn.id}`);
                }
            });
            
            // Show profile/logout buttons
            [profileBtn, logoutBtn].forEach(btn => {
                if (btn) {
                    btn.style.display = '';
                    console.log(`Shown button: ${btn.id}`);
                }
            });
            
            console.log('UI updated for logged-in state');
        } else {
            // Show login/register buttons
            [loginBtn, registerBtn, recruiterLoginBtn, recruiterRegisterBtn].forEach(btn => {
                if (btn) {
                    btn.style.display = '';
                    console.log(`Shown button: ${btn.id}`);
                }
            });
            
            // Hide profile/logout buttons
            [profileBtn, logoutBtn].forEach(btn => {
                if (btn) {
                    btn.style.display = 'none';
                    console.log(`Hidden button: ${btn.id}`);
                }
            });
            
            console.log('UI updated for logged-out state');
        }
    }

    // --- Authentication UI update logic ---
    function updateAuthUI() {
        const authToken = localStorage.getItem('authToken');
        const loginBtn = document.getElementById('login-button');
        const registerBtn = document.getElementById('register-button');
        const profileBtn = document.getElementById('profile-button');
        const myAppsBtn = document.getElementById('my-applications-button');
        const logoutBtn = document.getElementById('logout-button');
        if (authToken) {
            if (loginBtn) loginBtn.style.display = 'none';
            if (registerBtn) registerBtn.style.display = 'none';
            if (profileBtn) profileBtn.style.display = '';
            if (myAppsBtn) myAppsBtn.style.display = '';
            if (logoutBtn) logoutBtn.style.display = '';
        } else {
            if (loginBtn) loginBtn.style.display = '';
            if (registerBtn) registerBtn.style.display = '';
            if (profileBtn) profileBtn.style.display = 'none';
            if (myAppsBtn) myAppsBtn.style.display = 'none';
            if (logoutBtn) logoutBtn.style.display = 'none';
        }
    }
    // Add My Applications and Profile buttons if not present
    const authButtons = document.querySelector('.auth-buttons');
    if (authButtons && !document.getElementById('profile-button')) {
        const profileBtn = document.createElement('a');
        profileBtn.href = 'applicant-profile.html';
        profileBtn.className = 'btn';
        profileBtn.id = 'profile-button';
        profileBtn.textContent = 'My Profile';
        profileBtn.style.display = 'none';
        authButtons.appendChild(profileBtn);
        const myAppsBtn = document.createElement('a');
        myAppsBtn.href = 'my-applications.html';
        myAppsBtn.className = 'btn';
        myAppsBtn.id = 'my-applications-button';
        myAppsBtn.textContent = 'My Applications';
        myAppsBtn.style.display = 'none';
        authButtons.appendChild(myAppsBtn);
        const logoutBtn = document.createElement('button');
        logoutBtn.className = 'btn secondary';
        logoutBtn.id = 'logout-button';
        logoutBtn.textContent = 'Logout';
        logoutBtn.style.display = 'none';
        logoutBtn.onclick = () => {
            localStorage.removeItem('authToken');
            updateAuthUI();
            window.location.href = 'index.html';
        };
        authButtons.appendChild(logoutBtn);
    }
    updateAuthUI();
    // Optionally, update UI on storage event (multi-tab)
    window.addEventListener('storage', updateAuthUI);
    
    // --- Minimal CSS for dropdown (optional, can be moved to styles.css) ---
    const style = document.createElement('style');
    style.innerHTML = `
    .profile-nav-menu { display: flex; gap: 1.2rem; align-items: center; margin-left: 1.5rem; }
    .profile-nav-menu a { color: #333; text-decoration: none; font-weight: 500; font-size: 1.08em; padding: 6px 12px; border-radius: 4px; transition: background 0.15s; }
    .profile-nav-menu a:hover { background: #f0f0f0; }
    @media (max-width: 600px) {
      .profile-nav-menu { gap: 0.5rem; font-size: 0.98em; }
      .profile-nav-menu a { padding: 4px 6px; }
    }
    `;
    document.head.appendChild(style);
    
    // Setup search functionality
    if (jobSearchInput && jobSearchButton) {
        jobSearchButton.addEventListener('click', () => {
            const query = jobSearchInput.value.trim();
            if (query) {
                searchJobs(query);
            }
        });
        
        jobSearchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                const query = jobSearchInput.value.trim();
                if (query) {
                    searchJobs(query);
                }
            }
        });
        
        // Setup popular search tags
        if (searchTags) {
            searchTags.forEach(tag => {
                tag.addEventListener('click', (e) => {
                    e.preventDefault();
                    const query = tag.getAttribute('data-tag');
                    jobSearchInput.value = query;
                    searchJobs(query);
                });
            });
        }
    }
    
    // Function to search for jobs
    async function searchJobs(query) {
        if (searchResults && searchResultsContent) {
            // Display loading state
            searchResults.style.display = 'block';
            searchResultsContent.innerHTML = '<div class="loading-spinner"></div>';
            
            try {
                const response = await fetch(`/api/jobs/search?q=${encodeURIComponent(query)}`);
                if (!response.ok) {
                    throw new Error('Failed to search jobs');
                }
                
                const jobs = await response.json();
                
                // Update result count
                if (resultCount) {
                    resultCount.textContent = jobs.length;
                }
                
                if (jobs.length === 0) {
                    searchResultsContent.innerHTML = `
                        <div class="no-results">
                            <p>No jobs found matching "${query}".</p>
                            <p>Try another search or browse our featured jobs below.</p>
                        </div>
                    `;
                    return;
                }
                
                // Display search results
                let html = '';
                jobs.forEach(job => {
                    const postedDate = new Date(job.postedAt);
                    const timeAgo = getTimeAgo(postedDate);
                    
                    html += `
                        <div class="job-card">
                            <div class="job-header">
                                <h3 class="job-title">${job.title}</h3>
                                <span class="job-company">${job.company}</span>
                            </div>
                            <div class="job-details">
                                <span class="job-location"><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                                <span class="job-type"><i class="fas fa-briefcase"></i> ${job.type}</span>
                                <span class="job-salary">
                                    ${job.salary.min && job.salary.max ? 
                                      `<i class="fas fa-dollar-sign"></i> ${job.salary.min.toLocaleString()} - ${job.salary.max.toLocaleString()} ${job.salary.currency}/
                                      ${job.salary.period === 'monthly' ? 'month' : job.salary.period}` : 
                                      ''}
                                </span>
                            </div>
                            <div class="job-description">
                                ${job.description.substring(0, 150)}...
                            </div>
                            <div class="job-footer">
                                <span class="job-date">${timeAgo}</span>
                                <a href="javascript:void(0)" class="btn view-job" data-job-id="${job._id}">View Job</a>
                            </div>
                        </div>
                    `;
                });
                
                searchResultsContent.innerHTML = html;
                
                // Add event listeners to the view job buttons
                const viewJobButtons = document.querySelectorAll('.view-job');
                viewJobButtons.forEach(button => {
                    button.addEventListener('click', () => {
                        const jobId = button.getAttribute('data-job-id');
                        window.location.href = `index.html?job=${jobId}#job-details`;
                    });
                });
                
                // Scroll to search results
                searchResults.scrollIntoView({ behavior: 'smooth' });
                
            } catch (error) {
                console.error('Error searching jobs:', error);
                searchResultsContent.innerHTML = `
                    <div class="error-message">
                        Failed to search jobs. Please try again later.
                    </div>
                `;
            }
        }
    }
    
    // Check if there's a search query in URL parameters
    const urlParams = new URLSearchParams(window.location.search);
    const urlSearchQuery = urlParams.get('search');
    if (urlSearchQuery && jobSearchInput) {
        jobSearchInput.value = urlSearchQuery;
        searchJobs(urlSearchQuery);
    }

    // JobsDB-style search form
    const searchForm = document.getElementById('search-form');
    const searchInput = document.getElementById('search-input');
    const jobListings = document.querySelector('.job-listings-jobsdb');
    const quickLinks = document.querySelectorAll('.quick-link');

    function renderJobs(jobs) {
        if (!jobListings) return;
        let html = jobs.length ? jobs.map(job => `
            <div class="job-card-jobsdb">
                <div class="job-title-jobsdb">${job.title}</div>
                <div class="job-meta-jobsdb">${job.company} &middot; ${job.location} &middot; ${job.type || ''}</div>
                <div class="job-desc-jobsdb">${job.description ? job.description.substring(0, 120) + (job.description.length > 120 ? '...' : '') : ''}</div>
                <div class="job-footer-jobsdb">
                    <span>Posted: ${job.postedAt ? new Date(job.postedAt).toLocaleDateString() : ''}</span>
                    <button class="view-job-btn" onclick="window.location='login.html?role=applicant'">View</button>
                </div>
            </div>
        `).join('') : '<div style="padding:2rem;text-align:center;color:#888;">No jobs found.</div>';
        jobListings.innerHTML = html;
    }

    function doSearch(query) {
        if (!jobListings) return;
        if (query && query.trim() !== '') {
            fetch(`/api/jobs/search?q=${encodeURIComponent(query)}`)
                .then(res => res.json())
                .then(jobs => renderJobs(Array.isArray(jobs) ? jobs : []))
                .catch(() => renderJobs([]));
        } else {
            fetch('/api/jobs')
                .then(res => res.json())
                .then(data => {
                    // If paginated, use data.jobs
                    renderJobs(Array.isArray(data.jobs) ? data.jobs : (Array.isArray(data) ? data : []));
                })
                .catch(() => renderJobs([]));
        }
    }

    // Initial load
    doSearch('');

    if (searchForm && searchInput) {
        searchForm.addEventListener('submit', e => {
            e.preventDefault();
            doSearch(searchInput.value.trim());
        });
    }
    if (quickLinks) {
        quickLinks.forEach(link => {
            link.addEventListener('click', e => {
                e.preventDefault();
                doSearch(link.textContent.trim());
                if (searchInput) searchInput.value = link.textContent.trim();
            });
        });
    }
});
