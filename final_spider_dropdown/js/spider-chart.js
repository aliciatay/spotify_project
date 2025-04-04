// Main visualization code
document.addEventListener('DOMContentLoaded', function() {
    // Constants for factors
    const FACTORS = {
        gdp_per_capita: "GDP",
        social_support: "Social\nSupport",
        healthy_life_expectancy: "Life\nExpectancy",
        freedom_to_make_life_choices: "Freedom",
        generosity: "Generosity",
        perceptions_of_corruption: "Corruption"
    };
    
    console.log("Starting to load data...");
    
    // Load the CSV file with an absolute path for GitHub Pages
    d3.csv('https://aliciatay.github.io/CS5346/final_spider_dropdown/complete_world_happiness.csv')
        .then(processData)
        .catch(error => {
            console.error("Failed to load data:", error);
            document.getElementById('spider-chart').innerHTML = `
                <div class="error-message" style="color: #e15759; background-color: #f8f0f0; border: 1px solid #e15759; border-radius: 4px; padding: 20px; text-align: center; max-width: 600px; margin: 0 auto;">
                    <h3 style="margin-top: 0;">Error loading data: ${error.message}</h3>
                    <p>The data file could not be loaded from: <br>
                    <code style="background: #f1f1f1; padding: 2px 5px;">https://aliciatay.github.io/CS5346/final_spider_dropdown/complete_world_happiness.csv</code></p>
                    <p>Please ensure the file exists in your GitHub repository and is correctly named.</p>
                    <p>If using a local server, try: <code style="background: #f1f1f1; padding: 2px 5px;">python -m http.server</code></p>
                    <button onclick="window.location.reload()" style="background-color: #4e79a7; color: white; border: none; padding: 8px 16px; border-radius: 4px; cursor: pointer; margin-top: 10px;">Reload Page</button>
                </div>
            `;
        });
    
    // Process the data once loaded
    function processData(data) {
        console.log("Processing data:", data.slice(0, 5)); // Debug first 5 rows
        
        // Format data - convert strings to numbers
        data.forEach(d => {
            d.year = String(d.year); // Ensure year is a string for consistent matching
            d.happiness_score = +d.happiness_score;
            d.gdp_per_capita = +d.gdp_per_capita;
            d.social_support = +d.social_support;
            d.healthy_life_expectancy = +d.healthy_life_expectancy;
            d.freedom_to_make_life_choices = +d.freedom_to_make_life_choices;
            d.generosity = +d.generosity;
            d.perceptions_of_corruption = +d.perceptions_of_corruption;
        });
        
        // Extract unique regions, countries, and years
        const regions = ['All'].concat([...new Set(data.map(d => d.region))].sort());
        const countries = ['All'].concat([...new Set(data.map(d => d.country))].sort());
        const years = ['All'].concat([...new Set(data.map(d => d.year))].sort((a, b) => b.localeCompare(a))); // Sort years in descending order
        
        console.log("Available years:", years);
        console.log("Available regions:", regions);
        
        // Set up initial filters
        let filters = {
            level: 'By Country',
            region: 'All',
            country: 'All',
            year: 'All'
        };
        
        // Initialize the visualization
        initFilters(regions, countries, years);
        setupD3EventListeners(); // Use D3 for event handling
        updateFilterVisibility();
        updateChart();
        
        // Set up event listeners using D3
        function setupD3EventListeners() {
            console.log("Setting up D3 event listeners");
            
            // Level select
            d3.select('#level-select')
                .on('change', function() {
                    console.log("Level changed to:", this.value);
                    filters.level = this.value;
                    updateFilterVisibility();
                    updateChart();
                });
            
            // Region select
            d3.select('#region-select')
                .on('change', function() {
                    console.log("Region changed to:", this.value);
                    filters.region = this.value;
                    updateChart();
                });
            
            // Country select
            d3.select('#country-select')
                .on('change', function() {
                    console.log("Country changed to:", this.value);
                    filters.country = this.value;
                    updateChart();
                });
            
            // Year select
            d3.select('#year-select')
                .on('change', function() {
                    console.log("Year changed to:", this.value);
                    filters.year = this.value;
                    updateChart();
                });
            
            // Reload button - using the new class name
            d3.select('.reload-button')
                .on('click', function() {
                    console.log("Reload button clicked");
                    window.location.reload();
                });
                
            console.log("D3 event listeners set up successfully");
        }
        
        // Initialize filters with available options
        function initFilters(regions, countries, years) {
            // Populate country dropdown
            const countrySelect = d3.select('#country-select');
            if (!countrySelect.empty()) {
                // Clear existing options
                countrySelect.html('');
                
                // Add all options
                countries.forEach(country => {
                    countrySelect.append('option')
                        .attr('value', country)
                        .text(country);
                });
            }
            
            // Populate year dropdown
            const yearSelect = d3.select('#year-select');
            if (!yearSelect.empty()) {
                // Clear existing options
                yearSelect.html('');
                
                // Add "All" option first
                yearSelect.append('option')
                    .attr('value', 'All')
                    .text('All');
                
                // Add all year options
                years.forEach(year => {
                    if (year !== 'All') { // Skip 'All' since we just added it
                        yearSelect.append('option')
                            .attr('value', year)
                            .text(year);
                    }
                });
            }
            
            console.log("Initialized filters with options");
            
            // Fix reload button if it doesn't exist
            if (d3.select('.reload-button').empty()) {
                const filtersDiv = d3.select('.filters');
                if (!filtersDiv.empty()) {
                    filtersDiv.append('button')
                        .attr('class', 'reload-button')
                        .attr('title', 'Reload Page')
                        .style('width', '36px')
                        .style('height', '36px')
                        .style('display', 'flex')
                        .style('align-items', 'center')
                        .style('justify-content', 'center')
                        .style('cursor', 'pointer')
                        .style('font-size', '16px')  // Reverted to original size
                        .style('background-color', '#f5f5f5')
                        .style('border', '1px solid #ddd')
                        .style('border-radius', '4px')
                        .html('↻');
                }
            }
        }
        
        // Show/hide dropdowns based on level selection
        function updateFilterVisibility() {
            const level = filters.level;
            
            // Show relevant dropdowns based on level
            const regionDropdown = d3.select('#region-select').node()?.parentNode;
            const countryDropdown = d3.select('#country-select').node()?.parentNode;
            
            if (regionDropdown && countryDropdown) {
                if (level === 'By Region') {
                    d3.select(regionDropdown).style('display', 'flex');
                    d3.select(countryDropdown).style('display', 'none');
                } else { // By Country
                    d3.select(regionDropdown).style('display', 'none');
                    d3.select(countryDropdown).style('display', 'flex');
                }
            }
        }
        
        // Update the chart based on current filters
        function updateChart() {
            console.log("Updating chart with filters:", filters);
            
            // Filter data based on selections
            let filteredData = data;
            console.log("Starting with all data:", filteredData.length, "records");
            
            // Filter by year if not 'All'
            if (filters.year !== 'All') {
                filteredData = filteredData.filter(d => d.year === filters.year);
                console.log(`After year filter (${filters.year}): ${filteredData.length} records`);
                console.log("Sample after year filter:", filteredData.slice(0, 2));
                
                // If no data for this specific year, show message
                if (filteredData.length === 0) {
                    showNoDataMessage(`No data available for the year ${filters.year}. Please select a different year.`);
                    return;
                }
            }
            
            // Filter by region or country depending on level
            if (filters.level === 'By Region') {
                if (filters.region !== 'All') {
                    // Debug: Show all unique regions in the filtered data
                    console.log("All regions in current filtered data:", [...new Set(filteredData.map(d => d.region))]);
                    
                    filteredData = filteredData.filter(d => d.region === filters.region);
                    console.log(`After region filter (${filters.region}): ${filteredData.length} records`);
                    console.log("Sample after region filter:", filteredData.slice(0, 2));
                }
            } else { // By Country
                if (filters.country !== 'All') {
                    filteredData = filteredData.filter(d => d.country === filters.country);
                    console.log(`After country filter (${filters.country}): ${filteredData.length} records`);
                    
                    // If no data for this specific country in this year, show message
                    if (filteredData.length === 0) {
                        if (filters.year !== 'All') {
                            showNoDataMessage(`No data available for ${filters.country} in ${filters.year}. Try selecting 'All' for year or choose a different country.`);
                        } else {
                            showNoDataMessage(`No data available for ${filters.country}. Please select a different country.`);
                        }
                        return;
                    }
                }
            }
            
            // Check if we have enough data
            if (filteredData.length < 1) {
                showNoDataMessage('No data available for the selected filters. Please try different filter options.');
                return;
            }
            
            // If we have exactly one data point (country in specific year)
            if (filteredData.length === 1) {
                console.log("Single data point mode - showing raw values instead of correlations");
                // Display the actual factor values directly instead of correlations
                const singleDataPoint = filteredData[0];
                
                // Normalize the factor values to a -1 to 1 scale for display
                // We'll use min-max scaling based on the full dataset's range for each factor
                const factorRanges = {};
                
                Object.keys(FACTORS).forEach(factor => {
                    const allValues = data.map(d => d[factor]);
                    factorRanges[factor] = {
                        min: d3.min(allValues),
                        max: d3.max(allValues)
                    };
                });
                
                const normalizedValues = {};
                Object.keys(FACTORS).forEach(factor => {
                    const range = factorRanges[factor];
                    const value = singleDataPoint[factor];
                    // Normalize to -1 to 1 range
                    const normalized = ((value - range.min) / (range.max - range.min) * 2) - 1;
                    normalizedValues[factor] = normalized;
                });
                
                console.log("Normalized values for single point:", normalizedValues);
                
                // Prepare data for radar chart
                const chartData = [{
                    name: singleDataPoint.country,
                    ...normalizedValues
                }];
                
                console.log("Chart data prepared (single point mode):", chartData);
                
                // Draw the radar chart
                drawRadarChart(chartData, FACTORS);
                return;
            }
            
            // For multiple data points, calculate correlations as before
            const correlations = calculateCorrelations(filteredData);
            console.log("Calculated correlations:", correlations);
            
            // Debug: Check for missing values or NaN in correlations
            Object.keys(correlations).forEach(key => {
                if (isNaN(correlations[key]) || correlations[key] === null || correlations[key] === undefined) {
                    console.error(`Problem with correlation for ${key}: ${correlations[key]}`);
                }
            });
            
            // Prepare data for radar chart
            const chartData = [{
                name: filters.level === 'By Region' ? 
                    (filters.region !== 'All' ? filters.region : 'All Regions') : 
                    (filters.country !== 'All' ? filters.country : 'All Countries'),
                ...correlations
            }];
            
            console.log("Chart data prepared:", chartData);
            
            // Draw the radar chart
            drawRadarChart(chartData, FACTORS);
            
            // After chart is drawn, ensure factor names are properly displayed
            setTimeout(function() {
                // Select all axis labels
                const axisLabels = d3.selectAll('.axis-label');
                
                // Create a mapping for nicer factor names
                const factorNameMap = {
                    "GDP per Capita": "GDP",
                    "Social Support": "Social",
                    "Health Life Expectancy": "Health",
                    "Freedom": "Freedom",
                    "Generosity": "Generosity",
                    "Perceptions of Corruption": "Trust"
                };
                
                // Update the text for better display
                axisLabels.each(function() {
                    const label = d3.select(this);
                    const currentText = label.text();
                    
                    // Check if we have a shorter name for this factor
                    for (const [fullName, shortName] of Object.entries(factorNameMap)) {
                        if (currentText.includes(fullName)) {
                            label.text(shortName);
                            // Add title for tooltip on hover
                            label.append('title').text(fullName);
                            break;
                        }
                    }
                    
                    // Apply styling
                    label.style('font-size', '9px')
                        .style('font-weight', 'normal');
                });
            }, 500);
        }
        
        // Calculate Pearson correlation coefficient for each factor with happiness score
        function calculateCorrelations(data) {
            const correlations = {};
            
            Object.keys(FACTORS).forEach(factor => {
                const happinessValues = data.map(d => d.happiness_score);
                const factorValues = data.map(d => d[factor]);
                
                // Debug: Check for undefined or NaN values
                const hasInvalidValues = happinessValues.some(v => isNaN(v) || v === undefined) || 
                                        factorValues.some(v => isNaN(v) || v === undefined);
                                        
                if (hasInvalidValues) {
                    console.error(`Invalid values found for ${factor}:`, {
                        happiness: happinessValues.filter(v => isNaN(v) || v === undefined),
                        factor: factorValues.filter(v => isNaN(v) || v === undefined)
                    });
                }
                
                // Calculate means
                const happinessMean = d3.mean(happinessValues);
                const factorMean = d3.mean(factorValues);
                
                console.log(`${factor} means:`, { happiness: happinessMean, factor: factorMean });
                
                // Calculate correlation coefficient
                let numerator = 0;
                let denominatorHappiness = 0;
                let denominatorFactor = 0;
                
                for (let i = 0; i < data.length; i++) {
                    const happinessDiff = happinessValues[i] - happinessMean;
                    const factorDiff = factorValues[i] - factorMean;
                    
                    numerator += happinessDiff * factorDiff;
                    denominatorHappiness += happinessDiff * happinessDiff;
                    denominatorFactor += factorDiff * factorDiff;
                }
                
                // Avoid division by zero
                if (denominatorHappiness === 0 || denominatorFactor === 0) {
                    console.error(`Division by zero error for ${factor}`);
                    correlations[factor] = 0; // Default to zero correlation if there's a division by zero
                } else {
                    const correlation = numerator / Math.sqrt(denominatorHappiness * denominatorFactor);
                    correlations[factor] = correlation;
                }
            });
            
            return correlations;
        }
        
        // Show a message when no data is available
        function showNoDataMessage(message = 'Insufficient data for the selected filters. Please try different filter options.') {
            console.log("NO DATA AVAILABLE:", message);
            
            // Clear previous chart but preserve the filter elements
            const container = d3.select('#spider-chart');
            container.html('');
            
            // Add a message with better styling using D3
            container.append('div')
                .attr('class', 'no-data-message')
                .style('background-color', '#f8f0f0')
                .style('border', '1px solid #e15759')
                .style('border-radius', '4px')
                .style('padding', '20px')
                .style('text-align', 'center')
                .style('color', '#e15759')
                .style('font-weight', 'bold')
                .style('max-width', '600px')
                .style('margin', '40px auto')
                .text(message);
                
            // Ensure the filters are still working
            setupD3EventListeners();
        }
        
        // Draw the radar/spider chart
        function drawRadarChart(data, factors) {
            console.log("Drawing radar chart with data:", data);
            
            // Clear previous chart
            d3.select("#spider-chart").html("");
            
            // Custom dimensions for the container with more space for the chart
            const width = 480;  // Reduced width to avoid label cutoff
            const height = 460; // Reduced height to avoid label cutoff
            const margin = {top: 80, right: 80, bottom: 80, left: 80}; // Increased margins for labels
            
            // Create SVG container with adjusted size
            const svg = d3.select('#spider-chart')
                .append('svg')
                .attr('width', width)
                .attr('height', height)
                .append('g')
                .attr('transform', `translate(${width / 2}, ${height / 2})`);
            
            // Adjust radius to fit within constraints but preserve space for labels
            const radius = Math.min(width - margin.left - margin.right, height - margin.top - margin.bottom) / 2;
            
            // Create a scale for each axis
            const radialScale = d3.scaleLinear()
                .domain([-1, 1])
                .range([0, radius]);
            
            // Create angles for each factor - explicitly set them to be evenly distributed
            const angleSlice = Math.PI * 2 / Object.keys(factors).length;
            
            // Create the circular segments
            svg.selectAll('.radar-chart-circle')
                .data(d3.range(-1, 1.1, 0.5))
                .enter()
                .append('circle')
                .attr('class', 'radar-chart-circle')
                .attr('r', d => radialScale(d))
                .style('fill', 'none')
                .style('stroke', '#e2e2e2')
                .style('stroke-width', '1px');
            
            // Add labels for the circular segments
            svg.selectAll('.circle-label')
                .data([-1, -0.5, 0, 0.5, 1])
                .enter()
                .append('text')
                .attr('class', 'circle-label')
                .attr('x', 5)
                .attr('y', d => -radialScale(d))
                .text(d => d.toFixed(1))
                .style('font-size', '10px')
                .style('fill', '#888');
            
            // Add axis lines
            const axes = svg.selectAll('.axis')
                .data(Object.keys(factors))
                .enter()
                .append('g')
                .attr('class', 'axis');
            
            axes.append('line')
                .attr('x1', 0)
                .attr('y1', 0)
                .attr('x2', (d, i) => radialScale(1.1) * Math.cos(angleSlice * i - Math.PI / 2))
                .attr('y2', (d, i) => radialScale(1.1) * Math.sin(angleSlice * i - Math.PI / 2))
                .style('stroke', '#e2e2e2')
                .style('stroke-width', '1px');
            
            // Add axis labels with better positioning
            axes.append('text')
                .attr('class', 'axis-label')
                .attr('x', (d, i) => {
                    const angle = angleSlice * i - Math.PI / 2;
                    // Add extra padding based on position - increased to ensure visibility
                    const paddingFactor = 1.5; // Increased padding factor for better label positioning
                    return radialScale(paddingFactor) * Math.cos(angle);
                })
                .attr('y', (d, i) => {
                    const angle = angleSlice * i - Math.PI / 2;
                    // Add extra padding based on position - increased to ensure visibility
                    const paddingFactor = 1.5; // Increased padding factor for better label positioning
                    return radialScale(paddingFactor) * Math.sin(angle);
                })
                .attr('text-anchor', (d, i) => {
                    const angle = angleSlice * i - Math.PI / 2;
                    // Align text based on position around the circle
                    if (Math.abs(Math.cos(angle)) < 0.3) {
                        // For top and bottom positions
                        return 'middle';
                    } else if (Math.cos(angle) > 0) {
                        // For right side
                        return 'start';
                    } else {
                        // For left side
                        return 'end';
                    }
                })
                .attr('dominant-baseline', (d, i) => {
                    const angle = angleSlice * i - Math.PI / 2;
                    // Vertical alignment based on position
                    if (Math.abs(Math.sin(angle)) < 0.3) {
                        // For positions close to horizontal
                        return 'middle';
                    } else if (Math.sin(angle) < 0) {
                        // For top half
                        return 'baseline';
                    } else {
                        // For bottom half
                        return 'hanging';
                    }
                })
                .style('font-size', '9px') // Decreased font size for better fit
                .style('fill', '#333')
                .each(function(d, i) {
                    const text = d3.select(this);
                    const label = FACTORS[d];
                    const angle = angleSlice * i - Math.PI / 2;
                    
                    // Check if label contains explicit newlines
                    if (label.includes('\n')) {
                        const lines = label.split('\n');
                        
                        // Clear the text
                        text.text('');
                        
                        // Add each line
                        lines.forEach((line, lineIndex) => {
                            text.append('tspan')
                                .attr('x', text.attr('x'))
                                .attr('dy', lineIndex === 0 ? '0em' : '1em') // Decreased line height
                                .attr('text-anchor', text.attr('text-anchor'))
                                .text(line);
                        });
                    } 
                    // Handle long labels without explicit newlines
                    else if (label.length > 15 && label.includes(' ')) {
                        const words = label.split(' ');
                        const midpoint = Math.ceil(words.length / 2);
                        
                        // Clear the text
                        text.text('');
                        
                        // First line
                        text.append('tspan')
                            .attr('x', text.attr('x'))
                            .attr('text-anchor', text.attr('text-anchor'))
                            .text(words.slice(0, midpoint).join(' '));
                        
                        // Second line
                        text.append('tspan')
                            .attr('x', text.attr('x'))
                            .attr('dy', '1.1em')
                            .attr('text-anchor', text.attr('text-anchor'))
                            .text(words.slice(midpoint).join(' '));
                    } else {
                        // For shorter labels, keep as a single line
                        text.text(label);
                    }
                    
                    // Extra padding for label positioning
                    let extraPadding = 20; // Further increased padding for all labels
                    
                    // Apply different padding based on angle
                    let dx = 0, dy = 0;
                    
                    // Add special handling for Social Support
                    if (d === 'social_support') {
                        // Center align for social support regardless of position
                        text.attr('text-anchor', 'middle');
                        // Adjust padding based on angle
                        if (angle > -Math.PI && angle < 0) {
                            extraPadding = 30; // Increased padding for top half
                            dy = -5; // Move up slightly
                        } else {
                            extraPadding = 20; // Normal padding for bottom half
                        }
                    }
                    // Add more padding for labels that need it based on position
                    else if (d === 'healthy_life_expectancy') {
                        extraPadding += 20; // Extra padding for problematic labels
                    }
                    
                    // Fine-tune positions based on angle
                    // Top-left quadrant
                    if (angle > -Math.PI && angle < -Math.PI/2) {
                        dx = -extraPadding;
                        dy = -extraPadding / 2;
                    }
                    // Top-right quadrant
                    else if (angle > -Math.PI/2 && angle < 0) {
                        dx = extraPadding;
                        dy = -extraPadding / 2;
                    }
                    // Bottom-right quadrant
                    else if (angle > 0 && angle < Math.PI/2) {
                        dx = extraPadding;
                        dy = extraPadding / 2;
                    }
                    // Bottom-left quadrant
                    else {
                        dx = -extraPadding;
                        dy = extraPadding / 2;
                    }
                    
                    // Apply the adjustment
                    text.attr('dx', dx).attr('dy', dy);
                });
            
            // Create radar path function
            const radarLine = d3.lineRadial()
                .radius(d => radialScale(d.value))
                .angle((d, i) => i * angleSlice)
                .curve(d3.curveLinearClosed);
            
            // Define Tableau-like color palette
            const tableauColors = [
                '#4e79a7', '#f28e2c', '#e15759', '#76b7b2', 
                '#59a14f', '#edc949', '#af7aa1', '#ff9da7', 
                '#9c755f', '#bab0ab'
            ];
            
            // Generate a color scale using Tableau colors
            const color = d3.scaleOrdinal(tableauColors);
            
            // Draw the radar chart paths for each data point
            data.forEach((d, i) => {
                const dataValues = Object.keys(factors).map(factor => {
                    const value = d[factor] || 0;
                    return { factor, value };
                });
                
                svg.append('path')
                    .datum(dataValues)
                    .attr('class', 'radar-chart-shape')
                    .attr('d', radarLine)
                    .style('fill', color(i))
                    .style('fill-opacity', 0.6)
                    .style('stroke', color(i))
                    .style('stroke-width', '1.5px');
            });
            
            // Modify the wrap function to ensure labels are never cut off
            function wrap(text, width) {
                text.each(function() {
                    const text = d3.select(this);
                    const words = text.text().split(/\s+/).reverse();
                    const textAnchor = text.attr('text-anchor') || 'middle';
                    
                    // For factor names, break into two lines for better visibility
                    if (text.classed('axis-label')) {
                        // Increase the distance from the center for better visibility
                        const currentTransform = text.attr('transform');
                        if (currentTransform) {
                            // Extract translate values
                            const match = currentTransform.match(/translate\(([^,]+),([^)]+)\)/);
                            if (match) {
                                const x = parseFloat(match[1]);
                                const y = parseFloat(match[2]);
                                // Calculate a multiplier to push labels further out
                                const magnitude = Math.sqrt(x*x + y*y);
                                const normalizedX = x / magnitude;
                                const normalizedY = y / magnitude;
                                // Push labels further out, especially for longer labels
                                const pushFactor = radius * 0.25; // 25% extra distance
                                const newX = x + normalizedX * pushFactor;
                                const newY = y + normalizedY * pushFactor;
                                text.attr('transform', `translate(${newX},${newY})`);
                            }
                        }
                        
                        // Skip additional processing if already handled by the each function
                        if (text.text() === '') return;
                        
                        // Break long text into two lines instead of truncating
                        const fullText = text.text();
                        text.text(null); // Clear existing text
                        
                        // Split the text into words
                        const words = fullText.split(/\s+/);
                        
                        if (words.length > 1) {
                            // If there are multiple words, try to split at a logical point
                            const midpoint = Math.ceil(words.length / 2);
                            
                            // Create first line
                            const tspan1 = text.append('tspan')
                                .attr('dy', '-0.5em')
                                .text(words.slice(0, midpoint).join(' '));
                                
                            // Create second line
                            const tspan2 = text.append('tspan')
                                .attr('dy', '1em')
                                .text(words.slice(midpoint).join(' '));
                                
                            // Apply proper text anchoring to each tspan
                            if (textAnchor === 'end') {
                                tspan1.attr('x', 0).attr('text-anchor', 'end');
                                tspan2.attr('x', 0).attr('text-anchor', 'end');
                            } else if (textAnchor === 'start') {
                                tspan1.attr('x', 0).attr('text-anchor', 'start');
                                tspan2.attr('x', 0).attr('text-anchor', 'start');
                            } else {
                                tspan1.attr('x', 0).attr('text-anchor', 'middle');
                                tspan2.attr('x', 0).attr('text-anchor', 'middle');
                            }
                        } else if (fullText.length > 10) {
                            // If it's a single long word, break it in the middle
                            const midpoint = Math.floor(fullText.length / 2);
                            
                            // Find a good breaking point near the middle
                            let breakPoint = midpoint;
                            while (breakPoint > 0 && 
                                   !fullText.charAt(breakPoint).match(/[^a-zA-Z0-9]/)) {
                                breakPoint--;
                            }
                            
                            // If no good breaking point, just use midpoint
                            if (breakPoint <= 0) breakPoint = midpoint;
                            
                            // Create first line
                            const tspan1 = text.append('tspan')
                                .attr('dy', '-0.5em')
                                .text(fullText.substring(0, breakPoint + 1));
                                
                            // Create second line
                            const tspan2 = text.append('tspan')
                                .attr('dy', '1em')
                                .text(fullText.substring(breakPoint + 1));
                                
                            // Apply proper text anchoring to each tspan
                            if (textAnchor === 'end') {
                                tspan1.attr('x', 0).attr('text-anchor', 'end');
                                tspan2.attr('x', 0).attr('text-anchor', 'end');
                            } else if (textAnchor === 'start') {
                                tspan1.attr('x', 0).attr('text-anchor', 'start');
                                tspan2.attr('x', 0).attr('text-anchor', 'start');
                            } else {
                                tspan1.attr('x', 0).attr('text-anchor', 'middle');
                                tspan2.attr('x', 0).attr('text-anchor', 'middle');
                            }
                        } else {
                            // For short text, keep it on one line
                            text.text(fullText);
                        }
                    } else {
                        // Regular wrapping for other text elements
                        let line = [];
                        let lineNumber = 0;
                        const lineHeight = 1.1; // ems
                        const y = text.attr("y");
                        const dy = parseFloat(text.attr("dy") || 0);
                        let tspan = text.text(null).append("tspan").attr("x", 0).attr("y", y).attr("dy", dy + "em");
                        
                        let word;
                        while (word = words.pop()) {
                            line.push(word);
                            tspan.text(line.join(" "));
                            if (tspan.node().getComputedTextLength() > width) {
                                line.pop();
                                tspan.text(line.join(" "));
                                line = [word];
                                tspan = text.append("tspan").attr("x", 0).attr("y", y).attr("dy", ++lineNumber * lineHeight + dy + "em").text(word);
                            }
                        }
                    }
                });
            }
        }
    }
});
