// recruiter-profile.js
// Loads recruiter profile and company info

document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'login.html?role=recruiter';
        return;
    }
    // Fetch and display recruiter profile
    const profileContent = document.getElementById('profile-content');
    const postedJobsContent = document.getElementById('posted-jobs-content');
    const applicantsSection = document.getElementById('applicants-section');
    const applicantsContent = document.getElementById('applicants-content');
    const jobApplicantsTitle = document.getElementById('job-applicants-title');
    const backToJobsBtn = document.getElementById('back-to-jobs');
    
    profileContent.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!res.ok) throw new Error('Failed to load profile');
        const user = await res.json();
        let html = `<h3>${user.profile.name}</h3>`;
        html += `<div><b>Email:</b> ${user.profile.email}</div>`;
        if (user.profile.phone) html += `<div><b>Phone:</b> ${user.profile.phone}</div>`;
        if (user.profile.nationality) html += `<div><b>Nationality:</b> ${user.profile.nationality}</div>`;
        if (user.profile.currentLocation) html += `<div><b>Location:</b> ${user.profile.currentLocation}</div>`;
        if (user.profile.skills && user.profile.skills.length > 0) html += `<div><b>Skills:</b> ${user.profile.skills.join(', ')}</div>`;
        profileContent.innerHTML = html;
        
        // Load posted jobs
        loadPostedJobs(authToken);
    } catch (e) {
        profileContent.innerHTML = '<div class="error-message">Could not load profile.</div>';
    }
    
    // Handle back button click
    if (backToJobsBtn) {
        backToJobsBtn.addEventListener('click', () => {
            postedJobsContent.style.display = 'block';
            applicantsSection.style.display = 'none';
        });
    }
});

// Function to load recruiter's posted jobs
async function loadPostedJobs(authToken) {
    const postedJobsContent = document.getElementById('posted-jobs-content');
    postedJobsContent.innerHTML = '<div class="loading-spinner"></div>';
    
    try {
        const res = await fetch('/api/jobs/my', { 
            headers: { 'Authorization': `Bearer ${authToken}` } 
        });
        
        if (!res.ok) throw new Error('Failed to load posted jobs');
        const jobs = await res.json();
        
        if (jobs.length === 0) {
            postedJobsContent.innerHTML = `
                <div class="info-message">
                    You haven't posted any jobs yet. 
                    <a href="post-job.html" class="btn">Post a Job</a>
                </div>`;
            return;
        }
        
        let html = `
            <div class="section-header">
                <h3>My Job Postings</h3>
                <a href="post-job.html" class="btn">Post New Job</a>
            </div>
            <div class="jobs-table-container">
                <table class="jobs-table">
                    <thead>
                        <tr>
                            <th>Title</th>
                            <th>Posted On</th>
                            <th>Applicants</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        jobs.forEach(job => {
            const date = new Date(job.postedAt).toLocaleDateString();
            const applicantsCount = job.applicants ? job.applicants.length : 0;
            const isExpired = job.expiryDate && new Date(job.expiryDate) < new Date();
            const status = isExpired ? 'Expired' : 'Active';
            const statusClass = isExpired ? 'status-expired' : 'status-active';
            
            html += `
                <tr>
                    <td>${job.title}</td>
                    <td>${date}</td>
                    <td>${applicantsCount}</td>
                    <td><span class="status-pill ${statusClass}">${status}</span></td>
                    <td>
                        <button class="btn small view-applicants-btn" data-job-id="${job._id}"
                            ${applicantsCount === 0 ? 'disabled' : ''}>
                            View Applicants
                        </button>
                        <button class="btn small edit-job-btn" data-job-id="${job._id}">Edit</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        postedJobsContent.innerHTML = html;
        
        // Add event listeners to view applicants buttons
        const viewApplicantsButtons = document.querySelectorAll('.view-applicants-btn');
        viewApplicantsButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const jobId = button.getAttribute('data-job-id');
                loadJobApplicants(authToken, jobId);
            });
        });
        
        // Add event listeners to edit job buttons
        const editJobButtons = document.querySelectorAll('.edit-job-btn');
        editJobButtons.forEach(button => {
            button.addEventListener('click', () => {
                const jobId = button.getAttribute('data-job-id');
                window.location.href = `post-job.html?edit=${jobId}`;
            });
        });
    } catch (e) {
        postedJobsContent.innerHTML = '<div class="error-message">Could not load posted jobs.</div>';
    }
}

