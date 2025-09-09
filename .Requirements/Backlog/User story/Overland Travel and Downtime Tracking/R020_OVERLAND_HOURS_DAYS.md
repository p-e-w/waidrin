----Do not modify this template----
###Story No###
*R020_OVERLAND_HOURS_DAYS*

##Business requirements##
###1-line summary###
Track overland travel time in hours and days.
###Description###
For long-distance travel, the system should track time in hours and days, allowing for different travel paces (slow, normal, fast) and calculating distance covered.
###Business Value###
Manages long-term plotlines, tracks the passage of time for environmental changes, and facilitates realistic travel scenarios.

###User story###
As a Game Master
when players are undertaking long-distance travel
I want the system to track time in hours and days
so that I can accurately represent travel duration and distance covered.

###Acceptance criteria###
Given a party begins overland travel at a specified pace
When a period of travel is completed
Then the system calculates and records the elapsed hours and days, and the distance covered.

Scenario 1: Normal travel pace for 8 hours
Given a party travels at a normal pace for 8 hours
When the travel period ends
Then 8 hours of in-game time have passed, and the appropriate distance for normal pace travel is recorded.