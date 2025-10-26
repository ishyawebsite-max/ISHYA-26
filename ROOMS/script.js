// script.js

// --- CONFIGURATION ---
const GOOGLE_CLIENT_ID = '750824340469-nrqmioc1jgoe6rjnuaqjdu9mh0b4or2o.apps.googleusercontent.com'; // <-- IMPORTANT: Paste your Client ID here
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzyzkJemDwWdQU_JMub5Jtm5Ss5u_WL2ebp-nFQkvzUj8Q4txiHfMPIgQkQn_mPT-muWQ/exec'; // <-- IMPORTANT: Paste your Web App URL here
// --- STATE MANAGEMENT ---
let currentUser = null;
let rooms = [];
let selectedRoom = null;
let selectedDate = new Date();
let selectedSlots = [];
let currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);

// --- DOM ELEMENTS ---
const loader = document.getElementById('loader');
const roomList = document.getElementById('room-list');
const roomSelectionStep = document.getElementById('room-selection');
const scheduleSelectionStep = document.getElementById('schedule-selection');

// --- INITIALIZATION ---
window.onload = function () {
    console.log("--- Page Loaded. Starting Initialization ---");
    try {
        google.accounts.id.initialize({
            client_id: GOOGLE_CLIENT_ID,
            callback: handleCredentialResponse
        });
        google.accounts.id.renderButton(
            document.getElementById('auth-container'),
            { theme: 'outline', size: 'large' }
        );
        google.accounts.id.prompt();
        console.log("Google Sign-In initialized successfully.");
    } catch (error) {
        console.error("CRITICAL ERROR initializing Google Sign-In:", error);
        alert("Could not initialize Google Sign-In. Check the console (F12) for critical errors.");
    }

    setupEventListeners();
    fetchRooms(); // Start the main process
};

// --- AUTHENTICATION ---
function handleCredentialResponse(response) {
    const id_token = response.credential;
    const decodedToken = JSON.parse(atob(id_token.split('.')[1]));
    currentUser = { name: decodedToken.name, email: decodedToken.email, picture: decodedToken.picture };
    console.log("User signed in:", currentUser);
    updateAuthUI();
}

function updateAuthUI() {
    const authContainer = document.getElementById('auth-container');
    if (currentUser) {
        authContainer.innerHTML = `
            <div id="user-profile">
                <img src="${currentUser.picture}" alt="User profile picture">
                <span>${currentUser.name}</span>
                <button id="my-bookings-btn">My Bookings</button>
                <button id="logout-btn">Log Out</button>
            </div>
        `;
        document.getElementById('logout-btn').addEventListener('click', handleSignOut);
        document.getElementById('my-bookings-btn').addEventListener('click', openMyBookingsModal);
    } else {
        authContainer.innerHTML = '';
        google.accounts.id.renderButton(authContainer, { theme: 'outline', size: 'large' });
    }
}

function handleSignOut() {
    currentUser = null;
    google.accounts.id.disableAutoSelect();
    console.log("User signed out.");
    updateAuthUI();
}

// --- API CALLS ---
async function apiCall(action, payload = {}) {
    showLoader();
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: { 'Content-Type': 'text/plain;charset=utf-8' },
            body: JSON.stringify({ action, ...payload })
        });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API Call Error:', error);
        alert('An error occurred while communicating with the server. Please check the console (F12).');
        return null;
    } finally {
        hideLoader();
    }
}

// --- UI RENDERING & LOGIC ---
function setupEventListeners() {
    console.log("Setting up static event listeners (back button, modals, etc.).");
    document.querySelector('.back-btn').addEventListener('click', () => showStep('room-selection'));
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    document.getElementById('proceed-to-booking-btn').addEventListener('click', openBookingModal);
    document.querySelectorAll('.modal-wrapper .close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.modal-wrapper').classList.add('hidden'));
    });
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
}

