// script.js - VERSION 5.2 COMPLETE
// --- CONFIGURATION ---
const GOOGLE_CLIENT_ID = '750824340469-nrqmioc1jgoe6rjnuaqjdu9mh0b4or2o.apps.googleusercontent.com'; 
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbw_aGbv_r4AAypGcm95djGKJqPBEgT41vWQjxBb0sbkqDJza5bW2lZw5kvBKmhkNB7rzA/exec';


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
        authContainer.innerHTML = `<div id="user-profile"><img src="${currentUser.picture}" alt="User profile"><span>${currentUser.name}</span><button id="my-bookings-btn">My Bookings</button><button id="logout-btn">Log Out</button></div>`;
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
        alert('Connectivity error. Please try again.');
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
        const isToday = (selectedDate.toDateString() === new Date().toDateString());
        const cutoffTime = new Date(new Date().getTime() + 30 * 60000); 

        for (let hour = 6; hour < 24; hour++) {
            for (let min = 0; min < 60; min += duration) {
                const time = `${String(hour).padStart(2, '0')}:${String(min).padStart(2, '0')}`;
                const slotTime = new Date(selectedDate);
                slotTime.setHours(hour, min, 0, 0);

                const slotBtn = document.createElement('button');
                slotBtn.classList.add('timeslot-btn');
                slotBtn.textContent = new Date(`1970-01-01T${time}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                slotBtn.dataset.time = time;

                if (isToday && slotTime < cutoffTime) {
                    slotBtn.classList.add('booked');
                    slotBtn.disabled = true;
                } else {
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
                }
                timeslotGrid.appendChild(slotBtn);
            }
        }
    }
}

// --- UPDATED TOGGLE WITH 5-SLOT ALERT ---
function toggleSlotSelection(slotBtn) {
    const time = slotBtn.dataset.time;
    const index = selectedSlots.findIndex(s => s.time === time);
    
    if (index > -1) {
        selectedSlots.splice(index, 1);
        slotBtn.classList.remove('selected');
    } else {
        // LIMIT CHECK
        if (selectedSlots.length >= 5) {
            alert("⚠️ Max 5 slot bookings are allowed per day.");
            return;
        }
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
    const [year, month, day] = selectedSlots[0].date.split('-');
    const displayDate = `${day}/${month}/${year}`;
    summaryEl.innerHTML = `<p><strong>Room:</strong> ${selectedRoom.RoomName}</p><p><strong>Date:</strong> ${displayDate}</p><p><strong>Time Slots:</strong> ${selectedSlots.map(s => new Date(`1970-01-01T${s.time}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })).sort().join(', ')}</p>`;
    document.getElementById('booking-modal').classList.remove('hidden');
}

async function handleBookingSubmit(e) {
    e.preventDefault();
    const bookingDetails = { user: currentUser, roomName: selectedRoom.RoomName, slots: selectedSlots, participants: document.getElementById('participants').value, notes: document.getElementById('notes').value };
    const result = await apiCall('makeBooking', { bookingDetails });
    if (result && result.status === 'completed') {
        let successMessage = "Booking Status:\n";
        result.results.forEach(res => { 
            const formattedTime = new Date(`1970-01-01T${res.time}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
            successMessage += `- ${formattedTime}: ${res.bookingStatus || res.message}\n`; 
        });
        alert(successMessage);
        document.getElementById('booking-modal').classList.add('hidden');
        document.getElementById('booking-form').reset();
        fetchAndDisplayTimeSlots();
    } else {
        alert(`Booking failed: ${result ? result.message : 'Unknown error'}`);
    }
}

async function openMyBookingsModal() {
    const modal = document.getElementById('my-bookings-modal'), listEl = document.getElementById('user-bookings-list');
    listEl.innerHTML = '<p>Loading...</p>';
    modal.classList.remove('hidden');
    const bookings = await apiCall('getUserBookings', { userEmail: currentUser.email });

    if (bookings && bookings.length > 0) {
        listEl.innerHTML = bookings.sort((a, b) => {
            const dateA = new Date(a.BookingDate.split('/').reverse().join('-'));
            const dateB = new Date(b.BookingDate.split('/').reverse().join('-'));
            return dateB - dateA || a.StartTime.localeCompare(b.StartTime);
        }).map(b => {
                const room = rooms.find(r => String(r.RoomID) === String(b.RoomID)) || { RoomName: `Room ${b.RoomID}` };
                const [day, month, year] = b.BookingDate.split('/');
                const canCancel = b.Status !== 'Canceled' && new Date(year, month - 1, day) >= new Date().setHours(0,0,0,0);
                
                let formattedTime = b.StartTime;
                try {
                    formattedTime = new Date(`1970-01-01T${b.StartTime}:00`).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
                } catch(e) {}

                return `<div class="booking-item" data-status="${b.Status}"><h4>${room.RoomName} - ${b.Status}</h4><p>${b.BookingDate} at ${formattedTime}</p>${canCancel ? `<button class="cta-btn cancel-btn" data-booking-id="${b.BookingID}">Cancel Booking</button>` : ''}</div>`;
            }).join('');
        document.querySelectorAll('.cancel-btn').forEach(btn => btn.addEventListener('click', handleCancelBooking));
    } else {
        listEl.innerHTML = '<p>No bookings found.</p>';
    }
}

async function handleCancelBooking(e) {
    const bookingId = e.target.dataset.bookingId;
    if (confirm("Cancel this booking?")) {
        const result = await apiCall('cancelBooking', { bookingId, userEmail: currentUser.email });
        if (result && result.status === 'success') {
            alert("Booking canceled and confirmation email sent.");
            openMyBookingsModal();
            if (scheduleSelectionStep.classList.contains('active')) fetchAndDisplayTimeSlots();
        } else {
            alert(result ? result.message : 'Error canceling.');
        }
    }
}

function showLoader() { loader.classList.remove('hidden'); }
function hideLoader() { loader.classList.add('hidden'); }
