----Do not modify this template----
###Story No###
*R027_XP_MONSTER_AWARD*

##Business requirements##
###1-line summary###
Award experience points to characters for defeating monsters.
###Description###
The system should allow the Game Master to award experience points (XP) to characters based on the challenge rating of defeated monsters, as per D&D 5e guidelines.
###Business Value###
Provides a primary method for character progression, rewarding players for overcoming combat challenges and encouraging engagement with the game world.

###User story###
As a Game Master
when players defeat a monster
I want to be able to award the appropriate experience points to the characters
so that their progress towards leveling up is accurately tracked.

###Acceptance criteria###
Given a monster with a defined XP value is defeated
When the Game Master awards XP for the monster
Then the specified XP amount is added to each participating character's total experience points.

Scenario 1: Awarding XP for a single monster
Given a party of 4 defeats a monster worth 200 XP
When the XP is awarded
Then each character gains 200 XP.