// --- THE CRITICAL FUNCTION WE ARE DEBUGGING ---
async function fetchRooms() {
    console.log("1. Starting `fetchRooms` function...");
    const roomsData = await apiCall('getRooms');
    
    if (roomsData && Array.isArray(roomsData)) {
        console.log("2. Successfully received data from Google Sheet:", roomsData);

        if (roomsData.length === 0) {
            console.warn("WARNING: The API returned an empty array. Is your 'Rooms' sheet in Google Sheets empty or named incorrectly?");
            roomList.innerHTML = "<p>No services are available at this time.</p>";
            return;
        }

        rooms = roomsData;
        
        console.log("3. Generating HTML for room cards...");
        roomList.innerHTML = rooms.map(room => `
            <div class="room-card" data-room-id="${room.RoomID}">
                <img src="${room.ImageURL}" alt="${room.RoomName}">
                <div class="room-card-content">
                    <h3>${room.RoomName}</h3>
                    <p>${room.Description}</p>
                    <button class="cta-btn select-room-btn">Book Now</button>
                </div>
            </div>
        `).join('');
        console.log("4. HTML has been injected into the page.");

        const buttons = document.querySelectorAll('.select-room-btn');
        console.log(`5. Searching for 'Book Now' buttons with class '.select-room-btn'... Found: ${buttons.length}`);

        if (buttons.length > 0) {
            buttons.forEach(btn => {
                console.log("6. Attaching click listener to a button:", btn);
                btn.addEventListener('click', (e) => {
                    console.log("%c7. 'Book Now' button was CLICKED!", "color: lightgreen; font-weight: bold; font-size: 14px;");
                    const card = e.target.closest('.room-card');
                    if (card) {
                        const roomId = card.dataset.roomId;
                        console.log("8. Found parent card with roomId:", roomId);
                        handleRoomSelection(roomId);
                    } else {
                        console.error("CRITICAL ERROR: A button was clicked, but its parent with class '.room-card' could not be found.");
                    }
                });
            });
        } else {
            console.error("MAJOR ISSUE: No buttons with the class '.select-room-btn' were found after creating the cards. This means the HTML template in step #3 is likely different from the code here.");
        }

    } else {
        console.error("CRITICAL ERROR in `fetchRooms`: Failed to get valid data from the API. The response from the server was not a valid array. Response:", roomsData);
    }
}

function handleRoomSelection(roomId) {
    console.log("9. `handleRoomSelection` function called with roomId:", roomId);
    if (!currentUser) {
        alert("Please sign in with Google to book a room.");
        return;
    }
    selectedRoom = rooms.find(r => r.RoomID === roomId);
    console.log("10. Found matching room object:", selectedRoom);
    if (selectedRoom) {
        document.getElementById('schedule-title').innerText = `Schedule for ${selectedRoom.RoomName}`;
        selectedDate = new Date();
        currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        renderCalendar();
        fetchAndDisplayTimeSlots();
        showStep('schedule-selection');
        console.log("11. Switching to schedule selection view.");
    } else {
        console.error("ERROR: A room ID was passed, but no matching room was found in the 'rooms' array.", roomId);
    }
}


