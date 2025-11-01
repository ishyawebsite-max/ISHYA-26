// script.js - FINAL COMPLETE SCRIPT

// --- CONFIGURATION ---
const GOOGLE_CLIENT_ID = '750824340469-nrqmioc1jgoe6rjnuaqjdu9mh0b4or2o.apps.googleusercontent.com'; // <-- IMPORTANT: Paste your Client ID here
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbwsow-uSwtpLEODbtUlfSW908EsIPA-AijaH0kGZ2wZGGeCyvzqava4accf0TgKFKhxkw/exec'; // <-- IMPORTANT: Paste your Web App URL here


let currentUser = null, rooms = [], selectedRoom = null, selectedDate = new Date(), selectedSlots = [], currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
const loader = document.getElementById('loader'), roomList = document.getElementById('room-list'), roomSelectionStep = document.getElementById('room-selection'), scheduleSelectionStep = document.getElementById('schedule-selection');

window.onload = function () {
    google.accounts.id.initialize({ client_id: GOOGLE_CLIENT_ID, callback: handleCredentialResponse });
    google.accounts.id.renderButton(document.getElementById('auth-container'), { theme: 'outline', size: 'large' });
    google.accounts.id.prompt();
    setupEventListeners();
    fetchRooms();
};

function handleCredentialResponse(response) {
    const decodedToken = JSON.parse(atob(response.credential.split('.')[1]));
    currentUser = { name: decodedToken.name, email: decodedToken.email, picture: decodedToken.picture };
    updateAuthUI();
}

