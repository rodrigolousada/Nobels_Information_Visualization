# Nobels_Information_Visualization
D3.js project, presenting a visualization about Nobel Prize winners

Our visualization contemples some hidden aspects to take into account:
- Legends regarding highlighted information, only appears while there exists highlighted elements, as it is example the legends on the map while a dot is selected, and the legend on the chord chart while a connection is highlighted.


### Before running the project please notice that:
- It might be necessary to refresh the page after running it for the first time
- As the mouseover/out actions were not possible to block, please do not move the mouse until the entering transitions of the scatterplot and bar chart ends, with the entry of the dashed line representing the average age. The group chose to keep on this transitions as it gives a great visual first look to the dashboard.


### Bug report:
- After a long search on the internet the group found a problem recognized by the creator of D3js himself that still as no fix in the current versions. While mouseovering a winner on the scatterplot, please do not click on the same plot. Such action will disable the brushing action on the scatterplot.
