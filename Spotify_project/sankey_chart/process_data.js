/**
 * Process data for Sankey diagram
 * This script transforms the Spotify dataset into the format needed for a Sankey diagram
 */

// Function to process the data from the Spotify dataset
function processDataForSankey(data) {
    console.log("Starting to process data for Sankey diagram");
    
    // Lists to store the unique nodes and links
    const genres = new Set();
    const platforms = ["Spotify", "YouTube", "TikTok", "Apple Music", "SiriusXM", "Deezer", "Amazon", "Pandora", "Shazam"];
    
    // Map to store genre-platform combinations and their counts
    const genrePlatformCounts = new Map();
    
    // Count total songs to set appropriate thresholds
    let totalSongs = 0;
    
    // Process each song in the dataset
    data.forEach(song => {
        totalSongs++;
        
        // Get the genre of the song (using track_genre field)
        const genre = song.track_genre || "Unknown";
        genres.add(genre);
        
        // Check if the song is a hit on different platforms
        if (song.Spotify_Hit === true) {
            incrementCount(genrePlatformCounts, genre, "Spotify");
        }
        
        if (song.YouTube_Hit === true) {
            incrementCount(genrePlatformCounts, genre, "YouTube");
        }
        
        if (song.TikTok_Hit === true) {
            incrementCount(genrePlatformCounts, genre, "TikTok");
        }
        
        if (song["Apple Music_Hit"] === true) {
            incrementCount(genrePlatformCounts, genre, "Apple Music");
        }
        
        if (song.SiriusXM_Hit === true) {
            incrementCount(genrePlatformCounts, genre, "SiriusXM");
        }
        
        if (song.Deezer_Hit === true) {
            incrementCount(genrePlatformCounts, genre, "Deezer");
        }
        
        if (song.Amazon_Hit === true) {
            incrementCount(genrePlatformCounts, genre, "Amazon");
        }
        
        if (song.Pandora_Hit === true) {
            incrementCount(genrePlatformCounts, genre, "Pandora");
        }
        
        if (song.Shazam_Hit === true) {
            incrementCount(genrePlatformCounts, genre, "Shazam");
        }
    });
    
    console.log(`Total songs processed: ${totalSongs}`);
    console.log(`Found ${genres.size} unique genres`);
    
    // Create the Sankey-formatted data
    const sankeyData = formatForSankey(genres, platforms, genrePlatformCounts);
    return sankeyData;
}

// Helper function to increment the count for a genre-platform combination
function incrementCount(countMap, genre, platform) {
    const key = `${genre}-${platform}`;
    const currentCount = countMap.get(key) || 0;
    countMap.set(key, currentCount + 1);
}

// Function to format the data for Sankey diagram
function formatForSankey(genres, platforms, genrePlatformCounts) {
    // Create nodes array with all necessary data for each node
    const nodes = [];
    
    // Create a map to track node indices
    const nodeMap = new Map();
    let index = 0;
    
    // Add platform nodes first (source)
    platforms.forEach(platform => {
        nodes.push({ name: platform, type: "platform" });
        nodeMap.set(platform, index++);
    });
    
    // Add genre nodes second (target)
    Array.from(genres).sort().forEach(genre => {
        nodes.push({ name: genre, type: "genre" });
        nodeMap.set(genre, index++);
    });
    
    // Create links array
    const links = [];
    
    // Log total connections
    console.log(`Total genre-platform combinations: ${genrePlatformCounts.size}`);
    
    // Find the minimum threshold that will give us a reasonable number of links
    let minThreshold = 1;
    let linkCount = 0;
    
    // Count links that would pass different thresholds
    for (let threshold = 1; threshold <= 5; threshold++) {
        linkCount = 0;
        genrePlatformCounts.forEach((value) => {
            if (value >= threshold) linkCount++;
        });
        console.log(`Links with value >= ${threshold}: ${linkCount}`);
        
        // If we get a reasonable number of links, use this threshold
        if (linkCount > 0 && linkCount <= 100) {
            minThreshold = threshold;
            break;
        }
    }
    
    console.log(`Using minimum threshold of ${minThreshold} for links`);
    
    // Add links between platforms and genres (reversed direction)
    genrePlatformCounts.forEach((value, key) => {
        const [genre, platform] = key.split('-');
        
        // Skip if the count is below our threshold
        if (value < minThreshold) return;
        
        // Get the source (platform) and target (genre) indices from our nodeMap
        const sourceIndex = nodeMap.get(platform);
        const targetIndex = nodeMap.get(genre);
        
        // Only add the link if both source and target exist in our map
        if (sourceIndex !== undefined && targetIndex !== undefined) {
            // Use explicit object references instead of just indices
            links.push({
                source: sourceIndex,
                target: targetIndex,
                value: value
            });
        }
    });
    
    // Verify all links have valid source and target indices
    const validLinks = links.filter(link => {
        const sourceExists = link.source >= 0 && link.source < nodes.length;
        const targetExists = link.target >= 0 && link.target < nodes.length;
        return sourceExists && targetExists;
    });
    
    if (validLinks.length !== links.length) {
        console.warn(`Removed ${links.length - validLinks.length} invalid links`);
    }
    
    console.log(`Generated Sankey data with ${nodes.length} nodes and ${validLinks.length} links`);
    
    // Log the first few links to debug
    if (validLinks.length > 0) {
        console.log("Sample links:", validLinks.slice(0, 3));
    }
    
    return { nodes, links: validLinks };
}

// Function to filter the Sankey data by minimum popularity and/or genre
function filterSankeyData(sankeyData, minPopularity, selectedGenre) {
    // If no filters are applied, return the original data
    if (minPopularity === 0 && selectedGenre === "all") {
        return sankeyData;
    }
    
    // Clone the nodes
    const filteredNodes = [...sankeyData.nodes];
    
    // Filter links based on criteria
    const filteredLinks = sankeyData.links.filter(link => {
        // Get the source node
        const sourceIndex = typeof link.source === "number" ? link.source : link.source.index;
        const sourceNode = sankeyData.nodes[sourceIndex];
        
        // Filter by genre if specified
        if (selectedGenre !== "all" && sourceNode.type === "genre" && sourceNode.name !== selectedGenre) {
            return false;
        }
        
        // Filter by popularity (assuming value corresponds to popularity)
        if (link.value < minPopularity) {
            return false;
        }
        
        return true;
    });
    
    return { nodes: filteredNodes, links: filteredLinks };
}

// Function to get unique genres from the dataset
function getGenres(data) {
    const genres = new Set();
    data.forEach(song => {
        if (song.track_genre) {
            genres.add(song.track_genre);
        } else {
            genres.add("Unknown");
        }
    });
    return Array.from(genres).sort();
} 