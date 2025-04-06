/**
 * Platform Hit Songs by Genre Visualization
 * This script creates a parallel sets visualization to show platform-genre distribution
 */

// Set up dimensions and margins - increase width and margins to accommodate labels
const margin = { top: 60, right: 400, bottom: 50, left: 120 };
const width = 1600 - margin.left - margin.right;
const height = 1000 - margin.top - margin.bottom;

// Create SVG container
const svg = d3.select("#sankey-chart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .attr("overflow", "visible")
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// Create a tooltip div
const tooltip = d3.select("body")
    .append("div")
    .attr("class", "tooltip")
    .style("opacity", 0);

// Define colors for platforms
const platformColors = {
    "Spotify": "#1DB954",
    "YouTube": "#FF0000",
    "TikTok": "#000000",
    "Apple Music": "#FC3C44",
    "SiriusXM": "#0033A0",
    "Deezer": "#FF0092",
    "Amazon": "#00A8E1",
    "Pandora": "#3668FF",
    "Shazam": "#08F"
};

// Global variables to store the data and current filter state
let originalData;
let processedData;
let selectedPlatform = null;
let selectedGenre = null;
let showTopPerformersOnly = false; // New variable for top performers filter
let minPlatformThreshold = 3; // Number of platforms a genre must be popular on

// Function to handle errors
function handleError(error) {
    console.error("Error loading or processing data:", error);
    d3.select("#sankey-chart").html("<p class='error'>Error loading or processing data. Please check the console for details.</p>");
}

// Load and process data
console.log("Starting to load CSV data");
loadCsvData().then(data => {
    console.log("Data loaded successfully:", data.length, "songs");
    originalData = data;
    
    try {
        // Process data for parallel sets
        processedData = processDataForParallelSets(data);
        
        // Create filter controls first so they appear at the top
        createFilterControls(processedData);
        
        // Render the parallel sets visualization
        try {
            renderParallelSets(processedData);
        } catch (renderError) {
            console.error("Error rendering visualization:", renderError);
            d3.select("#sankey-chart").html("<p class='error'>Error rendering visualization. Please check the console for details.</p>");
        }
    } catch (error) {
        handleError(error);
    }
}).catch(handleError);

// Function to process data for parallel sets visualization
function processDataForParallelSets(data) {
    // Group the data by platform and genre
    const platformGenreCounts = {};
    
    // List of platforms and genres
    const platforms = ["Spotify", "YouTube", "TikTok", "Apple Music", "SiriusXM", "Deezer", "Amazon", "Pandora", "Shazam"];
    const genres = new Set();
    
    // Platform totals and genre totals
    const platformTotals = {};
    const genreTotals = {};
    
    // Initialize platform totals
    platforms.forEach(platform => {
        platformTotals[platform] = 0;
    });
    
    // Count songs by platform and genre
    data.forEach(song => {
        const genre = song.track_genre || "Unknown";
        genres.add(genre);
        
        // Initialize genre total if not exists
        if (!genreTotals[genre]) {
            genreTotals[genre] = 0;
        }
        
        platforms.forEach(platform => {
            // Check if this song is a hit on this platform
            const isHit = platform === "Apple Music" ? 
                song["Apple Music_Hit"] === true : 
                song[`${platform}_Hit`] === true;
            
            if (isHit) {
                const key = `${platform}-${genre}`;
                platformGenreCounts[key] = (platformGenreCounts[key] || 0) + 1;
                platformTotals[platform]++;
                genreTotals[genre]++;
            }
        });
    });
    
    return {
        platforms,
        genres: Array.from(genres).sort(),
        counts: platformGenreCounts,
        platformTotals,
        genreTotals,
        totalHits: Object.values(platformTotals).reduce((a, b) => a + b, 0)
    };
}

// Function to create filter controls
function createFilterControls(data) {
    // Create filter container positioned at the top of the page as a title bar
    const filterContainer = d3.select("body")
        .insert("div", ":first-child")
        .attr("class", "filter-container");
    
    // Title element
    filterContainer.append("h2")
        .text("Platform to Genre Hit Songs")
        .style("margin", "0 20px 0 0")
        .style("font-size", "18px")
        .style("white-space", "nowrap");
    
    // Create platform filter
    const platformFilter = filterContainer.append("div")
        .attr("class", "filter");
    
    platformFilter.append("h4")
        .text("Filter by Platform");
    
    const platformSelect = platformFilter.append("select")
        .attr("id", "platform-filter")
        .on("change", function() {
            selectedPlatform = this.value === "all" ? null : this.value;
            renderParallelSets(processedData);
        });
    
    platformSelect.append("option")
        .attr("value", "all")
        .text("All Platforms");
    
    data.platforms.forEach(platform => {
        platformSelect.append("option")
            .attr("value", platform)
            .text(platform);
    });
    
    // Create genre filter
    const genreFilter = filterContainer.append("div")
        .attr("class", "filter");
    
    genreFilter.append("h4")
        .text("Filter by Genre");
    
    const genreSelect = genreFilter.append("select")
        .attr("id", "genre-filter")
        .on("change", function() {
            selectedGenre = this.value === "all" ? null : this.value;
            renderParallelSets(processedData);
        });
    
    genreSelect.append("option")
        .attr("value", "all")
        .text("All Genres");
    
    // Get all genres with at least one connection and sort alphabetically
    const connectedGenres = [...data.genres].filter(genre => 
        data.genreTotals[genre] > 0
    ).sort((a, b) => a.localeCompare(b));
    
    connectedGenres.forEach(genre => {
        genreSelect.append("option")
            .attr("value", genre)
            .text(`${genre} (${data.genreTotals[genre]})`);
    });
    
    // Add reset button
    filterContainer.append("button")
        .attr("id", "reset-filters")
        .text("Reset Filters")
        .on("click", function() {
            selectedPlatform = null;
            selectedGenre = null;
            showTopPerformersOnly = false;
            minPlatformThreshold = 3;
            d3.select("#platform-filter").property("value", "all");
            d3.select("#genre-filter").property("value", "all");
            renderParallelSets(processedData);
        });
}

// Function to handle label overlapping by placing labels on staggered lines with connectors
function handleLabelOverlap(labels, itemPositions, minSpacing = 22) {
    // First pass: detect overlaps
    const labelData = labels.data()
        .map((d, i) => {
            // Make sure d exists and itemPositions[d] exists
            if (!d || !itemPositions[d]) {
                console.warn(`Missing data or position for label ${i}`, d);
                return null;
            }
            
            return {
                data: d,
                text: d,
                origY: itemPositions[d].y0 + itemPositions[d].height / 2,
                barY: itemPositions[d].y0 + itemPositions[d].height / 2, // Store original bar center position
                height: itemPositions[d].height,
                width: 0, // Will be calculated
                index: i,
                hasHits: itemPositions[d].total > 0,
                // Additional properties for label positioning
                level: 0, // Stagger level (0 = closest to bar)
                needsLine: false // Whether this label needs a connector line
            };
        })
        .filter(item => item !== null) // Remove any null items
        .sort((a, b) => a.origY - b.origY);
    
    // Measure actual text widths to determine spacing needs
    const tempText = d3.select('body').append('svg').append('text');
    labelData.forEach(label => {
        tempText.text(label.text);
        const bbox = tempText.node().getBBox();
        label.width = bbox.width;
        label.height = Math.max(bbox.height, 18); // Ensure minimum height
    });
    tempText.remove();
    
    // Set starting positions based on bar centers
    labelData.forEach(label => {
        label.newY = label.origY;
    });
    
    // Organize labels into levels based on vertical proximity
    const levelSpacing = 24; // Increase vertical spacing between levels
    const xOffsetPerLevel = 25; // Increase horizontal offset per level
    const maxLevel = 5; // Maximum number of stagger levels
    
    // First pass - create initial level assignments
    for (let i = 0; i < labelData.length; i++) {
        // Skip if we've already determined this label needs adjustment
        if (labelData[i].needsLine) continue;
        
        // Check overlap with all following labels
        for (let j = i + 1; j < labelData.length; j++) {
            const label1 = labelData[i];
            const label2 = labelData[j];
            
            // Skip if the second label is already at a different level
            if (label2.level !== label1.level) continue;
            
            // Calculate vertical spacing between labels
            const spacing = Math.abs(label1.newY - label2.newY);
            
            // If two labels are too close together
            if (spacing < minSpacing) {
                // Move the second label to the next level
                label2.level = (label2.level + 1) % maxLevel;
                label2.needsLine = true;
                
                // Adjust positions of all levels to maintain consistent spacing
                // Shift this label slightly to make room for the connector line
                label2.newY = label2.origY + (label2.level * 3);
            }
        }
    }
    
    // Second pass - check for overlaps between labels at different levels
    let levelGroups = {};
    labelData.forEach(label => {
        if (!levelGroups[label.level]) levelGroups[label.level] = [];
        levelGroups[label.level].push(label);
    });
    
    // Sort labels by Y position within each level
    Object.values(levelGroups).forEach(group => {
        group.sort((a, b) => a.origY - b.origY);
        
        // Now adjust positions to ensure minimum spacing within each level
        let prevY = -Infinity;
        let prevHeight = 0;
        
        group.forEach(label => {
            const minY = prevY + prevHeight / 2 + minSpacing;
            
            if (label.newY < minY) {
                // If label would overlap with previous, move it down
                label.newY = minY;
            }
            
            prevY = label.newY;
            prevHeight = label.height;
        });
    });
    
    return labelData;
}

// Function to render the parallel sets visualization
function renderParallelSets(data) {
    // Clear previous content
    svg.selectAll("*").remove();
    
    const { platforms, genres, counts, platformTotals, genreTotals, totalHits } = data;
    
    // Calculate dimensions - increase bar width for better visibility
    const dimensionGap = width / 2;
    const baseBarWidth = 40; // Base width for genre bars
    
    // Calculate the total height needed for the visualization
    // Using the genre axis height to control both axes for consistency
    const genreTotalHeight = height * 0.85; // Reduce from 0.90 to use less of the height
    
    // Sort platforms by total hits (descending)
    const sortedPlatforms = [...platforms].sort((a, b) => platformTotals[b] - platformTotals[a]);
    
    // Calculate which genres appear on multiple platforms (for star ratings)
    const genrePlatformCounts = {};
    genres.forEach(genre => {
        genrePlatformCounts[genre] = 0;
        platforms.forEach(platform => {
            if (counts[`${platform}-${genre}`] > 0) {
                genrePlatformCounts[genre]++;
            }
        });
    });
    
    // Filter genres - if no specific filter is applied, limit to top 15 genres for better visibility
    let filteredGenres = [...genres];
    if (!selectedGenre && !selectedPlatform) {
        // If no filters are applied, show only top 15 genres by default
        filteredGenres = genres
            .sort((a, b) => genreTotals[b] - genreTotals[a])
            .slice(0, 15);
    } else if (selectedPlatform) {
        // If platform filter is applied, show genres that appear on that platform
        filteredGenres = genres.filter(genre => 
            counts[`${selectedPlatform}-${genre}`] > 0
        );
    }
    
    // Sort genres by total hits (descending)
    // Only include genres that have at least one connection/hit and pass the filters
    const sortedGenres = filteredGenres
        .filter(genre => genreTotals[genre] > 0)
        .sort((a, b) => genreTotals[b] - genreTotals[a]);
    
    // Create an index-based mapping for genres to ensure consistent ordering
    const genreIndices = {};
    sortedGenres.forEach((genre, index) => {
        genreIndices[genre] = index;
    });
    
    // Add a message if no genres match the filter criteria
    if (sortedGenres.length === 0) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", 100)
            .attr("text-anchor", "middle")
            .attr("font-size", "18px")
            .text("No genres match the current filter criteria");
        return;
    }
    
    // Calculate positions for genres first
    const genrePositions = {};
    let currentGenrePos = 20; // Reduced top margin
    
    // Calculate compact spacing between genre bars based on available height
    const availableHeight = genreTotalHeight - (sortedGenres.length * 10); // minimum 10px per genre
    const minGenreSpacing = 8; // Minimum space between genres
    const genreSpacing = Math.max(minGenreSpacing, (availableHeight / sortedGenres.length) * 0.2);
    
    sortedGenres.forEach(genre => {
        // Set a reasonable minimum height for each genre bar based on importance
        const importanceFactor = genreTotals[genre] / totalHits;
        const genreHeight = Math.max(importanceFactor * genreTotalHeight * 0.8, 10);
        
        genrePositions[genre] = {
            y0: currentGenrePos,
            y1: currentGenrePos + genreHeight,
            height: genreHeight,
            total: genreTotals[genre],
            index: genreIndices[genre],
            platformCount: genrePlatformCounts[genre]
        };
        
        // Use compact spacing
        currentGenrePos += genreHeight + genreSpacing;
    });
    
    // Calculate total genre axis height for platform axis scaling
    const totalGenreAxisHeight = currentGenrePos;
    
    // Calculate positions for platforms, scale to match genre axis height
    const platformPositions = {};
    let currentPlatformPos = 0;
    const platformScale = totalGenreAxisHeight / (sortedPlatforms.reduce((a, b) => a + platformTotals[b], 0) || 1);
    
    // Find max platform total to scale bar widths
    const maxPlatformTotal = Math.max(...Object.values(platformTotals));
    
    sortedPlatforms.forEach(platform => {
        // Increase minimum platform bar height for better visibility
        const platformHeight = Math.max(platformTotals[platform] * platformScale, 15);
        
        // Calculate platform bar width based on proportion of hits
        const widthScale = platformTotals[platform] / maxPlatformTotal;
        const platformWidth = Math.max(baseBarWidth * widthScale, baseBarWidth * 0.3);
        
        platformPositions[platform] = {
            y0: currentPlatformPos,
            y1: currentPlatformPos + platformHeight,
            height: platformHeight,
            width: platformWidth,
            total: platformTotals[platform]
        };
        currentPlatformPos += platformHeight + 2; // Add small spacing between platform bars
    });
    
    // Create a lookup object for the adjusted genre label positions
    const genreLabelPositions = {};
    
    // Calculate ribbon positions and paths
    const ribbons = [];
    
    // Initialize genre connection tracking
    const genreConnectionsMap = {};
    sortedGenres.forEach(genre => {
        genreConnectionsMap[genre] = {
            currentY: genrePositions[genre].y0,
            connections: []
        };
    });
    
    // First pass: collect all connections
    sortedPlatforms.forEach(platform => {
        const platPos = platformPositions[platform];
        let platformRunningY = platPos.y0;
        
        // Get all genres connected to this platform
        const platformGenres = sortedGenres.filter(genre => counts[`${platform}-${genre}`] > 0)
            .sort((a, b) => counts[`${platform}-${b}`] - counts[`${platform}-${a}`]);
        
        platformGenres.forEach(genre => {
            const count = counts[`${platform}-${genre}`];
            if (count > 0) {
                const ribbonHeight = (count / platformTotals[platform]) * platPos.height;
                
                genreConnectionsMap[genre].connections.push({
                    platform,
                    count,
                    platformY0: platformRunningY,
                    platformY1: platformRunningY + ribbonHeight,
                    ribbonHeight
                });
                
                platformRunningY += ribbonHeight;
            }
        });
    });
    
    // Second pass: create ribbons with proper positioning
    Object.entries(genreConnectionsMap).forEach(([genre, data]) => {
        const genrePos = genrePositions[genre];
        let genreRunningY = genrePos.y0;
        
        // Sort connections to ensure consistent flow
        const sortedConnections = [...data.connections].sort((a, b) => {
            return platformTotals[b.platform] - platformTotals[a.platform];
        });
        
        sortedConnections.forEach(conn => {
            const ribbonGenreHeight = (conn.count / genreTotals[genre]) * genrePos.height;
            
            ribbons.push({
                platform: conn.platform,
                genre: genre,
                count: conn.count,
                source: {
                    y0: conn.platformY0,
                    y1: conn.platformY1,
                    x: 0
                },
                target: {
                    y0: genreRunningY,
                    y1: genreRunningY + ribbonGenreHeight,
                    x: dimensionGap
                },
                isHighlighted: isRibbonHighlighted(conn.platform, genre)
            });
            
            genreRunningY += ribbonGenreHeight;
        });
    });
    
    // Helper function to check if a ribbon should be highlighted based on current filters
    function isRibbonHighlighted(platform, genre) {
        if (!selectedPlatform && !selectedGenre) return true;
        if (selectedPlatform && selectedGenre) {
            return platform === selectedPlatform && genre === selectedGenre;
        }
        return (selectedPlatform && platform === selectedPlatform) || 
               (selectedGenre && genre === selectedGenre);
    }
    
    // Draw platform bars
    const platformBars = svg.append("g")
        .attr("class", "platforms")
        .selectAll("rect")
        .data(sortedPlatforms)
        .enter()
        .append("rect")
        .attr("x", 0)
        .attr("y", d => platformPositions[d].y0)
        .attr("width", d => platformPositions[d].width) // Use platform-specific width
        .attr("height", d => platformPositions[d].height)
        .attr("fill", d => {
            // If platform is selected or no selection, use normal color
            if (!selectedPlatform || d === selectedPlatform) {
                return platformColors[d] || "#ccc";
            }
            // Otherwise, use muted color
            return d3.color(platformColors[d] || "#ccc").copy({opacity: 0.3});
        })
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
                <h4>${d}</h4>
                <p>Hit Songs: ${platformTotals[d]}</p>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event, d) {
            if (selectedPlatform === d) {
                selectedPlatform = null;
                d3.select("#platform-filter").property("value", "all");
            } else {
                selectedPlatform = d;
                d3.select("#platform-filter").property("value", d);
            }
            renderParallelSets(processedData);
        });
    
    // Draw platform labels
    const platformLabels = svg.append("g")
        .attr("class", "platform-labels")
        .selectAll("text")
        .data(sortedPlatforms)
        .enter()
        .append("text")
        .attr("x", -10)
        .attr("y", d => platformPositions[d].y0 + platformPositions[d].height / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "end")
        .text(d => d)
        .attr("fill", d => {
            const color = d3.rgb(platformColors[d] || "#ccc").darker(0.5);
            if (!selectedPlatform || d === selectedPlatform) {
                return color;
            }
            return d3.color(color).copy({opacity: 0.3});
        })
        .style("cursor", "pointer")
        .on("click", function(event, d) {
            if (selectedPlatform === d) {
                selectedPlatform = null;
                d3.select("#platform-filter").property("value", "all");
            } else {
                selectedPlatform = d;
                d3.select("#platform-filter").property("value", d);
            }
            renderParallelSets(processedData);
        });
    
    // Draw genre bars
    const genreBars = svg.append("g")
        .attr("class", "genres")
        .attr("transform", `translate(${dimensionGap}, 0)`)
        .selectAll("rect")
        .data(sortedGenres)
        .enter()
        .append("rect")
        .attr("id", d => `genre-bar-${d.replace(/\s+/g, '-').toLowerCase()}`)
        .attr("x", 0)
        .attr("y", d => genrePositions[d].y0)
        .attr("width", baseBarWidth)
        .attr("height", d => genrePositions[d].height)
        .attr("data-platforms", d => genrePlatformCounts[d] >= 6 ? "high" : 
                                    (genrePlatformCounts[d] >= 4 ? "medium" : "low"))
        .attr("fill", d => {
            const baseColor = "#aaa";
            
            if (!selectedGenre || d === selectedGenre) {
                return baseColor;
            }
            return d3.color(baseColor).copy({opacity: 0.3});
        })
        .attr("stroke", d => {
            if (genrePlatformCounts[d] >= 7) return "#ffd700"; // Gold
            if (genrePlatformCounts[d] >= 5) return "#c0c0c0"; // Silver
            return "#666";
        })
        .attr("stroke-width", d => genrePlatformCounts[d] >= 5 ? 1.5 : 0.5)
        .on("mouseover", function(event, d) {
            tooltip.transition().duration(200).style("opacity", 0.9);
            
            // Calculate which platforms this genre appears on
            const platformsWithGenre = platforms.filter(platform => 
                counts[`${platform}-${d}`] > 0
            );
            
            // Create a list of platforms for the tooltip
            const platformList = platformsWithGenre
                .sort((a, b) => counts[`${b}-${d}`] - counts[`${a}-${d}`])
                .map(platform => 
                    `<li><span style="color:${platformColors[platform]}">●</span> ${platform}: ${counts[`${platform}-${d}`]} hits</li>`
                )
                .join('');
            
            tooltip.html(`
                <h4>${d}</h4>
                <p>Total Hit Songs: <strong>${genreTotals[d]}</strong></p>
                <p>Popular on <strong>${genrePlatformCounts[d]}</strong> platforms:</p>
                <ul class="platform-list">
                    ${platformList}
                </ul>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function() {
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event, d) {
            if (selectedGenre === d) {
                selectedGenre = null;
                d3.select("#genre-filter").property("value", "all");
            } else {
                selectedGenre = d;
                d3.select("#genre-filter").property("value", d);
            }
            renderParallelSets(processedData);
        });
    
    // Add small text labels inside bars for easier identification
    svg.append("g")
        .attr("class", "genre-bar-labels")
        .attr("transform", `translate(${dimensionGap}, 0)`)
        .selectAll("text")
        .data(sortedGenres)
        .enter()
        .append("text")
        .attr("x", baseBarWidth / 2)
        .attr("y", d => genrePositions[d].y0 + genrePositions[d].height / 2)
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(d => d.substring(0, 3))
        .attr("font-size", "9px")
        .attr("fill", "#fff")
        .style("pointer-events", "none");
        
    // Add platform count indicators next to genre names
    const genreLabels = svg.append("g")
        .attr("class", "genre-labels");

    // Create a temporary SVG element for label measurement that will be properly removed
    const tempSvg = d3.select("body").append("svg")
        .attr("width", 0)
        .attr("height", 0)
        .style("visibility", "hidden");
    
    const tempGroup = tempSvg.append("g");
    const tempLabels = tempGroup.selectAll("text")
        .data(sortedGenres)
        .enter()
        .append("text")
        .text(d => d);

    // First get label positions with anti-collision detection
    const genreLabelData = handleLabelOverlap(
        tempLabels, 
        genrePositions, 
        20 // Increase minimum spacing between labels
    );
    
    // Remove the temporary SVG
    tempSvg.remove();

    // Container for connector lines (render these first so they're behind the labels)
    const connectorLines = genreLabels.append("g")
        .attr("class", "connector-lines");

    // Create connector lines for labels that need them
    genreLabelData.forEach(label => {
        // Always create connector lines for all genres
        connectorLines.append("path")
            .attr("class", `connector-${label.data.replace(/\s+/g, '-').toLowerCase()}`) // Add class based on genre name
            .attr("d", `
                M ${dimensionGap + baseBarWidth} ${genrePositions[label.data].y0 + genrePositions[label.data].height / 2}
                L ${dimensionGap + baseBarWidth + 5 + ((label.level || 0) * 25)} ${label.newY}
            `)
            .attr("stroke", "#555")
            .attr("stroke-width", 1.2)
            .attr("stroke-dasharray", "3,2")
            .attr("fill", "none")
            .attr("opacity", 0.8);
    });

    // Create text labels with staggered positioning
    genreLabels.selectAll("text")
        .data(sortedGenres)
        .enter()
        .append("text")
        .attr("class", d => `genre-label-${d.replace(/\s+/g, '-').toLowerCase()}`) // Add class based on genre name
        .attr("x", d => {
            const labelInfo = genreLabelData.find(l => l.data === d);
            return dimensionGap + baseBarWidth + 10 + ((labelInfo && labelInfo.level) ? labelInfo.level * 25 : 0);
        })
        .attr("y", d => {
            const labelInfo = genreLabelData.find(l => l.data === d);
            return labelInfo ? labelInfo.newY : genrePositions[d].y0 + genrePositions[d].height / 2;
        })
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(d => d)
        .attr("fill", d => {
            const baseColor = "#333";
            
            if (!selectedGenre || d === selectedGenre) {
                return baseColor;
            }
            return d3.color(baseColor).copy({opacity: 0.3});
        })
        .style("cursor", "pointer")
        .style("font-weight", d => d === selectedGenre ? "bold" : "normal")
        .style("font-size", "13px") // Slightly larger font
        .on("mouseover", function(event, d) {
            // Highlight this genre's bar
            svg.selectAll(".genres rect")
                .filter(genre => genre === d)
                .attr("stroke", "#000")
                .attr("stroke-width", 2);
                
            // Highlight ribbons connected to this genre
            svg.selectAll(".ribbons path")
                .filter(ribbon => ribbon.genre === d)
                .attr("opacity", 0.9);
                
            // Highlight the connector line if exists
            svg.selectAll(`.connector-${d.replace(/\s+/g, '-').toLowerCase()}`)
                .attr("opacity", 1)
                .attr("stroke", "#000")
                .attr("stroke-width", 1.5)
                .attr("stroke-dasharray", "3,3");
                
            d3.select(this)
                .attr("font-weight", "bold")
                .attr("fill", "#000");
                
            // Show tooltip with count information
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
                <h4>${d}</h4>
                <p>Hit Songs: ${genreTotals[d]}</p>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            // Restore normal appearance
            svg.selectAll(".genres rect")
                .filter(genre => genre === d)
                .attr("stroke", "none");
                
            // Return ribbons to original opacity
            svg.selectAll(".ribbons path")
                .filter(ribbon => ribbon.genre === d)
                .attr("opacity", ribbon => ribbon.isHighlighted ? 0.7 : 0.15);
                
            // Restore connector line appearance
            svg.selectAll(`.connector-${d.replace(/\s+/g, '-').toLowerCase()}`)
                .attr("opacity", 0.6)
                .attr("stroke", "#999")
                .attr("stroke-width", 1)
                .attr("stroke-dasharray", "2,2");
                
            d3.select(this)
                .attr("font-weight", d === selectedGenre ? "bold" : "normal");
                
            tooltip.transition().duration(500).style("opacity", 0);
        })
        .on("click", function(event, d) {
            if (selectedGenre === d) {
                selectedGenre = null;
                d3.select("#genre-filter").property("value", "all");
            } else {
                selectedGenre = d;
                d3.select("#genre-filter").property("value", d);
            }
            renderParallelSets(processedData);
        });
    
    // Add platform count indicators next to genre names
    genreLabels.selectAll(".platform-count")
        .data(sortedGenres)
        .enter()
        .append("text")
        .attr("class", "platform-count")
        .attr("x", d => {
            const labelInfo = genreLabelData.find(l => l.data === d);
            return dimensionGap + baseBarWidth + 10 + ((labelInfo && labelInfo.level) ? labelInfo.level * 25 : 0) + 
                  d.length * 6 + 10; // Position after the genre name
        })
        .attr("y", d => {
            const labelInfo = genreLabelData.find(l => l.data === d);
            return labelInfo ? labelInfo.newY : genrePositions[d].y0 + genrePositions[d].height / 2;
        })
        .attr("dy", "0.35em")
        .attr("text-anchor", "start")
        .text(d => {
            if (genrePlatformCounts[d] >= 7) return " ★★★"; // Triple star for 7-9 platforms
            if (genrePlatformCounts[d] >= 5) return " ★★";  // Double star for 5-6 platforms
            if (genrePlatformCounts[d] >= 3) return " ★";   // Single star for 3-4 platforms
            return "";
        })
        .attr("fill", d => {
            if (genrePlatformCounts[d] >= 7) return "#ffd700"; // Gold
            if (genrePlatformCounts[d] >= 5) return "#c0c0c0"; // Silver
            if (genrePlatformCounts[d] >= 3) return "#b87333"; // Bronze
            return "#999";
        })
        .attr("font-size", "10px");
    
    // Create a custom ribbon generator with Bezier curves
    function ribbonPath(d) {
        const sx = d.source.x;
        const tx = d.target.x;
        const sy0 = d.source.y0;
        const sy1 = d.source.y1;
        const ty0 = d.target.y0;
        const ty1 = d.target.y1;
        
        // Use Bezier curves for smoother flow
        const sourceWidth = platformPositions[d.platform].width || baseBarWidth;
        const targetWidth = baseBarWidth;
        const sourceCenter = (sy0 + sy1) / 2;
        const targetCenter = (ty0 + ty1) / 2;
        
        // Calculate control points for the Bezier curves
        const dx = tx - (sx + sourceWidth);
        const controlX1 = sx + sourceWidth + dx * 0.2;
        const controlX2 = tx - dx * 0.2;
        
        // Path with Bezier curves
        return `
            M ${sx + sourceWidth} ${sy0}
            C ${controlX1} ${sy0}, ${controlX2} ${ty0}, ${tx} ${ty0}
            L ${tx} ${ty1}
            C ${controlX2} ${ty1}, ${controlX1} ${sy1}, ${sx + sourceWidth} ${sy1}
            Z
        `;
    }
    
    // Draw ribbons
    svg.append("g")
        .attr("class", "ribbons")
        .selectAll("path")
        .data(ribbons)
        .enter()
        .append("path")
        .attr("d", ribbonPath)
        .attr("fill", d => platformColors[d.platform] || "#ccc")
        .attr("opacity", d => d.isHighlighted ? 0.7 : 0.15)
        .attr("stroke", d => d3.rgb(platformColors[d.platform] || "#ccc").darker(0.2))
        .attr("stroke-width", 0.5)
        .attr("stroke-opacity", d => d.isHighlighted ? 1 : 0.1)
        .on("mouseover", function(event, d) {
            // Highlight this ribbon
            d3.select(this).attr("opacity", 0.9);
            
            // Highlight platform
            svg.selectAll(".platforms rect")
                .filter(platform => platform === d.platform)
                .attr("stroke", "#000")
                .attr("stroke-width", 2);
            
            // Highlight the genre bar and label
            svg.selectAll(".genres rect")
                .filter(genre => genre === d.genre)
                .attr("stroke", "#000")
                .attr("stroke-width", 2);
                
            svg.selectAll(".genre-bar-labels text")
                .filter(genre => genre === d.genre)
                .attr("font-weight", "bold")
                .attr("stroke-width", 5);
            
            // Show tooltip with detailed information
            tooltip.transition().duration(200).style("opacity", 0.9);
            tooltip.html(`
                <h4>${d.platform} → ${d.genre}</h4>
                <p>Hit Songs: ${d.count}</p>
                <p>${(d.count / platformTotals[d.platform] * 100).toFixed(1)}% of ${d.platform}'s hits</p>
                <p>${(d.count / genreTotals[d.genre] * 100).toFixed(1)}% of ${d.genre}'s hits</p>
            `)
                .style("left", (event.pageX + 10) + "px")
                .style("top", (event.pageY - 28) + "px");
        })
        .on("mouseout", function(event, d) {
            // Restore normal appearance
            d3.select(this).attr("opacity", d.isHighlighted ? 0.7 : 0.15);
            
            svg.selectAll(".platforms rect")
                .filter(platform => platform === d.platform)
                .attr("stroke", "none");
            
            svg.selectAll(".genres rect")
                .filter(genre => genre === d.genre)
                .attr("stroke", "none");
                
            svg.selectAll(".genre-bar-labels text")
                .filter(genre => genre === d.genre)
                .attr("font-weight", "normal")
                .attr("stroke-width", 4);
                
            tooltip.transition().duration(500).style("opacity", 0);
        });

    // Add explanatory text for default view
    if (!selectedGenre && !selectedPlatform) {
        svg.append("text")
            .attr("x", width / 2)
            .attr("y", height - 20)
            .attr("text-anchor", "middle")
            .attr("font-size", "14px")
            .attr("fill", "#666")
            .text("Showing top 15 genres by hit count. Use filters to see specific genres or platforms.");
    }

    // Add legend for platform count stars - position it at the top right of the chart area
    const legend = svg.append("g")
        .attr("class", "legend")
        .attr("transform", `translate(${width - 150}, 10)`); // Position at top right

    // Title
    legend.append("text")
        .attr("x", 0)
        .attr("y", 0)
        .attr("text-anchor", "start")
        .attr("font-size", "12px")
        .attr("font-weight", "bold")
        .text("Cross-Platform Success");

    // Legend items
    const legendItems = [
        { text: "7-9 platforms", symbol: "★★★", color: "#ffd700" },
        { text: "5-6 platforms", symbol: "★★", color: "#c0c0c0" },
        { text: "3-4 platforms", symbol: "★", color: "#b87333" }
    ];

    legendItems.forEach((item, i) => {
        const legendItem = legend.append("g")
            .attr("transform", `translate(0, ${20 + i * 20})`);
        
        legendItem.append("text")
            .attr("x", 0)
            .attr("y", 0)
            .attr("text-anchor", "start")
            .attr("font-size", "10px")
            .attr("fill", item.color)
            .text(item.symbol);
        
        legendItem.append("text")
            .attr("x", 40)
            .attr("y", 0)
            .attr("text-anchor", "start")
            .attr("font-size", "10px")
            .text(item.text);
    });
} 