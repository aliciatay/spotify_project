// Main visualization code
document.addEventListener('DOMContentLoaded', function() {
    // Define global variables
    let data = [];
    let years = [];
    let currentYearIndex = 0;
    let animationSpeed = 1000; // milliseconds between frames
    let isPlaying = false;
    let animationTimer;
    let allCountries = []; // Array to store all unique countries
    let selectedCountry = ""; // Currently selected country for highlighting
    
    // Check if compact mode is enabled (for Tableau embedding)
    const isCompactMode = window.isCompactMode || false;
    
    // Set a fixed animation speed (since we removed the slider)
    if (isCompactMode) {
        animationSpeed = 1200; // slightly slower for Tableau version
    }

    // Define color scale by region (using a more coordinated color palette)
    const regionColors = {
        "Western Europe": "#4e79a7", // Blue
        "North America and ANZ": "#59a14f", // Green
        "Latin America and Caribbean": "#f28e2c", // Orange
        "Middle East and North Africa": "#edc949", // Yellow
        "East Asia": "#e15759", // Red
        "Southeast Asia": "#76b7b2", // Teal
        "Central and Eastern Europe": "#b07aa1", // Purple
        "Commonwealth of Independent States": "#9c755f", // Brown
        "South Asia": "#bab0ab", // Gray
        "Sub-Saharan Africa": "#d37295" // Pink
    };
    
    // Default color for regions not in the mapping
    const defaultColor = "#cccccc";

    // Make sure all required DOM elements exist
    const chartElement = document.getElementById('leaderboard-chart');
    if (!chartElement) {
        console.error("Error: Could not find chart element");
        return;
    }

    // Update year display element check
    const yearDisplay = document.getElementById('year-display');
    if (!yearDisplay) {
        console.warn("Year display element not found");
    } else {
        // Make sure it has the correct initial value
        yearDisplay.textContent = "2015"; // Default starting year
    }

    // Set play button to play symbol initially and make sure there's only one
    const playButton = document.getElementById('play-button');
    if (playButton) {
        // Completely clear any previous content to avoid duplicate icons
        while (playButton.firstChild) {
            playButton.removeChild(playButton.firstChild);
        }
        
        // Set only one play icon
        playButton.textContent = "▶";
        playButton.title = "Play animation";
    }

    // Adjust margins for the larger display with more space for country names
    const margin = isCompactMode 
        ? { top: 10, right: 70, bottom: 25, left: 170 } // Further increased left margin
        : { top: 40, right: 170, bottom: 30, left: 80 };
    
    const width = chartElement.clientWidth - margin.left - margin.right;
    const height = chartElement.clientHeight - margin.top - margin.bottom;

    // Create SVG container
    const svg = d3.select('#leaderboard-chart')
        .append('svg')
        .attr('width', width + margin.left + margin.right)
        .attr('height', height + margin.top + margin.bottom)
        .append('g')
        .attr('transform', `translate(${margin.left}, ${margin.top})`);

    // Create x and y scales
    const x = d3.scaleLinear()
        .range([0, width]);

    const y = d3.scaleBand()
        .range([0, height])
        .padding(0.2);

    // Add x-axis with better formatting - cap at 8.0
    const xAxis = svg.append('g')
        .attr('class', 'axis x-axis')
        .attr('transform', `translate(0, ${height})`)
        .call(d3.axisBottom(x).tickFormat(d => d.toFixed(1)).ticks(5));

    // Add y-axis
    const yAxis = svg.append('g')
        .attr('class', 'axis y-axis');

    // Add title if not in compact mode
    if (!isCompactMode) {
        svg.append('text')
            .attr('class', 'chart-title')
            .attr('x', width / 2)
            .attr('y', -15)
            .attr('text-anchor', 'middle')
            .style('font-size', '16px')
            .style('font-weight', 'bold')
            .text('Top 20 Countries by Happiness Score');
    }

    // Function to create the color legend with four columns
    function createLegend() {
        const legendContainer = d3.select('#region-legend');
        if (!legendContainer.empty()) {
            // Clear any existing legend items
            legendContainer.html('');
            
            // Get all unique regions present in the current data
            let usedRegions = new Set();
            data.forEach(yearData => {
                yearData.countries.forEach(country => {
                    if (country.region) {
                        usedRegions.add(country.region);
                    }
                });
            });
            
            // Sort regions for consistent display
            const sortedRegions = Array.from(usedRegions).sort();
            
            // Add a legend item for each region with more compact naming
            sortedRegions.forEach(region => {
                const color = regionColors[region] || defaultColor;
                const legendItem = legendContainer.append('div')
                    .attr('class', 'legend-item');
                
                legendItem.append('div')
                    .attr('class', 'legend-color')
                    .style('background-color', color);
                
                // Display shorter region names for compact mode
                let displayName = region;
                if (isCompactMode) {
                    // Create shorter display names for regions
                    const regionMap = {
                        "Western Europe": "Western EU",
                        "North America and ANZ": "N. America",
                        "Latin America and Caribbean": "Latin Am",
                        "Middle East and North Africa": "Mid East",
                        "East Asia": "East Asia",
                        "Southeast Asia": "SE Asia",
                        "Central and Eastern Europe": "Central EU",
                        "Commonwealth of Independent States": "CIS",
                        "South Asia": "South Asia",
                        "Sub-Saharan Africa": "Africa"
                    };
                    displayName = regionMap[region] || region;
                }
                
                legendItem.append('span')
                    .attr('class', 'legend-text')
                    .text(displayName);
            });
        }
    }

    // Function to update the visualization with the current year's data
    function updateChart(yearIndex) {
        if (!data || !data.length) return;
        
        currentYearIndex = yearIndex;
        const yearData = data[yearIndex];
        
        // Update year display (simplified without label) - safely
        if (yearDisplay) {
            yearDisplay.textContent = yearData.year;
            console.log("Updated year display to:", yearData.year);
        }

        // Sort countries based on whether there's a selected country
        let countries = [...yearData.countries];
        
        // Make sure the selected country is included if it exists
        if (selectedCountry && !countries.some(c => c.country === selectedCountry)) {
            console.log("Selected country not in top countries, finding it in full data...");
            const yearFullData = allData.filter(d => d.year === yearData.year);
            const selectedCountryData = yearFullData.find(d => d.country === selectedCountry);
            
            if (selectedCountryData) {
                // Calculate the rank based on score
                const allCountriesInYear = yearFullData.sort((a, b) => b.happiness_score - a.happiness_score);
                const rank = allCountriesInYear.findIndex(d => d.country === selectedCountry) + 1;
                
                selectedCountryData.rank = rank;
                countries.push(selectedCountryData);
                console.log(`Added selected country: ${selectedCountry} with rank ${rank}`);
            } else {
                console.warn(`Selected country ${selectedCountry} not found in data for year ${yearData.year}`);
            }
        }

        if (selectedCountry) {
            countries.sort((a, b) => {
                // If a is the selected country, it comes first
                if (a.country === selectedCountry) return -1;
                // If b is the selected country, it comes first
                if (b.country === selectedCountry) return 1;
                // Otherwise, sort by score (descending)
                return b.happiness_score - a.happiness_score;
            });
        } else {
            // Default sort by score (descending)
            countries.sort((a, b) => b.happiness_score - a.happiness_score);
        }

        // Limit to top countries plus selected country (if not in top)
        const topCount = isCompactMode ? 19 : 20; // One less to make room for selected country
        if (selectedCountry) {
            const selectedIndex = countries.findIndex(d => d.country === selectedCountry);
            if (selectedIndex >= 0) {
                // If selected country is among the sorted countries
                const selectedCountryData = countries[selectedIndex];
                // Remove it from its position
                countries.splice(selectedIndex, 1);
                // Take top N-1 countries
                countries = countries.slice(0, topCount);
                // Add selected country at the beginning
                countries.unshift(selectedCountryData);
            }
        } else {
            // Just take top N
            countries = countries.slice(0, topCount + 1);
        }

        // Update y scale domain with the countries
        y.domain(countries.map(d => d.country));
        
        // Update y-axis with transition and more left padding
        yAxis.transition().duration(500)
            .call(d3.axisLeft(y).tickSizeOuter(0))
            .selectAll("text")
            .style("text-anchor", "end")
            .attr("dx", "-0.8em") // Move text further from axis
            .attr("dy", "0.15em")
            .attr("transform", "translate(-16,0)"); // Push text right (away from rank numbers)

        // Bind data to bars
        const bars = svg.selectAll('.bar')
            .data(countries, d => d.country);

        // Remove old bars
        bars.exit().remove();

        // Add new bars
        const enterBars = bars.enter()
            .append('rect')
            .attr('class', 'bar')
            .attr('y', d => y(d.country))
            .attr('height', y.bandwidth())
            .attr('fill', d => {
                // If there's a selected country, dim all other countries
                if (selectedCountry && d.country !== selectedCountry) {
                    return d3.color(regionColors[d.region] || defaultColor).darker(1);
                }
                return regionColors[d.region] || defaultColor;
            })
            .attr('opacity', d => {
                // If there's a selected country, make other countries semi-transparent
                return selectedCountry && d.country !== selectedCountry ? 0.5 : 1;
            });

        // Update all bars with transition
        enterBars.merge(bars)
            .transition()
            .duration(500)
            .attr('y', d => y(d.country))
            .attr('width', d => x(d.happiness_score))
            .attr('height', y.bandwidth())
            .attr('fill', d => {
                // If there's a selected country, dim all other countries
                if (selectedCountry && d.country !== selectedCountry) {
                    return d3.color(regionColors[d.region] || defaultColor).darker(1);
                }
                return regionColors[d.region] || defaultColor;
            })
            .attr('opacity', d => {
                // If there's a selected country, make other countries semi-transparent
                return selectedCountry && d.country !== selectedCountry ? 0.5 : 1;
            });

        // Add tooltips for each bar
        svg.selectAll('.bar')
            .on('mouseover', function(event, d) {
                d3.select(this).attr('stroke', '#333').attr('stroke-width', 1);
                
                // Create tooltip
                const tooltip = d3.select('#tooltip');
                tooltip.style('display', 'block')
                    .style('left', (event.pageX + 10) + 'px')
                    .style('top', (event.pageY - 20) + 'px')
                    .html(`
                        <strong>${d.country}</strong><br>
                        Happiness Score: ${d.happiness_score.toFixed(2)}<br>
                        Rank: ${d.rank}<br>
                        Region: ${d.region || 'N/A'}
                    `);
            })
            .on('mouseout', function() {
                d3.select(this).attr('stroke', 'none');
                d3.select('#tooltip').style('display', 'none');
            });

        // Add country labels inside bars (only in regular mode)
        if (!isCompactMode) {
            const labels = svg.selectAll('.bar-label')
                .data(countries, d => d.country);
                
            labels.exit().remove();
            
            const enterLabels = labels.enter()
                .append('text')
                .attr('class', 'bar-label')
                .attr('y', d => y(d.country) + y.bandwidth() / 2)
                .attr('dy', '0.35em')
                .style('fill', '#fff');
                
            enterLabels.merge(labels)
                .transition()
                .duration(500)
                .attr('y', d => y(d.country) + y.bandwidth() / 2)
                .attr('x', d => Math.min(x(d.happiness_score) - 5, width - 40))
                .text(d => {
                    // Only show text if there's enough space
                    return x(d.happiness_score) > 40 ? d.country : '';
                })
                .style('text-anchor', 'end')
                .style('font-size', '12px')
                .style('fill', d => {
                    // If this is the selected country, ensure label is visible
                    return d.country === selectedCountry ? '#fff' : 
                        x(d.happiness_score) > 80 ? '#fff' : 'transparent';
                });
        }

        // Add score text at end of bars
        const scoreLabels = svg.selectAll('.score-label')
            .data(countries, d => d.country);
            
        scoreLabels.exit().remove();
        
        const enterScoreLabels = scoreLabels.enter()
            .append('text')
            .attr('class', 'score-label')
            .attr('y', d => y(d.country) + y.bandwidth() / 2)
            .attr('dy', '0.35em')
            .style('fill', '#333');
            
        enterScoreLabels.merge(scoreLabels)
            .transition()
            .duration(500)
            .attr('y', d => y(d.country) + y.bandwidth() / 2)
            .attr('x', d => x(d.happiness_score) + 3) // Reduce padding to 3px
            .text(d => d.happiness_score.toFixed(1))
            .style('text-anchor', 'start')
            .style('font-size', isCompactMode ? '11px' : '11px');

        // Add rank numbers (only in compact mode)
        if (isCompactMode) {
            const rankLabels = svg.selectAll('.rank-label')
                .data(countries, d => d.country);
                
            rankLabels.exit().remove();
            
            const enterRankLabels = rankLabels.enter()
                .append('text')
                .attr('class', 'rank-label')
                .attr('y', d => y(d.country) + y.bandwidth() / 2)
                .attr('x', -25) // Move rank labels much further left
                .attr('dy', '0.35em')
                .style('text-anchor', 'end')
                .style('fill', '#666')
                .style('font-size', '10px');
                
            enterRankLabels.merge(rankLabels)
                .transition()
                .duration(500)
                .attr('y', d => y(d.country) + y.bandwidth() / 2)
                .attr('x', -25) // Ensure the rank stays far left during transitions
                .text(d => `#${d.rank}`);
        }
    }

    // Load data with better error handling
    // Try different possible paths for the CSV file
    const csvPaths = [
        './complete_world_happiness.csv',
        '../complete_world_happiness.csv',
        '/complete_world_happiness.csv',
        'complete_world_happiness.csv',
    ];

    // Store full data globally for looking up countries not in top N
    let allData = [];

    // Function to try loading from each path
    function tryLoadingData(pathIndex) {
        if (pathIndex >= csvPaths.length) {
            // All paths failed, show error
            chartElement.innerHTML = 
                `<div style="text-align: center; color: red; padding: 50px;">
                    Error loading data: Could not find CSV file. 
                    Tried paths: ${csvPaths.join(', ')}
                </div>`;
            return;
        }

        const path = csvPaths[pathIndex];
        console.log(`Trying to load CSV from: ${path}`);
        
        d3.csv(path).then(function(csvData) {
            // Success! Process the data
            if (!csvData || csvData.length === 0) {
                throw new Error("CSV file is empty or invalid");
            }

            console.log(`Successfully loaded data from ${path} with ${csvData.length} rows`);
            
            // Format data
            csvData.forEach(d => {
                d.happiness_score = +d.happiness_score;
                d.year = String(d.year);
            });

            // Get unique years
            years = [...new Set(csvData.map(d => d.year))].sort();
            console.log("Available years:", years);

            // Get all unique countries for the filter dropdown
            allCountries = [...new Set(csvData.map(d => d.country))].sort();
            
            // Populate the country dropdown
            const countrySelect = document.getElementById('country-select');
            if (countrySelect) {
                countrySelect.innerHTML = '<option value="">None (Show All)</option>';
                allCountries.forEach(country => {
                    const option = document.createElement('option');
                    option.value = country;
                    option.textContent = country;
                    countrySelect.appendChild(option);
                });

                // Add event listener for country selection
                countrySelect.addEventListener('change', function() {
                    selectedCountry = this.value;
                    updateChart(currentYearIndex);
                });
            }

            // Prepare data
            data = years.map(year => {
                const yearData = csvData.filter(d => d.year === year);
                
                // With more chart width, we can show more countries
                const topCount = isCompactMode ? 20 : 20;
                
                // Sort by happiness score (descending) and take top N
                const topCountries = yearData
                    .sort((a, b) => b.happiness_score - a.happiness_score)
                    .slice(0, topCount);
                    
                // Add rank property
                topCountries.forEach((d, i) => {
                    d.rank = i + 1;
                });
                
                // If there's a selected country and it's not in the top N,
                // find it in the full dataset and add it with its actual rank
                if (selectedCountry && !topCountries.find(d => d.country === selectedCountry)) {
                    const selectedCountryData = yearData.find(d => d.country === selectedCountry);
                    if (selectedCountryData) {
                        // Find its rank in the full dataset
                        const rank = yearData.findIndex(d => d.country === selectedCountry) + 1;
                        selectedCountryData.rank = rank;
                        topCountries.push(selectedCountryData);
                    }
                }
                
                return {
                    year: year,
                    countries: topCountries
                };
            });

            console.log("Prepared data:", data);

            // Set the domain for scales based on all data - cap at 8.0
            x.domain([0, 8.0]); // Fixed scale ending at 8.0

            // Create the color legend
            createLegend();

            // Initialize the visualization with the first year
            const firstYearIndex = years.indexOf("2015");
            currentYearIndex = firstYearIndex >= 0 ? firstYearIndex : 0;
            updateChart(currentYearIndex);

            // Set up event listeners - Play/Pause with one button
            const playButton = document.getElementById('play-button');
            const reloadButton = document.getElementById('reload-button');
            
            if (playButton) {
                // Remove all previous event listeners by cloning and replacing
                const playButtonParent = playButton.parentNode;
                const newPlayButton = playButton.cloneNode(false); // Don't clone children/content
                
                // Set the content to play initially
                newPlayButton.textContent = "▶";
                newPlayButton.title = "Play animation";
                
                // Replace the original button with our new clean one
                playButtonParent.replaceChild(newPlayButton, playButton);
                
                // Add event listener to the new button
                newPlayButton.addEventListener('click', function() {
                    if (isPlaying) {
                        pauseAnimation();
                        this.textContent = "▶"; // Use textContent instead of innerHTML
                        this.title = "Play animation";
                    } else {
                        startAnimation();
                        this.textContent = "⏸"; // Use textContent instead of innerHTML
                        this.title = "Pause animation";
                    }
                });
                
                // Start the animation automatically
                startAnimation();
                // Update the button to show pause state
                newPlayButton.textContent = "⏸";
                newPlayButton.title = "Pause animation";
            } else {
                // Start the animation automatically even if no button exists
                startAnimation();
            }
            
            // Make sure the reload button is working
            if (reloadButton) {
                reloadButton.addEventListener('click', function() {
                    window.location.reload();
                });
            }

            // Store the full dataset
            allData = [...csvData];
            
        }).catch(function(error) {
            console.error(`Error loading data from ${path}:`, error);
            // Try the next path
            tryLoadingData(pathIndex + 1);
        });
    }

    // Start trying to load data from the first path
    tryLoadingData(0);

    // Function to start the animation
    function startAnimation() {
        if (isPlaying) return;
        isPlaying = true;
        
        // Start the animation loop
        animationLoop();
    }

    // Function to pause the animation
    function pauseAnimation() {
        isPlaying = false;
        clearTimeout(animationTimer);
    }

    // Animation loop
    function animationLoop() {
        // Make sure we have data before updating
        if (!data || !data.length) return;
        
        // Increment the year index
        currentYearIndex = (currentYearIndex + 1) % years.length;
        
        // Update the chart
        updateChart(currentYearIndex);
        
        // Continue the animation after the specified delay
        if (isPlaying) {
            clearTimeout(animationTimer);
            animationTimer = setTimeout(animationLoop, animationSpeed);
        }
    }

    // Handle window resize
    window.addEventListener('resize', function() {
        clearTimeout(window.resizeTimer);
        window.resizeTimer = setTimeout(function() {
            // Only redraw if not in compact mode (for Tableau we don't need to resize)
            if (!isCompactMode) {
                console.log("Resizing visualization...");
                
                // Get new dimensions
                const newWidth = document.getElementById('leaderboard-chart').clientWidth - margin.left - margin.right;
                const newHeight = document.getElementById('leaderboard-chart').clientHeight - margin.top - margin.bottom;
                
                // Clear the SVG
                d3.select('#leaderboard-chart svg').remove();
                
                // Recreate the SVG
                const svg = d3.select('#leaderboard-chart')
                    .append('svg')
                    .attr('width', newWidth + margin.left + margin.right)
                    .attr('height', newHeight + margin.top + margin.bottom)
                    .append('g')
                    .attr('transform', `translate(${margin.left}, ${margin.top})`);
                
                // Update scales
                x.range([0, newWidth]);
                y.range([0, newHeight]);
                
                // Recreate axes
                xAxis = svg.append('g')
                    .attr('class', 'axis x-axis')
                    .attr('transform', `translate(0, ${newHeight})`)
                    .call(d3.axisBottom(x).tickFormat(d => d.toFixed(1)).ticks(5));
                    
                yAxis = svg.append('g')
                    .attr('class', 'axis y-axis');
                
                // Redraw the current chart
                updateChart(currentYearIndex);
            }
        }, 250);
    });
}); 