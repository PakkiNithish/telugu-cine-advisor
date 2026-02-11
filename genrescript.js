document.addEventListener('DOMContentLoaded', () => {
    // !!! IMPORTANT: Replace 'bb39f92870d27e9174370323ef4bc6a0' with your actual key.
    const API_KEY = 'bb39f92870d27e9174370323ef4bc6a0'; 
    const genreList = document.getElementById('genreList');
    const genreLinks = genreList.querySelectorAll('a');
    const genreTitle = document.getElementById('genreTitle');
    const moviesContainer = document.getElementById('moviesContainer');
    const searchInput = document.getElementById('searchInput');
    const searchButton = document.getElementById('searchButton');
    const sortButton = document.getElementById('sortButton');
    const menuToggle = document.getElementById('menu-toggle');
    const dropdownMenu = document.getElementById('dropdown-menu');
    const themeToggle = document.getElementById('theme-toggle');
    const body = document.body;



    // Modal Elements
    const modalOverlay = document.getElementById('movieModalOverlay');
    const modalContent = document.getElementById('modalContent');
    const closeModalBtn = document.getElementById('closeModalBtn');

    // Get today's date in YYYY-MM-DD format for filtering future releases
    const TODAY_DATE = new Date().toISOString().split('T')[0];

    // Sort order for release date (Newest First)
    let currentSortOrder = 'primary_release_date.desc'; 
    let currentGenreId = '28';
    let currentGenreName = 'Action';

    // Set initial button text
    sortButton.textContent = 'Sort: Newest First';

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


    // --- 1. Function to Display Movie Cards (No Change) ---
    const displayMovies = (movies, sourceDescription) => {
        moviesContainer.innerHTML = '';
        if (movies.length === 0) {
            genreTitle.textContent = "No Telugu Movies Found";
            moviesContainer.innerHTML = `<p class="error-message">No Telugu movies found matching your ${sourceDescription}.</p>`;
            return;
        }
        
        movies.forEach(movie => {
            const movieCard = document.createElement('div');
            movieCard.classList.add('card');
            
            movieCard.dataset.movieId = movie.id; 
            
            const imagePath = movie.poster_path ? `https://image.tmdb.org/t/p/w300${movie.poster_path}` : 'https://via.placeholder.com/300x450.png?text=No+Image+Found';
            const rating = movie.vote_average ? movie.vote_average.toFixed(1) : 'N/A';
            const releaseYear = movie.release_date ? new Date(movie.release_date).getFullYear() : 'N/A';
            
            movieCard.innerHTML = `
                <img src="${imagePath}" alt="${movie.title} Poster">
                <div class="info">
                    <h3>${movie.title}</h3>
                    <p>${releaseYear} | ⭐ ${rating}</p>
                </div>
            `;
            moviesContainer.appendChild(movieCard);
        });
        
        document.querySelectorAll('.card').forEach(card => {
            card.addEventListener('click', (event) => {
                if (!event.currentTarget.classList.contains('similar-movie-card')) {
                    const movieId = card.dataset.movieId;
                    fetchMovieDetails(movieId);
                }
            });
        });
    };
    
    // --- 2. Function to Fetch All Details (Minor Change: Removed similarResponse promise) ---
    const fetchMovieDetails = async (movieId) => {
        if (!API_KEY) return;
        
        modalContent.innerHTML = '<div class="loading-message"><p>Loading movie details...</p></div>';
        modalOverlay.style.display = 'flex'; 
        
        try {
            // Fetch all details concurrently. Removed similarResponse as it's no longer used.
            const [detailsResponse, providersResponse, videosResponse] = await Promise.all([
                fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${API_KEY}&language=en-US`),
                fetch(`https://api.themoviedb.org/3/movie/${movieId}/watch/providers?api_key=${API_KEY}`),
                fetch(`https://api.themoviedb.org/3/movie/${movieId}/videos?api_key=${API_KEY}`)
            ]);

            const detailsData = await detailsResponse.json();
            const providersData = await providersResponse.json();
            // const similarData = await similarResponse.json(); // <-- REMOVED
            const videosData = await videosResponse.json();

            // Pass null for similar data since it's not fetched
            displayModal(detailsData, providersData, null, videosData);

        } catch (error) {
            console.error('Error fetching movie details:', error);
            modalContent.innerHTML = '<div class="error-message"><p>Could not load details for this movie. Check your network or API key.</p></div>';
        }
    };

    // --- 3. Function to Display Modal (MODIFIED: Removed Similar Movies Logic/HTML) ---
    const displayModal = (details, providers, similar, videos) => {
        const rating = details.vote_average ? details.vote_average.toFixed(1) : 'N/A';
        const overview = details.overview || "Summary not available.";
        const title = details.title || "Movie Title";
        // const movieGenreIds = details.genres.map(g => g.id); // <-- REMOVED

        // --- 3a. Trailer Logic (No Change) ---
        const youtubeVideos = videos.results.filter(video => video.site === 'YouTube');
        let trailer;
        const normalize = (str) => str.toLowerCase().replace(/[^a-z0-9]/g, '');

        // 1. Try to find an official Telugu Trailer/Teaser with language code 'te'
        trailer = youtubeVideos.find(
            video => (video.type === 'Trailer' || video.type === 'Teaser') && video.iso_639_1 === 'te'
        );
        // 2. Fallback: Try to find an official Trailer/Teaser with "Telugu" in the name
        if (!trailer) {
            trailer = youtubeVideos.find(
                video => (video.type === 'Trailer' || video.type === 'Teaser') && 
                        normalize(video.name).includes('telugu')
            );
        }
        // 3. Fallback: Find the first official Trailer of any language
        if (!trailer) {
            trailer = youtubeVideos.find(
                video => video.type === 'Trailer'
            );
        }
        
        let trailerHtml;
        if (trailer) {
            const videoKey = trailer.key;
            trailerHtml = `<iframe src="https://www.youtube.com/embed/${videoKey}" title="${title} Trailer" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>`;
        } else {
            const youtubeSearchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(title + ' Telugu Trailer')}`;
            trailerHtml = `<div class="unavailable">No Trailer available from TMDB.<br><a href="${youtubeSearchUrl}" target="_blank" class="unavailable-link">Search on YouTube &rarr;</a></div>`;
        }

        // --- 3b. OTT Logic (No Change) ---
        const streaming = providers.results.IN?.flatrate || [];
        const limitedStreaming = streaming.slice(0, 3); 
        
        const ottHtml = limitedStreaming.length > 0
            ? limitedStreaming.map(p => `<span class="ott-badge">${p.provider_name}</span>`).join('')
            : `<span class="ott-badge not-available">Not currently available for streaming in India.</span>`;

        // --- 3c. Similar Movies Logic: REMOVED ---

        // --- 3d. Final Modal Content Assembly (MODIFIED: Removed Similar Movies HTML) ---
        modalContent.innerHTML = `
            <h2 class="modal-title">${title}</h2>

            <div class="modal-header-trailer">
                <div class="trailer-container">
                    ${trailerHtml}
                </div>

                <div class="modal-info-right">
                    <h3>Summary</h3>
                    <p class="summary-text">${overview}</p>

                    <div class="rating">
                        <span>⭐</span> ${rating}
                    </div>
                    
                    <h3>Where to Watch</h3>
                    <div id="ottProviders">${ottHtml}</div>
                </div>
            </div>
        `;
        
        // Re-attach click listeners to the new similar movie cards in the modal (Not needed now, but good practice to clear if they were there)
        // document.querySelectorAll('#similarMoviesContainer .similar-movie-card').forEach(card => {
        //     card.addEventListener('click', () => {
        //         const movieId = card.dataset.movieId;
        //         fetchMovieDetails(movieId); 
        //     });
        // });
    };


    // --- Core Fetch Function for Genres (No Change) ---
    const fetchMoviesByGenre = async (genreId, genreName, sortOrder) => {
        if (!API_KEY) {
            moviesContainer.innerHTML = '<p class="error-message">Please provide a valid API key.</p>';
            return;
        }
        
        const url = `https://api.themoviedb.org/3/discover/movie?api_key=${API_KEY}&with_genres=${genreId}&with_original_language=te&sort_by=${sortOrder}&primary_release_date.lte=${TODAY_DATE}`;
        
        moviesContainer.innerHTML = '<p class="loading-message">Loading real movies...</p>';
        genreTitle.textContent = `Tollywood ${genreName} Movies`;
        sortButton.style.display = 'inline-block'; 

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            displayMovies(data.results, `genre: ${genreName}`);
        } catch (error) {
            console.error('Fetching movies error:', error);
            moviesContainer.innerHTML = '<p class="error-message">Sorry, failed to load movies.</p>';
        }
    };

    // --- Search Function (No Change) ---
    const fetchSearchResults = async (query) => {
        if (!API_KEY) return;

        const url = `https://api.themoviedb.org/3/search/movie?api_key=${API_KEY}&query=${encodeURIComponent(query)}`;

        moviesContainer.innerHTML = '<p class="loading-message">Searching for movies...</p>';
        genreTitle.textContent = `Search Results for "${query}" (Tollywood)`;
        sortButton.style.display = 'none'; 

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const data = await response.json();
            
            // Filter results for Telugu language AND released today or earlier
            const filteredResults = data.results.filter(movie => 
                movie.original_language === 'te' && 
                movie.release_date && 
                movie.release_date <= TODAY_DATE
            );

            displayMovies(filteredResults, `search query: "${query}"`);
            
            genreLinks.forEach(link => link.classList.remove('active'));

        } catch (error) {
            console.error('Fetching search results error:', error);
            moviesContainer.innerHTML = '<p class="error-message">Sorry, an error occurred during the search.</p>';
        }
    };

    // --- Event Handlers (No Change) ---
    
    const handleGenreClick = (event) => {
        event.preventDefault();
        genreLinks.forEach(link => link.classList.remove('active'));
        const clickedLink = event.target;
        clickedLink.classList.add('active');
        searchInput.value = ''; 

        currentGenreId = clickedLink.dataset.genreId;
        currentGenreName = clickedLink.dataset.genreName;

        const newUrl = `${window.location.pathname}?genreId=${currentGenreId}&genreName=${currentGenreName}`;
        window.history.pushState({ path: newUrl }, '', newUrl);

        fetchMoviesByGenre(currentGenreId, currentGenreName, currentSortOrder);
    };
    
    const toggleSortOrder = () => {
        if (sortButton.style.display === 'none') return; 

        if (currentSortOrder === 'primary_release_date.desc') {
            currentSortOrder = 'primary_release_date.asc'; // Oldest First
            sortButton.textContent = 'Sort: Oldest First';
        } else {
            currentSortOrder = 'primary_release_date.desc'; // Newest First
            sortButton.textContent = 'Sort: Newest First';
        }
        fetchMoviesByGenre(currentGenreId, currentGenreName, currentSortOrder);
    };
    
    const performSearch = () => {
        const query = searchInput.value.trim();
        if (query) {
            // When searching, we want to search within the currently selected genre
            fetchSearchResults(query, currentGenreId);
        } else {
            // If search is cleared, fetch the genre movies again
            fetchMoviesByGenre(currentGenreId, currentGenreName, currentSortOrder);
        }
    };


    // Initialization and Event Listeners

    genreLinks.forEach(link => {
        link.addEventListener('click', handleGenreClick);
    });

    searchButton.addEventListener('click', performSearch);
    searchInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') performSearch();
    });

    
    sortButton.addEventListener('click', toggleSortOrder);

    closeModalBtn.addEventListener('click', () => {
        modalOverlay.style.display = 'none';
    });

    modalOverlay.addEventListener('click', (e) => {
        if (e.target === modalOverlay) {
            modalOverlay.style.display = 'none';
        }
    });
    
    // Initial Load Logic
    const urlParams = new URLSearchParams(window.location.search);
    const genreParamId = urlParams.get('genreId');
    const genreParamName = urlParams.get('genreName');

    if (genreParamId && genreParamName) {
        currentGenreId = genreParamId;
        currentGenreName = genreParamName;
        const activeLink = Array.from(genreLinks).find(link => link.dataset.genreId === currentGenreId);
        if (activeLink) {
            activeLink.classList.add('active');
        } else {
            genreLinks[0].classList.add('active');
        }
        fetchMoviesByGenre(currentGenreId, currentGenreName, currentSortOrder);
    } else {
        genreLinks[0].classList.add('active');
        fetchMoviesByGenre(currentGenreId, currentGenreName, currentSortOrder); 
    }
});