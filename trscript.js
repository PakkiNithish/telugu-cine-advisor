document.addEventListener('DOMContentLoaded', () => {
    // 🚨 IMPORTANT: Replace 'YOUR_TMDB_API_KEY_HERE' with your actual API key
    const API_KEY = 'bb39f92870d27e9174370323ef4bc6a0'; // Your provided API key
    
    const moviesContainer = document.getElementById('movies-container');
    const movieListTitle = document.getElementById('movie-list-title');
    const genreFilter = document.getElementById('genreFilter');
    const yearFilter = document.getElementById('yearFilter');
    const ratingFilter = document.getElementById('ratingFilter');
    const movieModal = document.getElementById('movie-modal');
    const modalBackdrop = document.getElementById('modal-backdrop');
    const menuToggle = document.getElementById('menu-toggle');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;

    // --- CONSTANTS ---
    const DEFAULT_YEAR = new Date().getFullYear();
    const DEFAULT_SORT = 'vote_average.desc'; 
    const TODAY_DATE = new Date().toISOString().split('T')[0];
    const PAGES_TO_FETCH = 3; 

    // --- Dropdown Menu & Theme Toggling ---
    menuToggle.addEventListener('click', (event) => {
        event.stopPropagation();
        dropdownMenu.classList.toggle('visible');
    });

    document.addEventListener('click', (event) => {
        if (!menuToggle.contains(event.target) && !dropdownMenu.contains(event.target)) {
            dropdownMenu.classList.remove('visible');
        }
    });

    const savedTheme = localStorage.getItem('theme');
    if (savedTheme) {
        body.setAttribute('data-theme', savedTheme);
        if (savedTheme === 'light') {
            themeToggle.checked = true;
        }
    }
    themeToggle.addEventListener('change', () => {
        body.setAttribute('data-theme', themeToggle.checked ? 'light' : 'dark');
        localStorage.setItem('theme', themeToggle.checked ? 'light' : 'dark');
    });
    
    // --- Modal Logic ---
    const closeModal = () => {
        movieModal.classList.remove('open');
        modalBackdrop.classList.remove('open');
        setTimeout(() => {
            movieModal.innerHTML = '';
        }, 300);
    };
    window.closeModal = closeModal;

    modalBackdrop.addEventListener('click', closeModal);

    // 🌟 NEW FUNCTION: FETCH REAL WATCH PROVIDERS (OTT) 🌟
    const fetchWatchProviders = async (movieId) => {
        // We use 'IN' (India) as the region for Telugu movie streaming availability
        const url = `https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`;
        
        try {
            const response = await fetch(url);
            if (!response.ok) return [];
            const data = await response.json();
            
            // Check for streaming availability in the India region ('IN')
            const indiaProviders = data.results.IN;
            
            if (indiaProviders && indiaProviders.flatrate) {
                // Return only the subscription (flatrate) providers
                return indiaProviders.flatrate;
            }
            return []; // No streaming providers found
            
        } catch (error) {
            console.error('Error fetching watch providers:', error);
            return [];
        }
    };
    
    // 🌟 MODIFIED FUNCTION: Uses actual OTT data 🌟
    const openModal = async (movie) => {
        const imagePath = movie.poster_path ? `https://image.tmdb.org/t/p/w500${movie.poster_path}` : 'https://via.placeholder.com/300x450.png?text=No+Image';
        const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
        const overview = movie.overview || 'No detailed summary available for this movie.';
        const movieId = movie.id;

        // --- FETCH REAL OTT DATA ---
        const providers = await fetchWatchProviders(movieId);
        
        let watchButtonsHtml = '';

        if (providers && providers.length > 0) {
            watchButtonsHtml = '<div class="watch-buttons-container">';
            providers.forEach(provider => {
                // Build a button for each service 
                watchButtonsHtml += `
                    <button class="watch-button">
                        ${provider.provider_name}
                    </button>
                `;
            });
            watchButtonsHtml += '</div>';
        } else {
            watchButtonsHtml = '<p style="font-size: 0.9em; color: #aaa;">No Subscription (Flatrate) streaming found in India (IN).</p>';
        }


        // --- Trailer Embed Logic ---
        let trailerEmbedHtml = '';
        const trailerKey = await fetchTrailerKey(movieId);

        if (trailerKey) {
            const youtubeEmbedUrl = `https://www.youtube.com/embed/${trailerKey}?autoplay=1&mute=1`;
            trailerEmbedHtml = `
                <iframe 
                    src="${youtubeEmbedUrl}" 
                    frameborder="0" 
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" 
                    allowfullscreen
                    title="${movie.title} Official Trailer">
                </iframe>
            `;
        } else {
            trailerEmbedHtml = `<img src="${imagePath}" alt="${movie.title} Poster" class="poster-image">`;
        }

        movieModal.innerHTML = `
            <div class="modal-header">
                <h1 class="modal-header-title">${movie.title}</h1>
                <button class="modal-close" aria-label="Close modal" onclick="closeModal()">&times;</button>
            </div>

            <div class="modal-content-wrapper">
                <div class="media-panel">
                    <div class="video-embed">
                        ${trailerEmbedHtml}
                    </div>
                </div>

                <div class="modal-details">
                    <h3 class="summary-title">Summary</h3>
                    <p class="summary-text">${overview}</p>
                    <div class="rating-section">
                        <span class="star-icon">⭐</span>
                        <span class="score">${rating}</span>
                    </div>
                    
                    <div class="watch-section">
                        <h4>Where to Watch (Subscription/Flatrate in India)</h4>
                        ${watchButtonsHtml}
                    </div>
                </div>
            </div>
        `;

        movieModal.classList.add('open');
        modalBackdrop.classList.add('open');
    };

    const fetchTrailerKey = async (movieId) => {
        const url = `https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`;
        try {
            const response = await fetch(url);
            if (!response.ok) return null;
            const data = await response.json();
            const trailer = data.results.find(video => video.type === 'Trailer' && video.site === 'YouTube');
            return trailer ? trailer.key : null;
        } catch (error) {
            console.error('Error fetching trailer:', error);
            return null;
        }
    };
    
    // =================================================
    // === API FETCHING AND DISPLAY ===
    // =================================================

    // Function to fetch multiple pages and combine results
    const fetchMultiplePages = async (baseUrl) => {
        const fetchPromises = [];
        for (let i = 1; i <= PAGES_TO_FETCH; i++) {
            const url = `${baseUrl}&page=${i}`;
            fetchPromises.push(
                fetch(url)
                    .then(response => {
                        if (!response.ok) throw new Error(`HTTP error! status: ${response.status} on page ${i}`);
                        return response.json();
                    })
                    .catch(error => {
                        console.error(`Error fetching page ${i}:`, error);
                        return { results: [] }; 
                    })
            );
        }

        const responses = await Promise.all(fetchPromises);
        const allResults = responses.flatMap(data => data.results || []);
        return allResults;
    };

    const displayMovies = (movies) => {
        moviesContainer.innerHTML = '';
        
        // Final client-side check to ensure only released Telugu movies with posters are shown
        const filteredMovies = movies.filter(movie => {
            const isTelugu = movie.original_language === 'te';
            const hasPoster = movie.poster_path;
            // CRUCIAL: Check if release date is today or earlier (Automatic Update)
            const isReleased = movie.release_date && movie.release_date <= TODAY_DATE;
            return isTelugu && hasPoster && isReleased;
        });

        if (filteredMovies.length === 0) {
            moviesContainer.innerHTML = `<p style="text-align:center; color: var(--color-text);">No released Telugu movies found matching your criteria up to ${TODAY_DATE}.</p>`;
            return;
        }
        
        // Sort by Release Date (Newest first) - required by the user
        filteredMovies.sort((a, b) => {
            const dateA = new Date(a.release_date);
            const dateB = new Date(b.release_date);
            return dateB - dateA; // Descending order (Newest first)
        });

        filteredMovies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('card');
            const posterPath = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : 'https://via.placeholder.com/300x450.png?text=No+Image';
            const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
            
            movieCard.innerHTML = `
                <img src="${posterPath}" alt="${movie.title} Poster">
                <div class="info">
                    <h3>${movie.title}</h3>
                    <p>Rating: ${movie.vote_average.toFixed(1)} (${releaseYear})</p>
                </div>
            `;
            movieCard.addEventListener('click', () => openModal(movie)); 
            moviesContainer.appendChild(movieCard);
        });
    };

    const applyFilters = async () => {
        const selectedGenre = genreFilter.value;
        const selectedYear = yearFilter.value; 
        const selectedRating = ratingFilter.value;

        let currentSort = DEFAULT_SORT; 
        
        let baseUrl = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&language=en-US&sort_by=${currentSort}&with_original_language=te&primary_release_date.lte=${TODAY_DATE}`;

        if (selectedGenre) baseUrl += `&with_genres=${selectedGenre}`;
        if (selectedYear) baseUrl += `&primary_release_year=${selectedYear}`;
        if (selectedRating) baseUrl += `&vote_average.gte=${selectedRating}`;
        
        // Update the title based on the selected year
        movieListTitle.textContent = selectedYear 
            ? `Top Rated Telugu Movies for ${selectedYear}` 
            : 'Top Rated Telugu Movies of All Time';

        const movies = await fetchMultiplePages(baseUrl);
        displayMovies(movies);
    };

    // --- Filter Initialization ---
    const populateFilters = async () => {
        // Genres
        const genreUrl = `https://api.themoviedb.org/3/genre/movie/list?api_key=${API_KEY}&language=en-US`;
        try {
            const response = await fetch(genreUrl);
            const data = await response.json();
            data.genres.forEach(genre => {
                const option = document.createElement('option');
                option.value = genre.id;
                option.textContent = genre.name;
                genreFilter.appendChild(option);
            });
        } catch (error) {
            console.error('Error fetching genres:', error);
        }

        // Years (Current year back 20 years)
        const currentYear = new Date().getFullYear();
        for (let i = currentYear; i >= currentYear - 20; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = i;
            yearFilter.appendChild(option);
        }

        // Ratings (10.0 down to 1.0)
        for (let i = 9; i >= 1; i--) {
            const option = document.createElement('option');
            option.value = i;
            option.textContent = `${i}.0+`;
            ratingFilter.appendChild(option);
        }

        // Run the initial fetch after filters are populated
        applyFilters();
    };
    
    // --- Event Listeners ---
    genreFilter.addEventListener('change', applyFilters);
    yearFilter.addEventListener('change', applyFilters);
    ratingFilter.addEventListener('change', applyFilters);

    // Initial setup
    populateFilters();
});