function updateAuthUI() {
    const authContainer = document.getElementById('auth-container');
    if (currentUser) {
        authContainer.innerHTML = `<div id="user-profile"><img src="${currentUser.picture}" alt="User profile picture"><span>${currentUser.name}</span><button id="my-bookings-btn">My Bookings</button><button id="logout-btn">Log Out</button></div>`;
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

async function apiCall(action, payload = {}) {
    showLoader();
    try {
        const response = await fetch(APPS_SCRIPT_URL, { method: 'POST', mode: 'cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify({ action, ...payload }) });
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        return await response.json();
    } catch (error) {
        console.error('API Call Error:', error);
        alert('An error occurred. Please check the console.');
        return null;
    } finally {
        hideLoader();
    }
}

function setupEventListeners() {
    document.querySelector('.back-btn').addEventListener('click', () => showStep('room-selection'));
    document.getElementById('prev-month').addEventListener('click', () => changeMonth(-1));
    document.getElementById('next-month').addEventListener('click', () => changeMonth(1));
    document.getElementById('proceed-to-booking-btn').addEventListener('click', openBookingModal);
    document.querySelectorAll('.modal-wrapper .close-btn').forEach(btn => btn.addEventListener('click', (e) => e.target.closest('.modal-wrapper').classList.add('hidden')));
    document.getElementById('booking-form').addEventListener('submit', handleBookingSubmit);
}

function showStep(stepId) {
    document.querySelectorAll('.step').forEach(step => step.classList.remove('active'));
    document.getElementById(stepId).classList.add('active');
    window.scrollTo(0, 0);
}

async function fetchRooms() {
    const roomsData = await apiCall('getRooms');
    if (roomsData) {
        rooms = roomsData;
        roomList.innerHTML = rooms.map(room => `<div class="room-card" data-room-id="${room.RoomID}"><img src="${room.ImageURL}" alt="${room.RoomName}"><div class="room-card-content"><h3>${room.RoomName}</h3><p>${room.Description}</p><button class="cta-btn select-room-btn">Book Now</button></div></div>`).join('');
        document.querySelectorAll('.select-room-btn').forEach(btn => btn.addEventListener('click', (e) => handleRoomSelection(e.target.closest('.room-card').dataset.roomId)));
    }
}

function handleRoomSelection(roomId) {
    if (!currentUser) { alert("Please sign in to book a room."); return; }
    selectedRoom = rooms.find(r => String(r.RoomID) === String(roomId));
    if (selectedRoom) {
        document.getElementById('schedule-title').innerText = `Schedule for ${selectedRoom.RoomName}`;
        selectedDate = new Date();
        currentMonth = new Date(selectedDate.getFullYear(), selectedDate.getMonth(), 1);
        renderCalendar();
        fetchAndDisplayTimeSlots();
        showStep('schedule-selection');
    }
}

function renderCalendar() {
    const monthYearEl = document.getElementById('month-year'), grid = document.querySelector('.calendar-grid');
    grid.innerHTML = '';
    const month = currentMonth.getMonth(), year = currentMonth.getFullYear();
    monthYearEl.textContent = `${currentMonth.toLocaleString('default', { month: 'long' })} ${year}`;
    ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].forEach(day => { const el = document.createElement('div'); el.textContent = day; el.classList.add('calendar-day-name'); grid.appendChild(el); });
    const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate();
    for (let i = 0; i < firstDay; i++) grid.appendChild(document.createElement('div'));
    for (let i = 1; i <= daysInMonth; i++) {
        const dayEl = document.createElement('div');
        dayEl.textContent = i;
        dayEl.classList.add('calendar-day');
        const today = new Date(), date = new Date(year, month, i);
        if (date < new Date(today.getFullYear(), today.getMonth(), today.getDate())) dayEl.classList.add('disabled');
        else dayEl.addEventListener('click', () => { selectedDate = date; document.querySelectorAll('.calendar-day.selected').forEach(d => d.classList.remove('selected')); dayEl.classList.add('selected'); fetchAndDisplayTimeSlots(); });
        if (date.toDateString() === selectedDate.toDateString()) dayEl.classList.add('selected');
        if (date.toDateString() === today.toDateString()) dayEl.classList.add('today');
        grid.appendChild(dayEl);
    }
}

function changeMonth(offset) {
    currentMonth.setMonth(currentMonth.getMonth() + offset);
    renderCalendar();
}

function getLocalDateString(date) {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
}

// In script.js - FINAL VERSION of this function

async function fetchAndDisplayTimeSlots() {
    selectedSlots = [];
    updateProceedButton();
    const dateStr = getLocalDateString(selectedDate);
    document.getElementById('selected-date-display').textContent = selectedDate.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
    const timeslotGrid = document.getElementById('timeslot-grid');
    timeslotGrid.innerHTML = '<em>Loading slots...</em>';
    const availability = await apiCall('getAvailability', { roomId: selectedRoom.RoomID, date: dateStr });

    if (availability) {
        const duration = selectedRoom.DurationMinutes || 30;
        timeslotGrid.innerHTML = '';

        // --- FINAL LOGIC: Set up the time buffer for today ---
        const isToday = (selectedDate.toDateString() === new Date().toDateString());
        const now = new Date();
        // The cutoff is exactly 30 minutes from now. Any slot starting before this time will be disabled.
        const cutoffTime = new Date(now.getTime() + 30 * 60000); 
        // --- END OF FINAL LOGIC ---

        for (let hour = 6; hour < 24; hour++) {
            for (let min = 0; min < 60; min += duration) {
                const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                
                // Create a full Date object for the specific slot time to allow for comparison
                const slotTime = new Date(selectedDate);
                slotTime.setHours(hour, min, 0, 0);

                // --- FINAL LOGIC: Check if this slot is in the past or within the 30-minute buffer ---
                if (isToday && slotTime < cutoffTime) {
                    // If the slot is too soon, create a disabled button and skip the rest of the logic
                    const pastBtn = document.createElement('button');
                    pastBtn.classList.add('timeslot-btn', 'booked'); // Use 'booked' style for disabled past slots
                    pastBtn.textContent = new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                    pastBtn.disabled = true;
                    timeslotGrid.appendChild(pastBtn);
                    continue; // Skip to the next slot in the loop
                }
                // --- END OF FINAL LOGIC ---

                // This part only runs for slots that are valid to be booked
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
                } else {
                    slotBtn.classList.add('available');
                }

                if (!slotBtn.disabled) slotBtn.addEventListener('click', () => toggleSlotSelection(slotBtn));
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
        selectedSlots.push({ roomId: selectedRoom.RoomID, date: getLocalDateString(selectedDate), time: time });
        slotBtn.classList.add('selected');
    }
    updateProceedButton();
}

function updateProceedButton() {
    const btn = document.getElementById('proceed-to-booking-btn');
    btn.disabled = selectedSlots.length === 0;
    btn.textContent = selectedSlots.length > 0 ? `Book ${selectedSlots.length} Slot(s)` : 'Book Selected Slots';
}

function openBookingModal() {
    if (selectedSlots.length === 0) return;
    document.getElementById('user-name').value = currentUser.name;
    document.getElementById('user-email').value = currentUser.email;
    const summaryEl = document.getElementById('booking-summary');
    // Using a reliable way to parse the date string without timezone issues
    const [year, month, day] = selectedSlots[0].date.split('-');
    const displayDate = new Date(year, month - 1, day).toLocaleDateString('en-GB'); // DD/MM/YYYY
    summaryEl.innerHTML = `<p><strong>Room:</strong> ${selectedRoom.RoomName}</p><p><strong>Date:</strong> ${displayDate}</p><p><strong>Time Slots:</strong> ${selectedSlots.map(s => new Date(`1970-01-01T${s.time}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })).sort().join(', ')}</p>`;
    document.getElementById('booking-modal').classList.remove('hidden');
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    const bookingDetails = { user: currentUser, roomName: selectedRoom.RoomName, slots: selectedSlots, participants: document.getElementById('participants').value, notes: document.getElementById('notes').value };
    const result = await apiCall('makeBooking', { bookingDetails });
    if (result && result.status === 'completed') {
        let successMessage = "Booking request processed:\n";
        result.results.forEach(res => { 
            const formattedTime = new Date(`1970-01-01T${res.time}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            successMessage += `- ${formattedTime}: ${res.bookingStatus || res.message}\n`; 
        });
        alert(successMessage);
        document.getElementById('booking-modal').classList.add('hidden');
        document.getElementById('booking-form').reset();
        fetchAndDisplayTimeSlots(); // Refresh slots to show new status
    } else {
        alert(`Booking failed. ${result ? result.message : 'The slot may have been taken.'}`);
    }
}

