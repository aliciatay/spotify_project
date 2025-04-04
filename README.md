# Spotify Hit Analysis - Parallel Coordinates Visualization

This visualization explores the relationship between various audio features and platform success for songs in the Spotify dataset. A song is considered a "Hit" if it performs well on 5 or more platforms.

## Features

The visualization includes the following audio features:
- Danceability
- Energy
- Valence
- Tempo
- Loudness
- Acousticness
- Instrumentalness
- Beat Strength
- Harmonic to Percussive Ratio

## How to Use

1. Open `index.html` in a web browser
2. The visualization shows parallel coordinates for all songs, with:
   - Green lines representing hits (5+ platforms)
   - Gray lines representing non-hits
3. Use the brush handles on each axis to filter the data
4. Hover over lines to see song details

## Technical Details

- Built with D3.js v7
- Uses parallel coordinates technique
- Interactive brushing for data filtering
- Responsive design

## Data Source

The visualization uses data from the Spotify dataset, which includes various audio features and platform performance metrics.

## Setup

1. Clone the repository
2. Ensure the data file (`final_df_cleaned.csv`) is in the correct location
3. Open `index.html` in a web browser

## Dependencies

- D3.js v7
- D3 Parallel Coordinates 