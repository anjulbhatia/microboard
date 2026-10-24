# Prompt library

## First board

> Load this CSV, inspect it, filter out rows with empty values in `signups`, group visitors by channel, then add a bar chart of visitors by channel and a KPI for total signups.

## Month-over-month

> Load the sample data. Group signups by month, sort descending, add a line chart of signups by month, then add a table of the cleaned rows.

## Data cleaning

> Inspect the data. Remove duplicate rows by `month` and `channel`, replace `paid` with `paid-search`, fill empty `signups` with 0, then show the cleaned table and a sparkline of visitors.

## Multi-chart board

> Load the sample data. Add a KPI of total signups, a bar chart of visitors by channel, and a line chart of signups by month. Then export the board as PNG and as interactive HTML.

## Audit the recipe

> Show the board state, list every step in order, explain how `cleaned` is derived from `raw`, and export the board JSON.

## Version conflict drill

> Propose a sort by visitors. Before applying it, update a widget title. Then try to apply the stale sort proposal and explain why it failed.
