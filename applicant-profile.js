// applicant-profile.js
// Loads applicant profile with a modern, jobsdb.com-inspired UI

document.addEventListener('DOMContentLoaded', async () => {
    const authToken = localStorage.getItem('authToken');
    if (!authToken) {
        window.location.href = 'login.html?role=applicant';
        return;
    }
    const profileContent = document.getElementById('profile-content');
    profileContent.innerHTML = '<div class="loading-spinner"></div>';
    try {
        const res = await fetch('/api/profile', { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!res.ok) throw new Error('Failed to load profile');
        const user = await res.json();
        let html = `
        <div class="profile-card-modern">
            <div class="profile-header-modern">
                <div class="profile-photo-modern">
                    <i class="fas fa-user-circle"></i>
                </div>
                <div class="profile-main-info">
                    <h2>${user.profile.name}</h2>
                    <div class="profile-email"><i class="fas fa-envelope"></i> ${user.profile.email}</div>
                    ${user.profile.phone ? `<div class="profile-phone"><i class="fas fa-phone"></i> ${user.profile.phone}</div>` : ''}
                </div>
            </div>
            <div class="profile-section-modern">
                <h3><i class="fas fa-id-card"></i> Personal Details</h3>
                <ul class="profile-list">
                    ${user.profile.nationality ? `<li><b>Nationality:</b> ${user.profile.nationality}</li>` : ''}
                    ${user.profile.currentLocation ? `<li><b>Location:</b> ${user.profile.currentLocation}</li>` : ''}
                </ul>
            </div>
            <div class="profile-section-modern">
                <h3><i class="fas fa-cogs"></i> Skills</h3>
                <ul class="profile-list">
                    ${(user.profile.skills && user.profile.skills.length > 0) ? user.profile.skills.map(skill => `<li>${skill}</li>`).join('') : '<li>No skills listed</li>'}
                </ul>
            </div>
            <div class="profile-section-modern">
                <h3><i class="fas fa-language"></i> Languages</h3>
                <ul class="profile-list">
                    ${(user.profile.languages && user.profile.languages.length > 0) ? user.profile.languages.map(l => `<li>${l.language} <span class="lang-level">(${l.proficiency})</span></li>`).join('') : '<li>No languages listed</li>'}
                </ul>
            </div>
            <div class="profile-section-modern">
                <h3><i class="fas fa-briefcase"></i> Work Experience</h3>
                <ul class="profile-list">
                    ${(user.profile.workExperience && user.profile.workExperience.length > 0) ? user.profile.workExperience.map(w => `<li><b>${w.title}</b> at ${w.company} <span class="date-range">(${w.startDate ? new Date(w.startDate).getFullYear() : ''} - ${w.endDate ? new Date(w.endDate).getFullYear() : 'Present'})</span></li>`).join('') : '<li>No work experience listed</li>'}
                </ul>
            </div>
            <div class="profile-section-modern">
                <h3><i class="fas fa-graduation-cap"></i> Education</h3>
                <ul class="profile-list">
                    ${(user.profile.education && user.profile.education.length > 0) ? user.profile.education.map(e => `<li><b>${e.degree}</b> in ${e.field} at ${e.institution} <span class="date-range">(${e.startDate ? new Date(e.startDate).getFullYear() : ''} - ${e.endDate ? new Date(e.endDate).getFullYear() : 'Present'})</span></li>`).join('') : '<li>No education listed</li>'}
                </ul>
            </div>
            ${user.profile.resume ? `<div class="profile-section-modern"><a href="${user.profile.resume}" target="_blank" class="resume-link"><i class="fas fa-file-alt"></i> View Resume</a></div>` : ''}
        </div>
        `;
        profileContent.innerHTML = html;
    } catch (e) {
        profileContent.innerHTML = '<div class="error-message">Could not load profile.</div>';
    }
    // Logout
    document.getElementById('logout-button').onclick = () => {
        localStorage.removeItem('authToken');
        window.location.href = 'login.html?role=applicant';
    };
});