// In script.js - FINAL VERSION of this function

async function openMyBookingsModal() {
    const modal = document.getElementById('my-bookings-modal'), listEl = document.getElementById('user-bookings-list');
    listEl.innerHTML = '<p>Loading your bookings...</p>';
    modal.classList.remove('hidden');
    const bookings = await apiCall('getUserBookings', { userEmail: currentUser.email });

    if (bookings && bookings.length > 0) {
        listEl.innerHTML = bookings.sort((a, b) => {
            // Sort by date, then by time
            const dateA = new Date(a.BookingDate.split('/').reverse().join('-'));
            const dateB = new Date(b.BookingDate.split('/').reverse().join('-'));
            if (dateA > dateB) return -1;
            if (dateA < dateB) return 1;
            return a.StartTime.localeCompare(b.StartTime);
        }).map(b => {
                const room = rooms.find(r => String(r.RoomID) === String(b.RoomID)) || { RoomName: `Room ID ${b.RoomID}` };

                // Correctly parse the date for the canCancel check
                const [day, month, year] = b.BookingDate.split('/');
                const bookingDate = new Date(year, month - 1, day);
                const today = new Date();
                today.setHours(0, 0, 0, 0);
                const canCancel = b.Status !== 'Canceled' && bookingDate >= today;

                // --- THE FINAL FIX IS HERE ---
                // This now correctly handles both "HH:mm" strings and full Date objects for the time.
                let formattedTime = 'Invalid Time';
                try {
                    // Try to parse it as if it's a full date string first
                    let timeObj = new Date(b.StartTime);
                    // If it's an invalid date, it might be a simple "HH:mm" string
                    if (isNaN(timeObj.getTime())) {
                       timeObj = new Date(`1970-01-01T${b.StartTime}:00`);
                    }
                    formattedTime = timeObj.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                } catch(e) {
                    // If all parsing fails, we'll know. But it shouldn't.
                    console.error("Could not format time:", b.StartTime);
                }
                
                return `<div class="booking-item" data-status="${b.Status}"><h4>${room.RoomName} - <strong>${b.Status}</strong></h4><p>${b.BookingDate} at ${formattedTime}</p>${canCancel ? `<button class="cta-btn cancel-btn" data-booking-id="${b.BookingID}">Cancel Booking</button>` : ''}</div>`;
            }).join('');
        document.querySelectorAll('.cancel-btn').forEach(btn => btn.addEventListener('click', handleCancelBooking));
    } else {
        listEl.innerHTML = '<p>You have no bookings.</p>';
    }
}
async function handleCancelBooking(e) {
    const bookingId = e.target.dataset.bookingId;
    if (confirm("Are you sure you want to cancel this booking? This action cannot be undone.")) {
        const result = await apiCall('cancelBooking', { bookingId, userEmail: currentUser.email });
        if (result && result.status === 'success') {
            alert(result.message);
            openMyBookingsModal(); // Refresh the bookings list
            // If the user is on the schedule page for the canceled room, refresh its slots
            if (scheduleSelectionStep.classList.contains('active')) {
                fetchAndDisplayTimeSlots();
            }
        } else {
            alert(result ? result.message : 'Failed to cancel booking.');
        }
    }
}

function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }
