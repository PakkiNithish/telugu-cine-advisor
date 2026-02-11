document.addEventListener('DOMContentLoaded', () => {
    const menuToggle = document.getElementById('menu-toggle');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // --- Dropdown Menu Toggling ---
    menuToggle.addEventListener('click', (event) => {
        event.stopPropagation(); 
        dropdownMenu.classList.toggle('visible');
    });

    document.addEventListener('click', (event) => {
        if (!menuToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('visible');
        }
    });

    // --- Theme Toggling ---
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'light') {
            themeToggle.checked = true;
        }
    }
    themeToggle.addEventListener('change', () => {
        const isLight = themeToggle.checked;
        body.setAttribute('data-theme', isLight ? 'light' : 'dark');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
});