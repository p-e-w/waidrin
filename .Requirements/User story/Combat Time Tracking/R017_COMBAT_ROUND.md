----Do not modify this template----
###Story No###
*R017_COMBAT_ROUND*

##Business requirements##
###1-line summary###
Track combat time in 6-second rounds.
###Description###
The system should track combat in discrete 6-second rounds, where each creature takes one turn within that round. This granular tracking is essential for abilities and spells with round-based durations.
###Business Value###
Ensures accurate application of combat mechanics, spell durations, and ability cooldowns, maintaining the integrity of D&D 5e combat.

###User story###
As a Game Master or Player
when my character is engaged in combat
I want the system to track time in 6-second rounds
so that I can accurately manage spell durations, ability uses, and other combat effects.

###Acceptance criteria###
Given a combat encounter has begun
When a round of combat is completed
Then the system advances the combat timer by 6 seconds.

Scenario 1: Spell duration tracking
Given a spell with a duration of "10 rounds" is cast at the start of combat
When 5 rounds of combat have passed
Then the spell has 5 rounds remaining (30 seconds).