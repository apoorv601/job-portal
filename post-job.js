// post-job.js
// Handles posting a new job for recruiters

document.addEventListener('DOMContentLoaded', () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'login.html?role=recruiter';
        return;
    }
    const isProd = window.location.hostname === 'adage.host';
    const API_BASE = isProd
      ? 'https://adage.host/Job_for_Expats/api'
      : '/api';
    console.log('Using API base path:', API_BASE);
    // Load job form (assume markup is present in post-job.html)
    const form = document.getElementById('post-job-form');
    form.onsubmit = async function(e) {
        e.preventDefault();
        // Collect form data
        const jobData = {
            title: document.getElementById('job-title').value,
            company: document.getElementById('company-name').value,
            location: document.getElementById('job-location').value,
            type: document.getElementById('job-type').value,
            industry: document.getElementById('job-industry').value,
            description: document.getElementById('job-description').value,
            responsibilities: document.getElementById('job-responsibilities').value.split('\n').filter(item => item.trim() !== ''),
            requirements: document.getElementById('job-requirements').value.split('\n').filter(item => item.trim() !== ''),
            benefits: document.getElementById('job-benefits').value.split('\n').filter(item => item.trim() !== ''),
            suitableForExpats: document.getElementById('expat-suitable').checked,
            visaSponsorshipOffered: document.getElementById('visa-sponsored').checked,
            remoteWork: document.getElementById('remote-work').checked
        };
        // Salary
        const salaryMin = document.getElementById('salary-min').value;
        const salaryMax = document.getElementById('salary-max').value;
        const salaryPeriod = document.getElementById('salary-period').value;
        if (salaryMin) {
            jobData.salary = { min: Number(salaryMin), period: salaryPeriod };
            if (salaryMax) jobData.salary.max = Number(salaryMax);
        }
        // Languages
        const languages = [];
        if (document.querySelector('[name="language-english"]').checked) {
            languages.push({ language: 'English', proficiency: document.querySelector('[name="english-level"]').value });
        }
        if (document.querySelector('[name="language-cantonese"]').checked) {
            languages.push({ language: 'Cantonese', proficiency: document.querySelector('[name="cantonese-level"]').value });
        }
        if (document.querySelector('[name="language-mandarin"]').checked) {
            languages.push({ language: 'Mandarin', proficiency: document.querySelector('[name="mandarin-level"]').value });
        }
        if (languages.length > 0) jobData.languages = languages;
        // Validation
        if (!jobData.title || !jobData.company || !jobData.location || !jobData.type || !jobData.industry || !jobData.description) {
            alert('Please fill in all required fields.');
            return;
        }
        // Submit
        try {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = true;
            submitBtn.textContent = 'Posting...';
            const response = await fetch(`${API_BASE}/jobs`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(jobData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.message || 'Failed to post job');
            alert('Job posted successfully!');
            form.reset();
            window.location.href = 'recruiter-profile.html';
        } catch (error) {
            alert(error.message || 'Failed to post job. Please try again later.');
        } finally {
            const submitBtn = form.querySelector('button[type="submit"]');
            submitBtn.disabled = false;
            submitBtn.textContent = 'Post Job';
        }
    };
    // Logout
    document.getElementById('logout-button').onclick = () => {
        localStorage.removeItem('authToken');
        window.location.href = 'login.html?role=recruiter';
    };
});
