----Do not modify this template----
###Story No###
*R022_DOWNTIME_WEEKS_MONTHS*

##Business requirements##
###1-line summary###
Track downtime activities in weeks and months.
###Description###
For extended downtime activities like crafting, training, or research, the system should track time in weeks or months, allowing for narrative fast-forwarding.
###Business Value###
Supports long-term character development, allows for the resolution of extended in-game activities, and provides a sense of the world continuing outside of active adventuring.

###User story###
As a Game Master
when players are engaging in downtime activities
I want the system to track time in weeks or months
so that I can manage the progression of long-term character and world events.

###Acceptance criteria###
Given a character begins a downtime activity with a specified duration
When the downtime activity is completed
Then the system records the passage of time in weeks or months.

Scenario 1: Crafting an item over 2 weeks
Given a character begins crafting an item that takes 2 weeks
When the crafting is completed
Then 2 weeks of in-game time have passed.