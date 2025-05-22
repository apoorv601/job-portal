// my-applications.js
// Loads applicant's job applications

document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'login.html?role=applicant';
        return;
    }
    const applicationsContent = document.getElementById('applications-content');
    applicationsContent.innerHTML = '<div class="loading-spinner"></div>';
    
    const isProd = window.location.hostname === 'adage.host';
    const API_BASE = isProd
      ? 'https://adage.host/Job_for_Expats/api'
      : '/api';
    console.log('Using API base path:', API_BASE);
    
    try {
        // Fetch applications directly from the applications API
        const res = await fetch(`${API_BASE}/applications/my`, { 
            headers: { 'Authorization': `Bearer ${authToken}` } 
        });
        
        if (!res.ok) throw new Error('Failed to load applications');
        const applications = await res.json();
        
        if (applications.length === 0) {
            applicationsContent.innerHTML = '<div class="info-message">You haven\'t applied for any jobs yet.</div>';
            return;
        }
        
        let html = `
            <h2>My Job Applications</h2>
            <div class="applications-list">
                <table class="applications-table">
                    <thead>
                        <tr>
                            <th>Job Title</th>
                            <th>Applied On</th>
                            <th>Status</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
        `;
        
        applications.forEach(app => {
            const date = new Date(app.createdAt).toLocaleDateString();
            let statusClass = '';
            
            switch(app.status) {
                case 'Submitted':
                    statusClass = 'status-submitted';
                    break;
                case 'Under Review':
                    statusClass = 'status-review';
                    break;
                case 'Shortlisted':
                    statusClass = 'status-shortlisted';
                    break;
                case 'Rejected':
                    statusClass = 'status-rejected';
                    break;
                case 'Offered':
                    statusClass = 'status-offered';
                    break;
            }
            
            html += `
                <tr>
                    <td>${app.jobTitle}</td>
                    <td>${date}</td>
                    <td><span class="status-pill ${statusClass}">${app.status}</span></td>
                    <td>
                        <button class="btn small view-job-btn" data-job-id="${app.jobId}">View Job</button>
                    </td>
                </tr>
            `;
        });
        
        html += `
                    </tbody>
                </table>
            </div>
        `;
        
        applicationsContent.innerHTML = html;
        
        // Add event listeners to view job buttons
        const viewJobButtons = document.querySelectorAll('.view-job-btn');
        viewJobButtons.forEach(button => {
            button.addEventListener('click', async () => {
                const jobId = button.getAttribute('data-job-id');
                try {
                    const res = await fetch(`/api/jobs/${jobId}`);
                    if (!res.ok) throw new Error('Failed to load job details');
                    const job = await res.json();
                    
                    // Navigate to job details
                    window.location.href = `index.html?job=${jobId}#job-details`;
                } catch (e) {
                    alert('Could not load job details: ' + e.message);
                }
            });
        });
    } catch (e) {
        applicationsContent.innerHTML = '<div class="error-message">Could not load applications.</div>';
    }
    // Logout
    document.getElementById('logout-button').onclick = () => {
        localStorage.removeItem('authToken');
        window.location.href = 'login.html?role=applicant';
    };
});
