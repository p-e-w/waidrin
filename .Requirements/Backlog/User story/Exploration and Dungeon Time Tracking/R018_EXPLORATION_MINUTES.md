----Do not modify this template----
###Story No###
*R018_EXPLORATION_MINUTES*

##Business requirements##
###1-line summary###
Track exploration and dungeon time in minutes, typically 10-minute increments.
###Description###
Outside of combat, the system should track time in minutes, often in blocks of 10 minutes, for activities like searching rooms, picking locks, or disarming traps.
###Business Value###
Facilitates resource management (e.g., torch duration, spell durations), enables random encounter checks, and creates a sense of urgency in time-sensitive environments.

###User story###
As a Game Master
when players are exploring a dungeon or performing detailed activities
I want the system to track time in minutes, often in 10-minute increments
so that I can manage time-sensitive resources and trigger appropriate events.

###Acceptance criteria###
Given an exploration activity is initiated
When the activity is completed
Then the system records the passage of time in minutes, typically rounded to the nearest 10-minute increment.

Scenario 1: Searching a room
Given a party decides to thoroughly search a room
When the search is completed
Then 10 minutes of in-game time have passed.