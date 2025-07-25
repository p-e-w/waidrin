----Do not modify this template----
###Story No###
*R019_SHORT_REST_TRACKING*

##Business requirements##
###1-line summary###
Track the duration of short rests as 1 hour.
###Description###
The system must enforce that a short rest explicitly lasts for at least 1 hour (60 minutes) of in-game time.
###Business Value###
Ensures proper application of short rest mechanics, allowing characters to regain Hit Points and certain abilities.

###User story###
As a Player
when my character takes a short rest
I want the system to acknowledge that 1 hour of in-game time has passed
so that my character can regain resources and abilities as per D&D 5e rules.

###Acceptance criteria###
Given a character declares a short rest
When the short rest is completed
Then 1 hour of in-game time has passed.

Scenario 1: Short rest completion
Given a character begins a short rest at 10:00 AM
When the short rest is completed
Then the in-game time advances to 11:00 AM.