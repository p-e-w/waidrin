----Do not modify this template----
###Story No###
*R021_LONG_REST_TRACKING*

##Business requirements##
###1-line summary###
Track the duration of long rests as 8 hours.
###Description###
The system must enforce that a long rest explicitly lasts for at least 8 hours of in-game time.
###Business Value###
Ensures proper application of long rest mechanics, allowing characters to regain all Hit Points, expended spell slots, and most abilities.

###User story###
As a Player
when my character takes a long rest
I want the system to acknowledge that 8 hours of in-game time has passed
so that my character can fully recover and prepare for further adventures.

###Acceptance criteria###
Given a character declares a long rest
When the long rest is completed
Then 8 hours of in-game time has passed.

Scenario 1: Long rest completion
Given a character begins a long rest at 8:00 PM
When the long rest is completed
Then the in-game time advances to 4:00 AM the next day.