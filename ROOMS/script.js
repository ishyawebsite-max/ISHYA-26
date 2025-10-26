// script.js

// --- CONFIGURATION ---
const GOOGLE_CLIENT_ID = '750824340469-nrqmioc1jgoe6rjnuaqjdu9mh0b4or2o.apps.googleusercontent.com'; // <-- IMPORTANT: Paste your Client ID here
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbyMIe8XsM2Pz-f4BK8U0gs2Ao_FEeCgN-Oyg0NX1f8ZJH6XJc-Xf-093QO8N5px8j71rg/exec'; // <-- IMPORTANT: Paste your Web App URL here

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
    // Google Sign-In Initialization
    google.accounts.id.initialize({
        client_id: GOOGLE_CLIENT_ID,
        callback: handleCredentialResponse
    });
    google.accounts.id.renderButton(
        document.getElementById('auth-container'),
        { theme: 'outline', size: 'large' }
    );
    google.accounts.id.prompt();

    // Fetch rooms and render initial view
    fetchRooms();

    // Event Listeners
    setupEventListeners();
};

// --- AUTHENTICATION ---
function handleCredentialResponse(response) {
    const id_token = response.credential;
    // Decode JWT to get user info (no need for a library for this basic info)
    const decodedToken = JSON.parse(atob(id_token.split('.')[1]));
    
    currentUser = {
        name: decodedToken.name,
        email: decodedToken.email,
        picture: decodedToken.picture
    };
    
    updateAuthUI();
}

