# Platform Hit Songs by Genre Distribution

This visualization uses a parallel sets approach to show how hit songs flow from different music platforms into various music genres.

## Understanding the Visualization

The parallel sets visualization represents:
- **Left Column**: Music platforms (Spotify, YouTube, TikTok, etc.)
- **Right Column**: Music genres from the Spotify dataset
- **Connecting Ribbons**: The width of each ribbon represents the number of hit songs from a specific platform that belong to a specific genre

## How It Works

1. The visualization loads data from the Spotify dataset (`final_df_cleaned.csv`)
2. For each song, it identifies its genre and checks if it's a hit on different platforms (based on the {Platform}_Hit columns)
3. It creates flows between platforms and genres where hits occur
4. The diagram visualizes these connections as ribbons, with wider ribbons indicating more hit songs

## Interactions

- **Hover over a platform**: See the total number of hit songs on that platform
- **Hover over a genre**: See the total number of hit songs in that genre across all platforms
- **Hover over a ribbon**: See exactly how many hit songs from a specific platform belong to a specific genre
- **Filter by minimum hits**: Use the slider to filter flows by minimum number of hit songs
- **Filter by genre**: Use the dropdown to focus on a specific genre
- **Filter by platform**: Use the checkboxes to include/exclude specific platforms

## Insights to Look For

1. Which platforms have the most hit songs?
2. How do platforms distribute their hits across different genres?
3. Which genres receive the most hit songs?
4. Are certain platforms more genre-specialized than others?

## Technical Implementation

The visualization is built using:
- D3.js for DOM manipulation and visualization
- Parallel sets visualization technique
- CSV parsing for data loading

## Data Source

The data comes from a Spotify dataset that includes information about songs, their audio features, and their performance across different streaming platforms.

## Browser Compatibility

This visualization works best in modern browsers (Chrome, Firefox, Safari, Edge). 