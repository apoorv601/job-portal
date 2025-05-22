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
    const isProd = window.location.hostname === 'adage.host';
    const API_BASE = isProd
      ? 'https://adage.host/Job_for_Expats/api'
      : '/api';
    console.log('Using API base path:', API_BASE);
    try {
        const res = await fetch(`${API_BASE}/profile`, { headers: { 'Authorization': `Bearer ${authToken}` } });
        if (!res.ok) throw new Error('Failed to load profile');
        const user = await res.json();
        const p = user.profile;
        let html = `
        <div class="profile-card-modern-ui">
            <div class="profile-header-modern">
                <div class="profile-photo-modern">
                    ${p.photo ? `<img src="${p.photo}" alt="${p.name}" />` : `<div class="photo-placeholder-modern">${p.name ? p.name.charAt(0) : '?'}</div>`}
                </div>
                <div class="profile-main-info">
                    <h2>${p.name || user.username}</h2>
                    <div class="profile-meta-modern">
                        <span><i class="fas fa-envelope"></i> ${p.email || '-'}</span>
                        <span><i class="fas fa-phone"></i> ${p.phone || '-'}</span>
                        <span><i class="fas fa-flag"></i> ${p.nationality || '-'}</span>
                        <span><i class="fas fa-map-marker-alt"></i> ${p.currentLocation || '-'}</span>
                    </div>
                </div>
            </div>
            <div class="profile-sections-modern">
                <div class="profile-section-block">
                    <h3><i class="fas fa-cogs"></i> Skills</h3>
                    <ul class="profile-list">
                        ${(p.skills && p.skills.length > 0) ? p.skills.map(skill => `<li>${skill}</li>`).join('') : '<li>No skills listed</li>'}
                    </ul>
                </div>
                <div class="profile-section-block">
                    <h3><i class="fas fa-language"></i> Languages</h3>
                    <ul class="profile-list">
                        ${(p.languages && p.languages.length > 0) ? p.languages.map(l => `<li>${l.language} <span class="lang-level">(${l.proficiency})</span></li>`).join('') : '<li>No languages listed</li>'}
                    </ul>
                </div>
                <div class="profile-section-block">
                    <h3><i class="fas fa-briefcase"></i> Work Experience</h3>
                    <ul class="profile-list">
                        ${(p.workExperience && p.workExperience.length > 0) ? p.workExperience.map(w => `<li>${w.title} at ${w.company} (${w.startDate ? new Date(w.startDate).getFullYear() : ''} - ${w.endDate ? new Date(w.endDate).getFullYear() : 'Present'})</li>`).join('') : '<li>No experience listed</li>'}
                    </ul>
                </div>
                <div class="profile-section-block">
                    <h3><i class="fas fa-graduation-cap"></i> Education</h3>
                    <ul class="profile-list">
                        ${(p.education && p.education.length > 0) ? p.education.map(e => `<li>${e.degree} in ${e.field}, ${e.institution}</li>`).join('') : '<li>No education listed</li>'}
                    </ul>
                </div>
                ${p.resume ? `<div class="profile-section-block"><a href="${p.resume}" target="_blank" class="btn">View Resume</a></div>` : ''}
            </div>
        </div>
        `;
        profileContent.innerHTML = html;

        // Add Edit Profile button (move inside try block so 'user' is defined)
        const editBtn = document.createElement('button');
        editBtn.textContent = 'Edit Profile';
        editBtn.className = 'btn edit-profile-btn';
        editBtn.onclick = () => showEditProfileModal(user.profile);
        profileContent.prepend(editBtn);

        // Modal for editing profile
        function showEditProfileModal(profile) {
            let modal = document.getElementById('edit-profile-modal');
            if (!modal) {
                modal = document.createElement('div');
                modal.id = 'edit-profile-modal';
                modal.style.position = 'fixed';
                modal.style.top = '0';
                modal.style.left = '0';
                modal.style.width = '100vw';
                modal.style.height = '100vh';
                modal.style.background = 'rgba(0,0,0,0.3)';
                modal.style.display = 'flex';
                modal.style.alignItems = 'center';
                modal.style.justifyContent = 'center';
                modal.innerHTML = `
                    <div style="background:#fff;padding:2rem;border-radius:8px;min-width:320px;max-width:90vw;">
                        <h2>Edit Profile</h2>
                        <form id="edit-profile-form">
                            <label>Name:<input type="text" name="name" value="${profile.name||''}" required></label><br><br>
                            <label>Email:<input type="email" name="email" value="${profile.email||''}" required></label><br><br>
                            <label>Phone:<input type="text" name="phone" value="${profile.phone||''}"></label><br><br>
                            <label>Nationality:<input type="text" name="nationality" value="${profile.nationality||''}"></label><br><br>
                            <label>Location:<input type="text" name="currentLocation" value="${profile.currentLocation||''}"></label><br><br>
                            <button type="submit" class="btn">Save</button>
                            <button type="button" class="btn secondary" id="cancel-edit-profile">Cancel</button>
                        </form>
                    </div>
                `;
                document.body.appendChild(modal);
            }
            modal.style.display = 'flex';
            document.getElementById('cancel-edit-profile').onclick = () => { modal.style.display = 'none'; };
            document.getElementById('edit-profile-form').onsubmit = async function(e) {
                e.preventDefault();
                const formData = new FormData(this);
                const updatedProfile = {};
                for (let [k, v] of formData.entries()) updatedProfile[k] = v;
                const authToken = localStorage.getItem('authToken');
                const res = await fetch('/api/profile', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                    body: JSON.stringify({ profile: updatedProfile })
                });
                if (res.ok) {
                    modal.style.display = 'none';
                    location.reload();
                } else {
                    alert('Failed to update profile');
                }
            };
        }
    } catch (e) {
        profileContent.innerHTML = '<div class="error-message">Could not load profile.</div>';
    }
    // Logout
    document.getElementById('logout-button').onclick = () => {
        localStorage.removeItem('authToken');
        window.location.href = 'login.html?role=applicant';
    };
});