// --- All other functions from the original script ---
function showStep(stepId) { document.querySelectorAll('.step').forEach(step => step.classList.remove('active')); document.getElementById(stepId).classList.add('active'); window.scrollTo(0, 0); }
function changeMonth(offset) { currentMonth.setMonth(currentMonth.getMonth() + offset); renderCalendar(); }
function updateProceedButton() { const btn = document.getElementById('proceed-to-booking-btn'); btn.disabled = selectedSlots.length === 0; btn.textContent = selectedSlots.length > 0 ? `Book ${selectedSlots.length} Slot(s)` : 'Book Selected Slots'; }
function openBookingModal() { if (selectedSlots.length === 0) return; document.getElementById('user-name').value = currentUser.name; document.getElementById('user-email').value = currentUser.email; const summaryEl = document.getElementById('booking-summary'); summaryEl.innerHTML = `<p><strong>Room:</strong> ${selectedRoom.RoomName}</p><p><strong>Date:</strong> ${selectedDate.toLocaleDateString()}</p><p><strong>Time Slots:</strong> ${selectedSlots.map(s => s.time).sort().join(', ')}</p>`; document.getElementById('booking-modal').classList.remove('hidden'); }
async function handleBookingSubmit(e) { e.preventDefault(); const bookingDetails = { user: currentUser, roomName: selectedRoom.RoomName, slots: selectedSlots, participants: document.getElementById('participants').value, notes: document.getElementById('notes').value }; const result = await apiCall('makeBooking', { bookingDetails }); if (result && result.status === 'completed') { let successMessage = "Your booking request has been processed:\n"; result.results.forEach(res => { successMessage += `- ${res.time}: ${res.bookingStatus || res.message}\n`; }); alert(successMessage); document.getElementById('booking-modal').classList.add('hidden'); document.getElementById('booking-form').reset(); fetchAndDisplayTimeSlots(); } else { alert('Booking failed. Please try again.'); } }
async function openMyBookingsModal() { const modal = document.getElementById('my-bookings-modal'); const listEl = document.getElementById('user-bookings-list'); listEl.innerHTML = '<p>Loading your bookings...</p>'; modal.classList.remove('hidden'); const bookings = await apiCall('getUserBookings', { userEmail: currentUser.email }); if (bookings && bookings.length > 0) { listEl.innerHTML = bookings.sort((a,b) => new Date(b.BookingDate) - new Date(a.BookingDate)).map(b => { const room = rooms.find(r => r.RoomID === b.RoomID) || { RoomName: b.RoomID }; const canCancel = b.Status !== 'Canceled' && new Date(b.BookingDate) >= new Date(); return `<div class="booking-item" data-status="${b.Status}"><h4>${room.RoomName} - ${b.Status}</h4><p>${new Date(b.BookingDate).toLocaleDateString()} at ${b.StartTime}</p>${canCancel ? `<button class="cta-btn cancel-btn" data-booking-id="${b.BookingID}">Cancel</button>` : ''}</div>`}).join(''); document.querySelectorAll('.cancel-btn').forEach(btn => { btn.addEventListener('click', handleCancelBooking); }); } else { listEl.innerHTML = '<p>You have no bookings.</p>'; } }
async function handleCancelBooking(e) { const bookingId = e.target.dataset.bookingId; if (confirm("Are you sure you want to cancel this booking?")) { const result = await apiCall('cancelBooking', { bookingId, userEmail: currentUser.email }); if (result && result.status === 'success') { alert(result.message); openMyBookingsModal(); if (selectedRoom) fetchAndDisplayTimeSlots(); } else { alert(result.message || 'Failed to cancel booking.'); } } }
function renderCalendar() { const m = document.getElementById('month-year'), g = document.querySelector('.calendar-grid'); g.innerHTML = ''; const n = currentMonth.getMonth(), y = currentMonth.getFullYear(); m.textContent = `${currentMonth.toLocaleString('default',{month:'long'})} ${y}`;['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].forEach(d=>{const e=document.createElement('div');e.textContent=d;e.classList.add('calendar-day-name');g.appendChild(e)});const f = new Date(y,n,1).getDay(), i = new Date(y,n+1,0).getDate();for(let j=0;j<f;j++)g.appendChild(document.createElement('div'));for(let j=1;j<=i;j++){const e=document.createElement('div');e.textContent=j;e.classList.add('calendar-day');const t=new Date(),a=new Date(y,n,j);if(a<new Date(t.getFullYear(),t.getMonth(),t.getDate()))e.classList.add('disabled');else e.addEventListener('click',()=>{selectedDate=a;document.querySelectorAll('.calendar-day').forEach(d=>d.classList.remove('selected'));e.classList.add('selected');fetchAndDisplayTimeSlots()});if(a.toDateString()===selectedDate.toDateString())e.classList.add('selected');if(a.toDateString()===t.toDateString())e.classList.add('today');g.appendChild(e)}}
async function fetchAndDisplayTimeSlots() { selectedSlots = []; updateProceedButton(); const d = selectedDate.toISOString().split('T')[0]; document.getElementById('selected-date-display').textContent = selectedDate.toLocaleDate'en-US',{weekday:'long',month:'long',day:'numeric'}); const t = document.getElementById('timeslot-grid'); t.innerHTML = '<em>Loading slots...</em>'; const a = await apiCall('getAvailability',{roomId:selectedRoom.RoomID,date:d}); if (a) { const u = selectedRoom.DurationMinutes; t.innerHTML = ''; for (let h=6;h<24;h++) for (let m=0;m<60;m+=u){const i=`${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}`,b=document.createElement('button');b.classList.add('timeslot-btn');b.textContent=new Date(`1970-01-01T${i}:00`).toLocaleTimeString('en-US',{hour:'numeric',minute:'2-digit',hour12:true});b.dataset.time=i;const s=a[i]||{confirmed:0,waitlisted:0};if(s.confirmed>=1&&s.waitlisted>=1){b.classList.add('booked');b.disabled=true}else if(s.confirmed>=1)b.classList.add('waitlist');else b.classList.add('available');if(!b.disabled)b.addEventListener('click',()=>toggleSlotSelection(b));t.appendChild(b)}}}
function toggleSlotSelection(b) { const t=b.dataset.time,i=selectedSlots.findIndex(s=>s.time===t);if(i>-1){selectedSlots.splice(i,1);b.classList.remove('selected')}else{selectedSlots.push({roomId:selectedRoom.RoomID,date:selectedDate.toISOString().split('T')[0],time:t});b.classList.add('selected')}updateProceedButton()}
function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }
