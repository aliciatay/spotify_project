/**
 * Load and parse CSV data for the Sankey diagram
 */

// Function to load the CSV data
function loadCsvData() {
    console.log("Loading CSV data...");
    
    return d3.csv("final_df_cleaned.csv")
        .then(data => {
            console.log(`Loaded CSV with ${data.length} rows`);
            
            // Transform the data
            const transformedData = data.map(row => {
                // Convert boolean strings to actual booleans
                const hitColumns = [
                    'Spotify_Hit', 'YouTube_Hit', 'TikTok_Hit', 'Apple Music_Hit', 
                    'SiriusXM_Hit', 'Deezer_Hit', 'Amazon_Hit', 'Pandora_Hit', 'Shazam_Hit'
                ];
                
                hitColumns.forEach(col => {
                    // Convert "True"/"False" strings to booleans
                    row[col] = row[col] === "True";
                });
                
                return row;
            });
            
            console.log("Data transformation complete");
            return transformedData;
        })
        .catch(error => {
            console.error("Error loading CSV data:", error);
            throw error;
        });
}

// Function to get unique genres from the dataset
function getGenres(data) {
    const genres = new Set();
    data.forEach(song => {
        if (song.track_genre) {
            genres.add(song.track_genre);
        }
    });
    return Array.from(genres).sort();
} 