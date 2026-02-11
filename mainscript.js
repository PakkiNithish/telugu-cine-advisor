const enterButton = document.getElementById('enter-button');
const loginModal = document.getElementById('login-modal');
const closeLoginModalButton = document.getElementById('close-login-modal');
const guestButton = document.getElementById('guest-button');

// Show the login modal when the "ENTER" button is clicked
enterButton.addEventListener('click', () => {
    loginModal.style.display = 'flex';
});

// Close the login modal when the "x" is clicked
closeLoginModalButton.addEventListener('click', () => {
    loginModal.style.display = 'none';
});

// Redirect to main website on guest click
guestButton.addEventListener('click', () => {
    window.location.href = 'index.html'; // Change 'main.html' to your main website file
});

// Close the modal if the user clicks outside of it
window.addEventListener('click', (event) => {
    if (event.target === loginModal) {
        loginModal.style.display = 'none';
    }
});