// Function to load applicants for a specific job
async function loadJobApplicants(authToken, jobId) {
    const postedJobsContent = document.getElementById('posted-jobs-content');
    const applicantsSection = document.getElementById('applicants-section');
    const applicantsContent = document.getElementById('applicants-content');
    const jobApplicantsTitle = document.getElementById('job-applicants-title');
    
    if (!applicantsSection) {
        console.error('Applicants section not found in DOM');
        return;
    }
    
    applicantsContent.innerHTML = '<div class="loading-spinner"></div>';
    postedJobsContent.style.display = 'none';
    applicantsSection.style.display = 'block';
    
    try {
        // First fetch the job to get the title
        const jobRes = await fetch(`/api/jobs/${jobId}`, { 
            headers: { 'Authorization': `Bearer ${authToken}` } 
        });
        
        if (!jobRes.ok) throw new Error('Failed to load job details');
        const job = await jobRes.ok ? await jobRes.json() : { title: 'Job' };
        
        jobApplicantsTitle.textContent = `Applicants for "${job.title}"`;
        
        // Then fetch the applicants
        const res = await fetch(`/api/jobs/${jobId}/applicants`, { 
            headers: { 'Authorization': `Bearer ${authToken}` } 
        });
        
        if (!res.ok) throw new Error('Failed to load applicants');
        const applicants = await res.json();
        
        if (applicants.length === 0) {
            applicantsContent.innerHTML = '<div class="info-message">No applicants for this job yet.</div>';
            return;
        }
        
        let html = `
            <div class="applicants-list">
        `;
        
        // Create a card for each applicant
        for (const applicant of applicants) {
            // Get full user profile for each applicant
            const userRes = await fetch(`/api/users/${applicant.userId}`, { 
                headers: { 'Authorization': `Bearer ${authToken}` } 
            });
            
            if (!userRes.ok) {
                console.error(`Failed to load applicant ${applicant.userId}`);
                continue;
            }
            
            const user = await userRes.json();
            const appliedDate = new Date(applicant.appliedAt).toLocaleDateString();
            
            html += `
                <div class="applicant-card">
                    <div class="applicant-header">
                        <div class="applicant-photo">
                            ${user.profile.photo ? 
                                `<img src="${user.profile.photo}" alt="${user.profile.name}">` : 
                                `<div class="photo-placeholder">${user.profile.name.charAt(0)}</div>`}
                        </div>
                        <div class="applicant-info">
                            <h4>${user.profile.name}</h4>
                            <p>${user.profile.email}</p>
                            <p>Applied: ${appliedDate}</p>
                        </div>
                        <div class="applicant-status">
                            <select class="status-select" data-applicant-id="${applicant.userId}" data-job-id="${jobId}">
                                <option value="Applied" ${applicant.status === 'Applied' ? 'selected' : ''}>Applied</option>
                                <option value="Under Review" ${applicant.status === 'Under Review' ? 'selected' : ''}>Under Review</option>
                                <option value="Shortlisted" ${applicant.status === 'Shortlisted' ? 'selected' : ''}>Shortlisted</option>
                                <option value="Rejected" ${applicant.status === 'Rejected' ? 'selected' : ''}>Rejected</option>
                                <option value="Offered" ${applicant.status === 'Offered' ? 'selected' : ''}>Offered</option>
                            </select>
                        </div>
                    </div>
                    <div class="applicant-details">
                        <div class="detail-section">
                            <h5>Experience</h5>
                            ${user.profile.workExperience && user.profile.workExperience.length > 0 ?
                                `<ul>${user.profile.workExperience.map(w => 
                                    `<li>${w.title} at ${w.company} (${w.startDate ? new Date(w.startDate).getFullYear() : ''} - 
                                     ${w.endDate ? new Date(w.endDate).getFullYear() : 'Present'})</li>`
                                ).join('')}</ul>` :
                                `<p>No experience listed</p>`
                            }
                        </div>
                        <div class="detail-section">
                            <h5>Education</h5>
                            ${user.profile.education && user.profile.education.length > 0 ?
                                `<ul>${user.profile.education.map(e => 
                                    `<li>${e.degree} in ${e.field}, ${e.institution}</li>`
                                ).join('')}</ul>` :
                                `<p>No education listed</p>`
                            }
                        </div>
                        <div class="detail-section">
                            <h5>Skills</h5>
                            ${user.profile.skills && user.profile.skills.length > 0 ?
                                `<p>${user.profile.skills.join(', ')}</p>` :
                                `<p>No skills listed</p>`
                            }
                        </div>
                        ${user.profile.resume ?
                            `<div class="detail-section">
                                <a href="${user.profile.resume}" target="_blank" class="btn small">View Resume</a>
                            </div>` : ''
                        }
                    </div>
                </div>
            `;
        }
        
        html += `</div>`;
        applicantsContent.innerHTML = html;
        
        // Add event listeners to status selects
        const statusSelects = document.querySelectorAll('.status-select');
        statusSelects.forEach(select => {
            select.addEventListener('change', async () => {
                const applicantId = select.getAttribute('data-applicant-id');
                const jobId = select.getAttribute('data-job-id');
                const status = select.value;
                  try {
                    // Find the application ID first
                    const appRes = await fetch(`/api/applications/query?applicantId=${applicantId}&jobId=${jobId}`, {
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    
                    if (!appRes.ok) throw new Error('Failed to find application');
                    const applications = await appRes.json();
                    
                    if (applications.length === 0) throw new Error('Application not found');
                    const applicationId = applications[0]._id;
                    
                    // Update the application status
                    const updateRes = await fetch(`/api/applications/${applicationId}/status`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${authToken}` 
                        },
                        body: JSON.stringify({ status })
                    });
                    
                    if (!updateRes.ok) throw new Error('Failed to update status');
                    
                    // Show success notification
                    const notification = document.createElement('div');
                    notification.className = 'notification success';
                    notification.textContent = 'Applicant status updated';
                    document.body.appendChild(notification);
                    
                    setTimeout(() => {
                        document.body.removeChild(notification);
                    }, 3000);
                } catch (e) {
                    console.error(e);
                    alert('Failed to update applicant status: ' + e.message);
                }
            });
        });
    } catch (e) {
        applicantsContent.innerHTML = `<div class="error-message">Could not load applicants: ${e.message}</div>`;
    }
}
