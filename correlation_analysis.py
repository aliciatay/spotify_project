import pandas as pd
import numpy as np

# Read the CSV file
df = pd.read_csv('final_df_cleaned.csv')

# List of MFCC features
mfcc_features = [f'mfcc_{i}' for i in range(1, 14)]

# Get all platforms (columns ending with _Hit)
platforms = [col.replace('_Hit', '') for col in df.columns if col.endswith('_Hit')]

# Initialize lists to store correlation results
correlations = []

# Calculate correlations for each platform and MFCC feature
for platform in platforms:
    hit_column = f'{platform}_Hit'
    for mfcc in mfcc_features:
        correlation = df[mfcc].corr(df[hit_column])
        correlations.append({
            'Platform': platform,
            'MFCC_Feature': mfcc,
            'Correlation': correlation
        })

# Create correlation dataframe
corr_df = pd.DataFrame(correlations)

# Save to CSV
corr_df.to_csv('mfcc_platform_correlations.csv', index=False)

print("Correlation analysis completed and saved to mfcc_platform_correlations.csv")

# Display summary of strongest correlations for each platform
for platform in platforms:
    platform_corrs = corr_df[corr_df['Platform'] == platform].sort_values('Correlation', key=abs, ascending=False)
    print(f"\nTop correlations for {platform}:")
    print(platform_corrs.head(3)) 