function updateAuthUI() {
    const authContainer = document.getElementById('auth-container');
    if (currentUser) {
        authContainer.innerHTML = `
            <div id="user-profile">
                <img src="${currentUser.picture}" alt="User profile picture">
                <span>${currentUser.name.split(' ')[0]}</span>
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
    updateAuthUI();
}

// --- API CALLS ---
async function apiCall(action, payload = {}) {
    showLoader();
    try {
        const response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            mode: 'cors',
            headers: {
                'Content-Type': 'text/plain;charset=utf-8', // Apps Script requires text/plain
            },
            body: JSON.stringify({ action, ...payload })
        });
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        return result;
    } catch (error) {
        console.error('API Call Error:', error);
        alert('An error occurred. Please try again.');
        return null;
    } finally {
        hideLoader();
    }
}


// --- UI RENDERING & LOGIC ---

function setupEventListeners() {
    // Navigation
    document.querySelector('.back-btn').addEventListener('click', () => showStep('room-selection'));

    // Calendar
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));

    // Booking Process
    document.getElementById('proceed-to-booking-btn').addEventListener('click', openBookingModal);

    // Modals
    document.querySelectorAll('.modal-wrapper .close-btn').forEach(btn => {
        btn.addEventListener('click', (e) => e.target.closest('.modal-wrapper').classList.add('hidden'));
    });
    
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
}

function showStep(stepId) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
    window.scrollTo(0, 0);
}

// --- UPDATED fetchRooms Function with Debugging ---
async function fetchRooms() {
    console.log("Fetching rooms...");
    const roomsData = await apiCall('getRooms');
    
    if (roomsData && roomsData.length > 0) {
        rooms = roomsData;
        console.log("Rooms fetched:", rooms); // Log the fetched rooms to see their structure

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

        document.querySelectorAll('.select-room-btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                const roomId = e.target.closest('.room-card').dataset.roomId;
                console.log("Book Now clicked for RoomID:", roomId); // Log the specific ID being clicked
                handleRoomSelection(roomId);
            });
        });
    } else {
        roomList.innerHTML = "<p>Could not load any rooms. Please check the connection and try again.</p>";
        console.error("No room data was returned from the API, or the array is empty.");
    }
}

// --- UPDATED handleRoomSelection Function with Safeguard ---
function handleRoomSelection(roomId) {
    if (!currentUser) {
        alert("Please sign in with Google to book a room.");
        return;
    }

    selectedRoom = rooms.find(r => r.RoomID == roomId); // Use loose equality here
    
    // --- SAFEGUARD ADDED HERE ---
    if (!selectedRoom) {
        console.error(`Error: Could not find a room with RoomID "${roomId}". Please check for typos or case-sensitivity issues between your HTML data-room-id and the data from Google Sheets.`, rooms);
        alert("Oops! There was an error selecting this room. Please try refreshing the page.");
        return; // Stop the function here to prevent the crash
    }
    
    // This code will only run if the room was found successfully
    document.getElementById('schedule-title').innerText = `Schedule for ${selectedRoom.RoomName}`;
    selectedDate = new Date();
    currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
    renderCalendar();
    fetchAndDisplayTimeSlots();
    showStep('schedule-selection');
}


// Calendar
function renderCalendar() {
    const monthYearEl = document.getElementById('month-year');
    const calendarGrid = document.querySelector('.calendar-grid');

    calendarGrid.innerHTML = '';
    const month = currentMonth.getMonth();
    const year = currentMonth.getFullYear();

    monthYearEl.textContent = `${currentMonth.toLocaleString('default', { month: 'long' })} ${year}`;

    // Day names
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => {
        const dayEl = document.createElement('div');
        dayEl.textContent = day;
        dayEl.classList.add('calendar-day-name');
        calendarGrid.appendChild(dayEl);
    });

    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();

    for (let i = 0; i < firstDay; i++) {
        calendarGrid.appendChild(document.createElement('div'));
    }

    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.textContent = i;
        dayEl.classList.add('calendar-day');

        const today = new Date();
        const date = new Date(year, month, i);

        // Disable past dates
        if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) {
            dayEl.classList.add('disabled');
        } else {
            dayEl.addEventListener('click', () => {
                selectedDate = date;
                document.querySelectorAll('.calendar-day').forEach(d => d.classList.remove('selected'));
                dayEl.classList.add('selected');
                fetchAndDisplayTimeSlots();
            });
        }
        
        if (date.toDateString() === selectedDate.toDateString()) {
            dayEl.classList.add('selected');
        }
        if (date.toDateString() === today.toDateString()) {
            dayEl.classList.add('today');
        }
        
        calendarGrid.appendChild(dayEl);
    }
}

function changeMonth(offset) {
    currentMonth.setMonth(currentMonth.getMonth() + offset);
    renderCalendar();
}

// Time Slots
async function fetchAndDisplayTimeSlots() {
    selectedSlots = []; // Reset selected slots when date changes
    updateProceedButton();
    const dateStr = selectedDate.toISOString().split('T')[0];
    document.getElementById('selected-date-display').textContent = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeslotGrid = document.getElementById('timeslot-grid');
    timeslotGrid.innerHTML = '<em>Loading slots...</em>';

    const availability = await apiCall('getAvailability', { 
        roomId: selectedRoom.RoomID, 
        date: dateStr
    });

    if (availability) {
        const duration = selectedRoom.DurationMinutes;
        timeslotGrid.innerHTML = '';
        for (let hour = 6; hour < 24; hour++) {
            for (let min = 0; min < 60; min += duration) {
                const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                const slotBtn = document.createElement('button');
                slotBtn.classList.add('timeslot-btn');
                slotBtn.textContent = new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                slotBtn.dataset.time = time;

                const status = availability[time] || { confirmed: 0, waitlisted: 0 };
                if (status.confirmed >= 1 && status.waitlisted >= 1) {
                    slotBtn.classList.add('booked');
                    slotBtn.disabled = true;
                } else if (status.confirmed >= 1) {
                    slotBtn.classList.add('waitlist');
                    slotBtn.title = "Slot available for waitlist only";
                } else {
                    slotBtn.classList.add('available');
                }
                
                if (!slotBtn.disabled) {
                    slotBtn.addEventListener('click', () => toggleSlotSelection(slotBtn));
                }

                timeslotGrid.appendChild(slotBtn);
            }
        }
    }
}

function toggleSlotSelection(slotBtn) {
    const time = slotBtn.dataset.time;
    const index = selectedSlots.findIndex(s => s.time === time);

    if (index > -1) {
        selectedSlots.splice(index, 1);
        slotBtn.classList.remove('selected');
    } else {
        selectedSlots.push({ 
            roomId: selectedRoom.RoomID,
            date: selectedDate.toISOString().split('T')[0],
            time: time
        });
        slotBtn.classList.add('selected');
    }
    updateProceedButton();
}

function updateProceedButton() {
    const btn = document.getElementById('proceed-to-booking-btn');
    btn.disabled = selectedSlots.length === 0;
    btn.textContent = selectedSlots.length > 0 ? `Book ${selectedSlots.length} Slot(s)` : 'Book Selected Slots';
}

// Booking Modal & Submission
function openBookingModal() {
    if (selectedSlots.length === 0) return;
    
    document.getElementById('user-name').value = currentUser.name;
    document.getElementById('user-email').value = currentUser.email;

    const summaryEl = document.getElementById('booking-summary');
    summaryEl.innerHTML = `
        <p><strong>Room:</strong> ${selectedRoom.RoomName}</p>
        <p><strong>Date:</strong> ${selectedDate.toLocaleDateString()}</p>
        <p><strong>Time Slots:</strong> ${selectedSlots.map(s => s.time).join(', ')}</p>
    `;
    
    document.getElementById('booking-modal').classList.remove('hidden');
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    
    const bookingDetails = {
        user: currentUser,
        roomName: selectedRoom.RoomName,
        slots: selectedSlots,
        participants: document.getElementById('participants').value,
        notes: document.getElementById('notes').value
    };
    
    const result = await apiCall('makeBooking', { bookingDetails });

    if (result && result.status === 'completed') {
        let successMessage = "Your booking request has been processed:\n";
        result.results.forEach(res => {
            successMessage += `- ${res.time}: ${res.bookingStatus || res.message}\n`;
        });
        alert(successMessage);
        document.getElementById('booking-modal').classList.add('hidden');
        document.getElementById('booking-form').reset();
        fetchAndDisplayTimeSlots(); // Refresh slots
    } else {
        alert('Booking failed. Please try again.');
    }
}


// My Bookings Modal
async function openMyBookingsModal() {
    const modal = document.getElementById('my-bookings-modal');
    const listEl = document.getElementById('user-bookings-list');
    listEl.innerHTML = '<p>Loading your bookings...</p>';
    modal.classList.remove('hidden');

    const bookings = await apiCall('getUserBookings', { userEmail: currentUser.email });

    if (bookings && bookings.length > 0) {
        listEl.innerHTML = bookings
            .sort((a,b) => new Date(b.BookingDate) - new Date(a.BookingDate)) // Sort by most recent
            .map(b => {
                const room = rooms.find(r => r.RoomID === b.RoomID) || { RoomName: b.RoomID };
                const canCancel = b.Status !== 'Canceled' && new Date(b.BookingDate) >= new Date();
                return `
                <div class="booking-item" data-status="${b.Status}">
                    <h4>${room.RoomName} - ${b.Status}</h4>
                    <p>
                        ${new Date(b.BookingDate).toLocaleDateString()} at ${b.StartTime}
                    </p>
                    ${canCancel ? `<button class="cta-btn cancel-btn" data-booking-id="${b.BookingID}">Cancel</button>` : ''}
                </div>
            `}).join('');

        document.querySelectorAll('.cancel-btn').forEach(btn => {
            btn.addEventListener('click', handleCancelBooking);
        });
    } else {
        listEl.innerHTML = '<p>You have no bookings.</p>';
    }
}

async function handleCancelBooking(e) {
    const bookingId = e.target.dataset.bookingId;
    if (confirm("Are you sure you want to cancel this booking?")) {
        const result = await apiCall('cancelBooking', { bookingId, userEmail: currentUser.email });
        if (result && result.status === 'success') {
            alert(result.message);
            openMyBookingsModal(); // Refresh the list
            fetchAndDisplayTimeSlots(); // Refresh the main view
        } else {
            alert(result.message || 'Failed to cancel booking.');
        }
    }
}

// --- UTILITIES ---
function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }
