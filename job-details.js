// job-details.js
// Loads job details and allows applicant to apply

// --- API base path detection for local/cloud ---
const isProd = window.location.hostname === 'adage.host';
const API_BASE = isProd
  ? 'https://adage.host/Job_for_Expats/api'
  : '/api';

// Keep a debug log of the API base path used - this helps debugging
console.log('Using API base path:', API_BASE);

document.addEventListener('DOMContentLoaded', async () => {
    const urlParams = new URLSearchParams(window.location.search);
    const jobId = urlParams.get('job');
    const jobDetailsContent = document.getElementById('job-details-content');
    if (!jobId) {
        jobDetailsContent.innerHTML = '<div class="error-message">No job selected.</div>';
        return;
    }
    jobDetailsContent.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const res = await fetch(`${API_BASE}/jobs/${jobId}`);
        if (!res.ok) throw new Error('Failed to load job details');
        const job = await res.json();
        // Format salary
        let salaryDisplay = 'Not specified';
        if (job.salary && job.salary.min) {
            salaryDisplay = job.salary.min.toLocaleString();
            if (job.salary.max) {
                salaryDisplay += ` - ${job.salary.max.toLocaleString()}`;
            }
            salaryDisplay += ` ${job.salary.currency || 'HKD'}`;
            if (job.salary.period === 'monthly') {
                salaryDisplay += ' /month';
            } else if (job.salary.period === 'annual') {
                salaryDisplay += ' /year';
            }
        }
        // Format posted date
        const postedDate = job.postedAt ? new Date(job.postedAt).toLocaleDateString() : '';
        // Format requirements/responsibilities/benefits/languages
        const requirements = job.requirements && job.requirements.length ? `<ul>${job.requirements.map(r => `<li>${r}</li>`).join('')}</ul>` : '<span>Not specified</span>';
        const responsibilities = job.responsibilities && job.responsibilities.length ? `<ul>${job.responsibilities.map(r => `<li>${r}</li>`).join('')}</ul>` : '<span>Not specified</span>';
        const benefits = job.benefits && job.benefits.length ? `<ul>${job.benefits.map(b => `<li>${b}</li>`).join('')}</ul>` : '<span>Not specified</span>';
        const languages = job.languages && job.languages.length ? `<ul>${job.languages.map(l => `<li>${l.language} (${l.proficiency})</li>`).join('')}</ul>` : '<span>Not specified</span>';
        // Badges
        const expatBadge = job.suitableForExpats ? '<span class="expat-friendly-badge">Expat Friendly</span>' : '';
        const visaBadge = job.visaSponsorshipOffered ? '<span class="visa-sponsored-badge">Visa Sponsorship</span>' : '';
        jobDetailsContent.innerHTML = `
            <div class="job-details-card-modern">
                <div class="job-details-header">
                    <h2>${job.title}</h2>
                    <div class="job-badges">${expatBadge} ${visaBadge}</div>
                </div>
                <div class="job-meta">
                    <span><i class="fas fa-building"></i> ${job.company}</span>
                    <span><i class="fas fa-map-marker-alt"></i> ${job.location}</span>
                    <span><i class="fas fa-briefcase"></i> ${job.type}</span>
                    <span><i class="fas fa-calendar"></i> Posted: ${postedDate}</span>
                </div>
                <div class="job-salary"><b>Salary:</b> ${salaryDisplay}</div>
                <div class="job-section"><b>Description:</b><br>${job.description}</div>
                <div class="job-section"><b>Responsibilities:</b>${responsibilities}</div>
                <div class="job-section"><b>Requirements:</b>${requirements}</div>
                <div class="job-section"><b>Benefits:</b>${benefits}</div>
                <div class="job-section"><b>Languages:</b>${languages}</div>
                <div class="job-details-actions">
                    <button id="apply-job-btn" class="apply-button">Apply for this job</button>
                    <a href="index.html" class="btn secondary">Back to Jobs</a>
                </div>
            </div>
        `;
        document.getElementById('apply-job-btn').onclick = async function() {
            const authToken = localStorage.getItem('authToken');
            if (!authToken) {
                alert('You must be logged in to apply.');
                window.location.href = 'login.html?role=applicant';
                return;
            }
            const res = await fetch(`/api/jobs/${jobId}/apply`, {
                method: 'POST',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            if (res.ok) {
                alert('Application submitted!');
                window.location.href = 'my-applications.html';
            } else {
                const data = await res.json();
                alert(data.message || 'Failed to apply.');
            }
        };
    } catch (e) {
        jobDetailsContent.innerHTML = '<div class="error-message">Could not load job details.</div>';
    }
});
